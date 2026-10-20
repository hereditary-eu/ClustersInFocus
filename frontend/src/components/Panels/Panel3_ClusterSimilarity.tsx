import React, { useEffect, useState, useRef } from "react";
import { ClusteringService } from "../../services/ClusteringService";
import ClusterSimilarityMatrix from "../DataVisualization/ClusterSimilarityMatrix/ClusterSimilarityMatrix";
import { useAppStore } from "../../stores/useAppStore";
import { ClusterSimilarityResponse } from "../../types";
import { toast } from "../../stores/useToastStore";
import styles from "./Panel3_ClusterSimilarity.module.css";
import shellStyles from "./PanelShell.module.css";

const Panel3ClusterSimilarity: React.FC = () => {
  const data = useAppStore(state => state.data);
  const selectedColumns = useAppStore(state => state.selectedColumns);
  const selectedCluster = useAppStore(state => state.selectedCluster);
  const expandedPanel = useAppStore(state => state.expandedPanel);
  const setExpandedPanel = useAppStore(state => state.setExpandedPanel);
  const setSelectedCluster = useAppStore(state => state.setSelectedCluster);
  const isExpanded = expandedPanel === "right";
  const isCollapsed = expandedPanel !== null && !isExpanded;

  const handlePanelClick = (panelId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (expandedPanel !== panelId) {
      setExpandedPanel(panelId);
    }
  };

  const [similarities, setSimilarities] = useState<ClusterSimilarityResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"similarity" | "matrix">("similarity");
  const [filterHighSimilarity, setFilterHighSimilarity] = useState<boolean>(false);
  const [panelDimensions, setPanelDimensions] = useState({ width: 400, height: 300 });
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedCluster(null);
  }, [selectedColumns, setSelectedCluster]);

  useEffect(() => {
    const updateDimensions = () => {
      if (panelRef.current) {
        const rect = panelRef.current.getBoundingClientRect();
        setPanelDimensions({
          width: rect.width,
          height: rect.height - 120,
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
    setSimilarities([]);

    if (selectedCluster !== null && selectedColumns.length === 2 && data.fileId) {
      setLoading(true);

      ClusteringService.getClusterSimilarities(selectedColumns[0], selectedColumns[1], selectedCluster, data.fileId!)
        .then((response) => {
          setSimilarities(response);
        })
        .catch(() => {
          toast.error("Failed to load similarity data");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [selectedCluster, selectedColumns, data.fileId]);

  const getFilteredSimilarities = () => {
    if (!filterHighSimilarity) {
      return similarities;
    }
    return similarities.filter((sim) => sim.similarity > 0.5);
  };

  const renderSimilarityAnalysis = () => {
    if (loading) {
      return <p>Loading similarity data...</p>;
    }

    if (selectedCluster === null || selectedColumns.length !== 2) {
      return <p>Select a cluster point to view similarity analysis</p>;
    }

    if (!similarities.length) {
      return <p>No similarity data available</p>;
    }

    const filteredSimilarities = getFilteredSimilarities();

    return (
      <div className={styles.similarityAnalysis}>
        <div className={styles.similarityHeader}>
          <div className={styles.clusterInfo}>
            Cluster {selectedCluster + 1} of feature pair: <i>{selectedColumns.join(" and ")}</i>
          </div>
          <div className={styles.similarityControls}>
            <label className={styles.filterCheckbox}>
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
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.headerCell}>Feature 1</th>
                <th className={styles.headerCell}>Feature 2</th>
                <th className={styles.headerCell}>Cluster</th>
                <th className={styles.headerCell}>Jaccard Similarity</th>
              </tr>
            </thead>
            <tbody>
              {filteredSimilarities.length > 0 ? (
                filteredSimilarities.map((sim, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? styles.rowOdd : styles.rowEven}>
                    <td className={styles.cell}>{sim.feature1}</td>
                    <td className={styles.cell}>{sim.feature2}</td>
                    <td className={styles.cell}>{sim.cluster_id + 1}</td>
                    <td className={styles.cell}>{(sim.similarity * 100).toFixed(1)}%</td>
                  </tr>
                ))
              ) : (
                <tr className={styles.rowOdd}>
                  <td className={`${styles.cell} ${styles.emptyRowCell}`} colSpan={4}>
                    No clusters match the current filter criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className={styles.similarityStats}>
          Showing {filteredSimilarities.length} of {similarities.length} similar clusters
        </div>
      </div>
    );
  };

  return (
    <div
      ref={panelRef}
      className={`${shellStyles.panel} ${styles.panelRight} ${isExpanded ? shellStyles.expanded : ""} ${isCollapsed ? shellStyles.collapsed : ""} ${isCollapsed ? shellStyles.dimmed : ""}`}
      onClick={(e) => handlePanelClick("right", e)}
    >
      <h2 className={shellStyles.panelHeader}>
        <div>Cluster Similarity</div>
        <div className={styles.headerOptions}>
          <div className={styles.viewModeSwitch}>
            <button
              className={`${styles.viewModeButton} ${viewMode === "similarity" ? styles.viewModeButtonActive : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setViewMode("similarity");
              }}
              title="Show cluster similarity analysis"
            >
              List
            </button>
            <button
              className={`${styles.viewModeButton} ${viewMode === "matrix" ? styles.viewModeButtonActive : ""}`}
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
      <div className={styles.analysisPanel}>
        {viewMode === "similarity" ? (
          renderSimilarityAnalysis()
        ) : (
          <ClusterSimilarityMatrix width={panelDimensions.width} height={panelDimensions.height} />
        )}
      </div>
    </div>
  );
};

export default Panel3ClusterSimilarity;
