import React, { useEffect, useState } from "react";
import { ClusteringService } from "../services/ClusteringService";

interface Panel3AnalysisProps {
  expandedPanel: string | null;
  onPanelClick: (panelId: string, event: React.MouseEvent) => void;
  selectedCluster: number | null;
  selectedColumns: string[];
  onClusterSelect: (cluster: number | null) => void;
  fileId?: string;
}

const Panel3Analysis: React.FC<Panel3AnalysisProps> = ({
  expandedPanel,
  onPanelClick,
  selectedCluster,
  selectedColumns,
  onClusterSelect,
  fileId,
}) => {
  const [similarities, setSimilarities] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onClusterSelect(null);
  }, [selectedColumns, onClusterSelect]);

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

    return (
      <div className="similarity-analysis">
        Cluster {selectedCluster + 1} of feature pair: <i>{selectedColumns.join(" and ")}</i> <br />
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
              {similarities.map((sim, idx) => (
                <tr key={idx}>
                  <td>{sim.feature1}</td>
                  <td>{sim.feature2}</td>
                  <td>{sim.cluster_id + 1}</td>
                  <td>{(sim.similarity * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`panel panel-right ${expandedPanel === "right" ? "expanded" : ""}`}
      onClick={(e) => onPanelClick("right", e)}
    >
      <h2>
        <div className="panel-header-title">Cluster Similarity Panel</div>
      </h2>
      <div className="analysis-panel">{renderSimilarityAnalysis()}</div>
    </div>
  );
};

export default Panel3Analysis;
