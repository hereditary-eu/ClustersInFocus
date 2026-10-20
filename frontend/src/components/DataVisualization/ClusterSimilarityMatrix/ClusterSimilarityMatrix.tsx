import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Grid, type CellComponentProps } from "react-window";
import { ClusteringService } from "../../../services/ClusteringService";
import { useAppStore } from "../../../stores/useAppStore";
import { toast } from "../../../stores/useToastStore";
import { getNumericColumns } from "../../../utils/validation";
import styles from "./ClusterSimilarityMatrix.module.css";

interface FeaturePairMatrixData {
  features: string[];
  similarities: number[][];
  stats: {
    min_similarity: number;
    max_similarity: number;
    size: number;
  };
}

interface ClusterSimilarityMatrixProps {
  width: number;
  height: number;
}

interface CellData {
  featurePairMatrixData: FeaturePairMatrixData;
  onCellHover: (rowIndex: number, colIndex: number, event: React.MouseEvent) => void;
  onCellLeave: () => void;
  colorRangeMode: "min-max" | "full";
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  content: {
    rowCluster: string;
    colCluster: string;
    similarity: string;
  } | null;
}

const CELL_SIZE = 16;
const ROW_HEADER_WIDTH = 120;
const COLUMN_HEADER_HEIGHT = 80;

const MatrixCell = ({
  columnIndex,
  rowIndex,
  style,
  featurePairMatrixData,
  onCellHover,
  onCellLeave,
  colorRangeMode,
}: CellComponentProps<CellData>) => {

  if (rowIndex === 0 && columnIndex === 0) {
    return (
      <div style={style} className={`${styles.headerCell} ${styles.cornerCell}`}>
        Features
      </div>
    );
  }

  if (rowIndex === 0) {
    const featureIndex = columnIndex - 1;
    const feature = featurePairMatrixData.features[featureIndex];
    return (
      <div style={style} className={`${styles.headerCell} ${styles.columnHeader}`} title={feature}>
        {feature}
      </div>
    );
  }

  if (columnIndex === 0) {
    const featureIndex = rowIndex - 1;
    const feature = featurePairMatrixData.features[featureIndex];
    return (
      <div style={style} className={`${styles.headerCell} ${styles.rowHeader}`} title={feature}>
        {feature}
      </div>
    );
  }

  const dataRowIndex = rowIndex - 1;
  const dataColIndex = columnIndex - 1;
  const similarity = featurePairMatrixData.similarities[dataRowIndex]?.[dataColIndex] ?? 0;
  const isDiagonal = dataRowIndex === dataColIndex;

  let normalizedValue: number;
  if (colorRangeMode === "full") {
    normalizedValue = similarity;
  } else {
    normalizedValue =
      featurePairMatrixData.stats.max_similarity !== featurePairMatrixData.stats.min_similarity
        ? (similarity - featurePairMatrixData.stats.min_similarity) /
          (featurePairMatrixData.stats.max_similarity - featurePairMatrixData.stats.min_similarity)
        : 0.5;
  }

  const cellStyle = {
    ...style,
    "--normalized-value": normalizedValue,
  } as React.CSSProperties;

  return (
    <div
      style={cellStyle}
      className={`${styles.cell} ${isDiagonal ? styles.diagonal : ""}`}
      onMouseEnter={(e) => !isDiagonal && onCellHover(dataRowIndex, dataColIndex, e)}
      onMouseLeave={onCellLeave}
    >
      {!isDiagonal && <div className={styles.heatmapCell} />}
    </div>
  );
};

const ClusterSimilarityMatrix: React.FC<ClusterSimilarityMatrixProps> = ({ width, height }) => {
  const data = useAppStore(state => state.data);
  const selectedCluster = useAppStore(state => state.selectedCluster);
  const selectedColumns = useAppStore(state => state.selectedColumns);
  const [featurePairMatrixData, setFeaturePairMatrixData] = useState<FeaturePairMatrixData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [aggregationMethod, setAggregationMethod] = useState<string>("max");
  const [colorRangeMode, setColorRangeMode] = useState<"min-max" | "full">("min-max");
  const [reorderMethod, setReorderMethod] = useState<"none" | "optimal" | "average">("none");
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    content: null,
  });
  const numericColumns = useMemo(() => getNumericColumns(data.csvData), [data.csvData]);

  useEffect(() => {
    if (!data.fileId) {
      setFeaturePairMatrixData(null);
      return;
    }

    if (selectedCluster === null || selectedColumns.length !== 2) {
      setFeaturePairMatrixData(null);
      return;
    }

    const fetchMatrixData = async () => {
      setLoading(true);
      try {
        const matrixData = await ClusteringService.getFeaturePairSimilarityMatrix(
          data.fileId!,
          selectedColumns[0],
          selectedColumns[1],
          selectedCluster,
          numericColumns,
          aggregationMethod,
          reorderMethod,
        );

        if (matrixData) {
          setFeaturePairMatrixData(matrixData);
        } else {
          toast.error(
            "No feature pair similarity data available. Please ensure clusters have been computed for the selected feature pair.",
          );
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        if (errorMessage.includes("not found for feature pair")) {
          toast.error(
            "Selected cluster not found. The selected cluster may not exist for this feature pair, or clusters may need to be recomputed.",
          );
        } else {
          toast.error(`Failed to load feature pair similarity matrix: ${errorMessage}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMatrixData();
  }, [data.fileId, numericColumns, selectedCluster, selectedColumns, aggregationMethod, reorderMethod]);

  const handleCellHover = useCallback(
    (rowIndex: number, colIndex: number, event: React.MouseEvent) => {
      if (!featurePairMatrixData) return;

      const similarity = featurePairMatrixData.similarities[rowIndex]?.[colIndex];
      const rowFeature = featurePairMatrixData.features[rowIndex];
      const colFeature = featurePairMatrixData.features[colIndex];

      if (similarity !== undefined && rowFeature && colFeature) {
        setTooltip({
          visible: true,
          x: event.clientX + 10,
          y: event.clientY - 60,
          content: {
            rowCluster: rowFeature,
            colCluster: colFeature,
            similarity: `${(similarity * 100).toFixed(1)}%`,
          },
        });
      }
    },
    [featurePairMatrixData],
  );

  const handleCellLeave = useCallback(() => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  }, []);

  const cellData = useMemo<CellData | null>(() => {
    if (!featurePairMatrixData) return null;

    return {
      featurePairMatrixData,
      onCellHover: handleCellHover,
      onCellLeave: handleCellLeave,
      colorRangeMode,
    };
  }, [featurePairMatrixData, handleCellHover, handleCellLeave, colorRangeMode]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading feature pair similarity matrix...</div>
      </div>
    );
  }

  if (selectedCluster === null || selectedColumns.length !== 2) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <p>Select a cluster point in the visualization to view feature pair similarities.</p>
          <p>This will show how the selected cluster compares across different feature combinations.</p>
        </div>
      </div>
    );
  }

  if (!featurePairMatrixData || !cellData) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>No similarity matrix data available. Please compute clusters first.</div>
      </div>
    );
  }

  if (featurePairMatrixData.features.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>No features found for similarity comparison.</div>
      </div>
    );
  }

  const gridSize = featurePairMatrixData.features.length + 1;
  const getColumnWidth = (index: number) => (index === 0 ? ROW_HEADER_WIDTH : CELL_SIZE);
  const getRowHeight = (index: number) => (index === 0 ? COLUMN_HEADER_HEIGHT : CELL_SIZE);

  const totalWidth = ROW_HEADER_WIDTH + (gridSize - 1) * CELL_SIZE;
  const totalHeight = COLUMN_HEADER_HEIGHT + (gridSize - 1) * CELL_SIZE;

  const gridWidth = Math.min(width, totalWidth);
  const gridHeight = Math.min(height - 40, totalHeight);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          Feature Pair Matrix for Cluster {selectedCluster + 1} ({selectedColumns[0]}, {selectedColumns[1]}):{" "}
          {featurePairMatrixData.features.length} features,
          <span className={styles.aggregationIndicator}> Aggregation: {aggregationMethod.toUpperCase()}, </span>
          <span className={styles.colorRangeIndicator}>
            {" "}
            Color Range: {colorRangeMode === "full" ? "0-100%" : "Min-Max"}
          </span>
        </div>
        <div className={styles.controls}>
          <button
            className={styles.controlButton}
            onClick={(e) => {
              e.stopPropagation();
              setShowConfig(!showConfig);
            }}
            title="Configure matrix options"
          >
            {"\u2699"}
          </button>
        </div>
      </div>

      {showConfig && (
        <div className={styles.configPanel}>
          <div className={styles.configSection}>
            <h4>Aggregation</h4>
            <div className={styles.configGroup}>
              <label>Aggregation Method:</label>
              <select
                value={aggregationMethod}
                onChange={(e) => setAggregationMethod(e.target.value)}
                className={styles.configSelect}
              >
                <option value="max">Maximum</option>
                <option value="avg">Average</option>
                <option value="min">Minimum</option>
                <option value="median">Median</option>
              </select>
            </div>
          </div>

          <div className={styles.configSection}>
            <h4>Color Scale</h4>
            <div className={styles.configGroup}>
              <label>Color Range:</label>
              <select
                value={colorRangeMode}
                onChange={(e) => setColorRangeMode(e.target.value as "min-max" | "full")}
                className={styles.configSelect}
              >
                <option value="min-max">Min-Max Range</option>
                <option value="full">Full Range (0-100%)</option>
              </select>
            </div>
          </div>

          <div className={styles.configSection}>
            <h4>Matrix Ordering</h4>
            <div className={styles.configGroup}>
              <label>Reorder Method:</label>
              <select
                value={reorderMethod}
                onChange={(e) => setReorderMethod(e.target.value as "none" | "optimal" | "average")}
                className={styles.configSelect}
              >
                <option value="none">Original Order</option>
                <option value="optimal">Optimal Leaf Ordering</option>
                <option value="average">Average Similarity</option>
              </select>
            </div>
          </div>

          <div className={styles.configSection}>
            <h4>Similarity Color Scale</h4>
            <div className={styles.configGroup}>
              <div className={styles.colorbarContainer}>
                <div className={styles.colorbarGradient}></div>
                <div className={styles.colorbarLabels}>
                  <span className={styles.colorbarLabelLeft}>Low</span>
                  <span className={styles.colorbarLabelRight}>High</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={styles.viewport}>
        <Grid
          className={styles.grid}
          columnCount={gridSize}
          rowCount={gridSize}
          columnWidth={getColumnWidth}
          rowHeight={getRowHeight}
          style={{ width: gridWidth, height: gridHeight }}
          cellComponent={MatrixCell}
          cellProps={cellData}
        />
      </div>

      {tooltip.visible && tooltip.content && (
        <div
          className={styles.tooltip}
          style={{
            left: tooltip.x,
            top: tooltip.y,
          }}
        >
          <div className={styles.tooltipLine}>
            <strong>Row:</strong> {tooltip.content.rowCluster}
          </div>
          <div className={styles.tooltipLine}>
            <strong>Col:</strong> {tooltip.content.colCluster}
          </div>
          <div className={styles.tooltipLine}>
            <strong>Similarity:</strong> {tooltip.content.similarity}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClusterSimilarityMatrix;
