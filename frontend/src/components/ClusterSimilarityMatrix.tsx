import React, { useState, useEffect, useMemo, useCallback } from "react";
import { VariableSizeGrid as Grid } from "react-window";
import { ClusteringService } from "../services/ClusteringService";
import "./styles/ClusterSimilarityMatrix.css";

interface SimilarityMatrixData {
  cluster_identifiers: Array<{
    id: string;
    feature1: string;
    feature2: string;
    cluster_id: number;
    display_name: string;
  }>;
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
}

interface CellData {
  matrixData: SimilarityMatrixData;
  onCellHover: (rowIndex: number, colIndex: number, event: React.MouseEvent) => void;
  onCellLeave: () => void;
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
  const { matrixData, onCellHover, onCellLeave } = data;

  // Header cells
  if (rowIndex === 0 && columnIndex === 0) {
    // Corner cell
    return (
      <div style={style} className="matrix-header-cell matrix-corner-cell">
        Clusters
      </div>
    );
  }

  if (rowIndex === 0) {
    // Column header
    const clusterIndex = columnIndex - 1;
    const cluster = matrixData.cluster_identifiers[clusterIndex];
    const displayName = cluster ? `${cluster.feature1} & ${cluster.feature2} (C${cluster.cluster_id})` : "";
    return (
      <div
        style={style}
        className="matrix-header-cell matrix-column-header"
        title={cluster?.display_name}
      >
        {displayName}
      </div>
    );
  }

  if (columnIndex === 0) {
    // Row header
    const clusterIndex = rowIndex - 1;
    const cluster = matrixData.cluster_identifiers[clusterIndex];
    const displayName = cluster ? `${cluster.feature1} & ${cluster.feature2} (C${cluster.cluster_id})` : "";
    return (
      <div
        style={style}
        className="matrix-header-cell matrix-row-header"
        title={cluster?.display_name}
      >
        {displayName}
      </div>
    );
  }

  // Data cell
  const dataRowIndex = rowIndex - 1;
  const dataColIndex = columnIndex - 1;
  const similarity = matrixData.similarities[dataRowIndex]?.[dataColIndex] ?? 0;
  const isDiagonal = dataRowIndex === dataColIndex;

  // Calculate normalized value (same approach as Panel1 heatmap)
  const normalizedValue = matrixData.stats.max_similarity !== matrixData.stats.min_similarity
    ? (similarity - matrixData.stats.min_similarity) / (matrixData.stats.max_similarity - matrixData.stats.min_similarity)
    : 0.5;

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
      {!isDiagonal && (
        <div className="similarity-matrix-heatmap-cell" />
      )}
    </div>
  );
});

MatrixCell.displayName = "MatrixCell";

const ClusterSimilarityMatrix: React.FC<ClusterSimilarityMatrixProps> = ({
  fileId,
  width,
  height,
}) => {
  const [matrixData, setMatrixData] = useState<SimilarityMatrixData | null>(null);
  const [originalMatrixData, setOriginalMatrixData] = useState<SimilarityMatrixData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [linkageMethod, setLinkageMethod] = useState<string>("average");
  const [isReordered, setIsReordered] = useState<boolean>(false);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    content: null,
  });

  useEffect(() => {
    if (!fileId) {
      setMatrixData(null);
      setError(null);
      return;
    }

    const fetchMatrixData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await ClusteringService.getSimilarityMatrix(fileId);
        if (data) {
          setMatrixData(data);
          setOriginalMatrixData(data); // Save original for restore functionality
          setIsReordered(false);
        } else {
          setError("No similarity matrix data available");
        }
      } catch (err) {
        console.error("Error fetching similarity matrix:", err);
        setError("Failed to load similarity matrix");
      } finally {
        setLoading(false);
      }
    };

    fetchMatrixData();
  }, [fileId]);

  const handleCellHover = useCallback((rowIndex: number, colIndex: number, event: React.MouseEvent) => {
    if (!matrixData) return;

    const similarity = matrixData.similarities[rowIndex]?.[colIndex];
    const rowCluster = matrixData.cluster_identifiers[rowIndex];
    const colCluster = matrixData.cluster_identifiers[colIndex];

    if (similarity !== undefined && rowCluster && colCluster) {
      setTooltip({
        visible: true,
        x: event.clientX + 10,
        y: event.clientY - 60,
        content: {
          rowCluster: rowCluster.display_name,
          colCluster: colCluster.display_name,
          similarity: `${(similarity * 100).toFixed(1)}%`
        },
      });
    }
  }, [matrixData]);

  const handleCellLeave = useCallback(() => {
    setTooltip(prev => ({ ...prev, visible: false }));
  }, []);

  const handleReorderMatrix = async () => {
    if (!fileId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Apply reordering
      const reorderedData = await ClusteringService.reorderSimilarityMatrix(fileId, linkageMethod);
      if (reorderedData) {
        setMatrixData(reorderedData);
        setIsReordered(true);
        setShowConfig(false);
      } else {
        setError("Failed to reorder matrix");
      }
    } catch (err) {
      console.error("Error reordering matrix:", err);
      setError("Failed to reorder similarity matrix");
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreOriginal = async () => {
    if (!fileId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Reload the original matrix data
      const data = await ClusteringService.getSimilarityMatrix(fileId);
      if (data) {
        setMatrixData(data);
        setOriginalMatrixData(data);
        setIsReordered(false);
        setShowConfig(false);
      } else {
        setError("Failed to restore original matrix");
      }
    } catch (err) {
      console.error("Error restoring original matrix:", err);
      setError("Failed to restore original matrix");
    } finally {
      setLoading(false);
    }
  };

  const cellData = useMemo<CellData | null>(() => {
    if (!matrixData) return null;
    
    return {
      matrixData,
      onCellHover: handleCellHover,
      onCellLeave: handleCellLeave,
    };
  }, [matrixData, handleCellHover, handleCellLeave]);

  if (loading) {
    return (
      <div className="cluster-similarity-matrix-container">
        <div className="matrix-loading">Loading similarity matrix...</div>
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

  if (!matrixData || !cellData) {
    return (
      <div className="cluster-similarity-matrix-container">
        <div className="matrix-empty">No similarity matrix data available. Please compute clusters first.</div>
      </div>
    );
  }

  if (matrixData.cluster_identifiers.length === 0) {
    return (
      <div className="cluster-similarity-matrix-container">
        <div className="matrix-empty">
          No clusters found. Please compute clusters first.
        </div>
      </div>
    );
  }

  const gridSize = matrixData.cluster_identifiers.length + 1; // +1 for headers
  
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
          {matrixData.stats.size} clusters, Range: {(matrixData.stats.min_similarity * 100).toFixed(1)}% - {(matrixData.stats.max_similarity * 100).toFixed(1)}%
          {isReordered && (
            <span className="reorder-indicator"> (Reordered)</span>
          )}
        </div>
        <div className="matrix-controls">
          <button
            className="matrix-control-button"
            onClick={(e) => {
              e.stopPropagation();
              setShowConfig(!showConfig);
            }}
            title="Configure clustering"
          >
            ⚙️
          </button>
          {isReordered && (
            <button
              className="matrix-control-button restore-button"
              onClick={(e) => {
                e.stopPropagation();
                handleRestoreOriginal();
              }}
              title="Restore original matrix"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      
      {showConfig && (
        <div className="matrix-config-panel">
          <div className="config-group">
            <label>Linkage Method:</label>
            <select
              value={linkageMethod}
              onChange={(e) => setLinkageMethod(e.target.value)}
              className="config-select"
            >
              <option value="single">Single</option>
              <option value="complete">Complete</option>
              <option value="average">Average</option>
              <option value="ward">Ward</option>
            </select>
          </div>
          <button
            className="cluster-button"
            onClick={handleReorderMatrix}
            disabled={loading}
          >
{loading ? "Clustering..." : "Cluster"}
          </button>
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
          <div className="tooltip-line"><strong>Row:</strong> {tooltip.content.rowCluster}</div>
          <div className="tooltip-line"><strong>Col:</strong> {tooltip.content.colCluster}</div>
          <div className="tooltip-line"><strong>Similarity:</strong> {tooltip.content.similarity}</div>
        </div>
      )}
    </div>
  );
};

export default ClusterSimilarityMatrix;