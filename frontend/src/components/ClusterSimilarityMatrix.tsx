import React, { useState, useEffect, useMemo, useCallback } from "react";
import { VariableSizeGrid as Grid } from "react-window";
import { ClusteringService } from "../services/ClusteringService";
import "./styles/ClusterSimilarityMatrix.css";

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
  fileId?: string;
  width: number;
  height: number;
  selectedCluster: number | null;
  selectedColumns: string[];
  allColumns: string[];
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

const MatrixCell = React.memo<{
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: CellData;
}>(({ columnIndex, rowIndex, style, data }) => {
  const { featurePairMatrixData, onCellHover, onCellLeave, colorRangeMode } = data;

  // Header cells
  if (rowIndex === 0 && columnIndex === 0) {
    // Corner cell
    return (
      <div style={style} className="matrix-header-cell matrix-corner-cell">
        Features
      </div>
    );
  }

  if (rowIndex === 0) {
    // Column header
    const featureIndex = columnIndex - 1;
    const feature = featurePairMatrixData.features[featureIndex];
    return (
      <div style={style} className="matrix-header-cell matrix-column-header" title={feature}>
        {feature}
      </div>
    );
  }

  if (columnIndex === 0) {
    // Row header
    const featureIndex = rowIndex - 1;
    const feature = featurePairMatrixData.features[featureIndex];
    return (
      <div style={style} className="matrix-header-cell matrix-row-header" title={feature}>
        {feature}
      </div>
    );
  }

  // Data cell
  const dataRowIndex = rowIndex - 1;
  const dataColIndex = columnIndex - 1;
  const similarity = featurePairMatrixData.similarities[dataRowIndex]?.[dataColIndex] ?? 0;
  const isDiagonal = dataRowIndex === dataColIndex;

  // Calculate normalized value based on color range mode
  let normalizedValue: number;
  if (colorRangeMode === "full") {
    // Use full 0-100% range
    normalizedValue = similarity;
  } else {
    // Use min-max range
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
      className={`matrix-cell ${isDiagonal ? "diagonal" : ""}`}
      onMouseEnter={(e) => !isDiagonal && onCellHover(dataRowIndex, dataColIndex, e)}
      onMouseLeave={onCellLeave}
    >
      {!isDiagonal && <div className="similarity-matrix-heatmap-cell" />}
    </div>
  );
});

MatrixCell.displayName = "MatrixCell";

const ClusterSimilarityMatrix: React.FC<ClusterSimilarityMatrixProps> = ({
  fileId,
  width,
  height,
  selectedCluster,
  selectedColumns,
  allColumns,
}) => {
  const [featurePairMatrixData, setFeaturePairMatrixData] = useState<FeaturePairMatrixData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    if (!fileId) {
      setFeaturePairMatrixData(null);
      setError(null);
      return;
    }

    // Only fetch data if a cluster is selected
    if (selectedCluster === null || selectedColumns.length !== 2) {
      setFeaturePairMatrixData(null);
      return;
    }

    const fetchMatrixData = async () => {
      setLoading(true);
      setError(null);
      try {
        const numericColumns = allColumns.filter(() => {
          // WIP: check if column is numeric
          return true;
        });

        const data = await ClusteringService.getFeaturePairSimilarityMatrix(
          fileId,
          selectedColumns[0],
          selectedColumns[1],
          selectedCluster,
          numericColumns,
          aggregationMethod,
          reorderMethod,
        );

        if (data) {
          setFeaturePairMatrixData(data);
        } else {
          setError(
            "No feature pair similarity data available. Please ensure clusters have been computed for the selected feature pair.",
          );
        }
      } catch (err) {
        console.error("Error fetching feature pair similarity matrix:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        if (errorMessage.includes("not found for feature pair")) {
          setError(
            "Selected cluster not found. The selected cluster may not exist for this feature pair, or clusters may need to be recomputed.",
          );
        } else {
          setError(`Failed to load feature pair similarity matrix: ${errorMessage}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMatrixData();
  }, [fileId, selectedCluster, selectedColumns, allColumns, aggregationMethod, reorderMethod]);

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
      <div className="cluster-similarity-matrix-container">
        <div className="matrix-loading">Loading feature pair similarity matrix...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cluster-similarity-matrix-container">
        <div className="matrix-error">{error}</div>
      </div>
    );
  }

  // Show message when no cluster is selected
  if (selectedCluster === null || selectedColumns.length !== 2) {
    return (
      <div className="cluster-similarity-matrix-container">
        <div className="matrix-empty">
          <p>Select a cluster point in the visualization to view feature pair similarities.</p>
          <p>This will show how the selected cluster compares across different feature combinations.</p>
        </div>
      </div>
    );
  }

  if (!featurePairMatrixData || !cellData) {
    return (
      <div className="cluster-similarity-matrix-container">
        <div className="matrix-empty">No similarity matrix data available. Please compute clusters first.</div>
      </div>
    );
  }

  if (featurePairMatrixData.features.length === 0) {
    return (
      <div className="cluster-similarity-matrix-container">
        <div className="matrix-empty">No features found for similarity comparison.</div>
      </div>
    );
  }

  const gridSize = featurePairMatrixData.features.length + 1; // +1 for headers

  // Calculate dynamic dimensions
  const getColumnWidth = (index: number) => (index === 0 ? ROW_HEADER_WIDTH : CELL_SIZE);
  const getRowHeight = (index: number) => (index === 0 ? COLUMN_HEADER_HEIGHT : CELL_SIZE);

  const totalWidth = ROW_HEADER_WIDTH + (gridSize - 1) * CELL_SIZE;
  const totalHeight = COLUMN_HEADER_HEIGHT + (gridSize - 1) * CELL_SIZE;

  const gridWidth = Math.min(width, totalWidth);
  const gridHeight = Math.min(height - 40, totalHeight); // -40 for header

  return (
    <div className="cluster-similarity-matrix-container">
      <div className="matrix-header">
        <div className="matrix-stats">
          Feature Pair Matrix for Cluster {selectedCluster! + 1} ({selectedColumns[0]}, {selectedColumns[1]}):{" "}
          {featurePairMatrixData.features.length} features,
          {/* Range: {(featurePairMatrixData.stats.min_similarity * 100).toFixed(1)}% - {(featurePairMatrixData.stats.max_similarity * 100).toFixed(1)}% */}
          <span className="aggregation-indicator"> Aggregation: {aggregationMethod.toUpperCase()}, </span>
          <span className="color-range-indicator">
            {" "}
            Color Range: {colorRangeMode === "full" ? "0-100%" : "Min-Max"}
          </span>
        </div>
        <div className="matrix-controls">
          <button
            className="matrix-control-button"
            onClick={(e) => {
              e.stopPropagation();
              setShowConfig(!showConfig);
            }}
            title="Configure matrix options"
          >
            ⚙️
          </button>
        </div>
      </div>

      {showConfig && (
        <div className="matrix-config-panel">
          <div className="config-section">
            <h4>Aggregation</h4>
            <div className="config-group">
              <label>Aggregation Method:</label>
              <select
                value={aggregationMethod}
                onChange={(e) => setAggregationMethod(e.target.value)}
                className="config-select"
              >
                <option value="max">Maximum</option>
                <option value="avg">Average</option>
                <option value="min">Minimum</option>
                <option value="median">Median</option>
              </select>
            </div>
          </div>

          <div className="config-section">
            <h4>Color Scale</h4>
            <div className="config-group">
              <label>Color Range:</label>
              <select
                value={colorRangeMode}
                onChange={(e) => setColorRangeMode(e.target.value as "min-max" | "full")}
                className="config-select"
              >
                <option value="min-max">Min-Max Range</option>
                <option value="full">Full Range (0-100%)</option>
              </select>
            </div>
          </div>

          <div className="config-section">
            <h4>Matrix Ordering</h4>
            <div className="config-group">
              <label>Reorder Method:</label>
              <select
                value={reorderMethod}
                onChange={(e) => setReorderMethod(e.target.value as "none" | "optimal" | "average")}
                className="config-select"
              >
                <option value="none">Original Order</option>
                <option value="optimal">Optimal Leaf Ordering</option>
                <option value="average">Average Similarity</option>
              </select>
            </div>
          </div>

          <div className="config-section">
            <h4>Similarity Color Scale</h4>
            <div className="config-group">
              <div className="colorbar-container">
                <div className="colorbar-gradient"></div>
                <div className="colorbar-labels">
                  <span className="colorbar-label-left">Low</span>
                  <span className="colorbar-label-right">High</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="matrix-viewport">
        <Grid
          className="matrix-grid"
          columnCount={gridSize}
          rowCount={gridSize}
          columnWidth={getColumnWidth}
          rowHeight={getRowHeight}
          width={gridWidth}
          height={gridHeight}
          itemData={cellData}
        >
          {MatrixCell}
        </Grid>
      </div>

      {tooltip.visible && tooltip.content && (
        <div
          className="similarity-tooltip"
          style={{
            left: tooltip.x,
            top: tooltip.y,
          }}
        >
          <div className="tooltip-line">
            <strong>Row:</strong> {tooltip.content.rowCluster}
          </div>
          <div className="tooltip-line">
            <strong>Col:</strong> {tooltip.content.colCluster}
          </div>
          <div className="tooltip-line">
            <strong>Similarity:</strong> {tooltip.content.similarity}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClusterSimilarityMatrix;
