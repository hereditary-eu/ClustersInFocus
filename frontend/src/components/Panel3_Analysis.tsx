import React, { useEffect, useState, useRef } from "react";
import { ClusteringService } from "../services/ClusteringService";
import ClusterSimilarityMatrix from "./ClusterSimilarityMatrix";

interface Panel3AnalysisProps {
  expandedPanel: string | null;
  onPanelClick: (panelId: string, event: React.MouseEvent) => void;
  selectedCluster: number | null;
  selectedColumns: string[];
  onClusterSelect: (cluster: number | null) => void;
  fileId?: string;
  allColumns: string[];
}

const Panel3Analysis: React.FC<Panel3AnalysisProps> = ({
  expandedPanel,
  onPanelClick,
  selectedCluster,
  selectedColumns,
  onClusterSelect,
  fileId,
  allColumns,
}) => {
  const [similarities, setSimilarities] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"similarity" | "matrix">("similarity");
  const [filterHighSimilarity, setFilterHighSimilarity] = useState<boolean>(false);
  const [panelDimensions, setPanelDimensions] = useState({ width: 400, height: 300 });
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onClusterSelect(null);
  }, [selectedColumns, onClusterSelect]);

  // Dynamic resizing effect
  useEffect(() => {
    const updateDimensions = () => {
      if (panelRef.current) {
        const rect = panelRef.current.getBoundingClientRect();
        setPanelDimensions({
          width: rect.width,
          height: rect.height - 120, // Account for header and controls
        });
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(updateDimensions);
    if (panelRef.current) {
      resizeObserver.observe(panelRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [expandedPanel]);

  useEffect(() => {
    // Clear previous similarities when selection changes
    setSimilarities([]);
    setError(null);

    // Fetch similarities when a cluster is selected
    if (selectedCluster !== null && selectedColumns.length === 2 && fileId) {
      setLoading(true);

      ClusteringService.getClusterSimilarities(selectedColumns[0], selectedColumns[1], selectedCluster, fileId)
        .then((data) => {
          setSimilarities(data);
        })
        .catch((err) => {
          console.error("Error fetching similarities:", err);
          setError("Failed to load similarity data");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [selectedCluster, selectedColumns, fileId]);

  // Filter similarities based on the filter checkbox
  const getFilteredSimilarities = () => {
    if (!filterHighSimilarity) {
      return similarities;
    }
    // Filter to only show similarities above 50%
    return similarities.filter(sim => sim.similarity > 0.5);
  };

  const renderSimilarityAnalysis = () => {
    if (loading) {
      return <p>Loading similarity data...</p>;
    }

    if (error) {
      return <p className="error-message">{error}</p>;
    }

    if (selectedCluster === null || selectedColumns.length !== 2) {
      return <p>Select a cluster point to view similarity analysis</p>;
    }

    if (!similarities.length) {
      return <p>No similarity data available</p>;
    }

    const filteredSimilarities = getFilteredSimilarities();

    return (
      <div className="similarity-analysis">
        <div className="similarity-header">
          <div className="cluster-info">
            Cluster {selectedCluster + 1} of feature pair: <i>{selectedColumns.join(" and ")}</i>
          </div>
          <div className="similarity-controls">
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={filterHighSimilarity}
                onChange={(e) => setFilterHighSimilarity(e.target.checked)}
              />
              Show only high similarity (&gt; 50%)
            </label>
          </div>
        </div>
        <hr />
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Feature 1</th>
                <th>Feature 2</th>
                <th>Cluster</th>
                <th>Jaccard Similarity</th>
              </tr>
            </thead>
            <tbody>
              {filteredSimilarities.length > 0 ? (
                filteredSimilarities.map((sim, idx) => (
                  <tr key={idx}>
                    <td>{sim.feature1}</td>
                    <td>{sim.feature2}</td>
                    <td>{sim.cluster_id + 1}</td>
                    <td>{(sim.similarity * 100).toFixed(1)}%</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', fontStyle: 'italic' }}>
                    No clusters match the current filter criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="similarity-stats">
          Showing {filteredSimilarities.length} of {similarities.length} similar clusters
        </div>
      </div>
    );
  };

  return (
    <div
      ref={panelRef}
      className={`panel panel-right ${expandedPanel === "right" ? "expanded" : ""}`}
      onClick={(e) => onPanelClick("right", e)}
    >
      <h2 className="panel-header-left">
        <div className="panel-header-title">Cluster Similarity Panel</div>
        <div className="panel-header-options">
          <div className="view-mode-switch">
            <button
              className={`view-mode-button ${viewMode === "similarity" ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setViewMode("similarity");
              }}
              title="Show cluster similarity analysis"
            >
              List
            </button>
            <button
              className={`view-mode-button ${viewMode === "matrix" ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setViewMode("matrix");
              }}
              title="Show similarity matrix"
            >
              Matrix
            </button>
          </div>
        </div>
      </h2>
      <div className="analysis-panel">
        {viewMode === "similarity" ? renderSimilarityAnalysis() : (
          <ClusterSimilarityMatrix
            fileId={fileId}
            width={panelDimensions.width}
            height={panelDimensions.height}
            selectedCluster={selectedCluster}
            selectedColumns={selectedColumns}
            allColumns={allColumns}
          />
        )}
      </div>
    </div>
  );
};

export default Panel3Analysis;
