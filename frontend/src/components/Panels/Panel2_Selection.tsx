import React, { useState, useEffect } from "react";
import ScatterplotClustered from "../DataVisualization/ScatterplotClustered";
import { ClusteringService } from "../../services/ClusteringService";
import { useAppStore } from "../../stores/useAppStore";
import { hasNonNumericValues } from "../../utils/validation";

const Panel2Selection: React.FC = () => {
  const data = useAppStore(state => state.data);
  const selectedColumns = useAppStore(state => state.selectedColumns);
  const setExpandedPanel = useAppStore(state => state.setExpandedPanel);
  const expandedPanel = useAppStore(state => state.expandedPanel);

  const handlePanelClick = (panelId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (expandedPanel !== panelId) {
      setExpandedPanel(panelId);
    }
  };
  const [clusterData, setClusterData] = useState<number[] | null>(null);
  const [scatterData, setScatterData] = useState<number[][]>([]);
  const [numClusters, setNumClusters] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchClusters = async () => {
      if (selectedColumns.length !== 2 || !data.fileId) {
        setClusterData(null);
        setScatterData([]);
        return;
      }

      setIsLoading(true);

      try {
        // Sort features alphabetically for consistent caching
        const [feature1, feature2] = selectedColumns;

        // Check if selected columns contain numerical data before making the request
        if (hasNonNumericValues(data.csvData, [feature1, feature2])) {
          setClusterData(null);
          setScatterData([]);
          setIsLoading(false);
          return;
        }

        const clusterGroups = await ClusteringService.getClustersByFeatures(feature1, feature2, data.fileId!, data.csvData);

        if (clusterGroups) {

          // Convert cluster groups to array format
          const clusterArray = new Array(data.csvData.length).fill(-1);

          // Extract all unique cluster IDs
          const uniqueClusterIds = Object.keys(clusterGroups).map(Number);

          // Populate the cluster array
          Object.entries(clusterGroups).forEach(([clusterId, indices]) => {
            indices.forEach((index: number) => {
              clusterArray[index] = Number(clusterId);
            });
          });

          setClusterData(clusterArray);
          setNumClusters(uniqueClusterIds.length);

          // Create scatter data points
          const newScatterData = data.csvData.map((row, index) => [
            Number(row[feature1]),
            Number(row[feature2]),
            clusterArray[index],
          ]);

          setScatterData(newScatterData);
        } else {
          setClusterData(null);
          setScatterData([]);
        }
      } catch (error) {
        setClusterData(null);
        setScatterData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClusters();
  }, [data.csvData, data.fileId, selectedColumns]);

  const renderContent = () => {
    if (selectedColumns.length < 2) {
      return <p>Select exactly two numerical columns to view clustering results</p>;
    }

    // Check if selected columns contain numerical data
    if (hasNonNumericValues(data.csvData, selectedColumns)) {
      return <p>Please select numerical columns only</p>;
    }

    if (isLoading) {
      return <p>Loading cluster data...</p>;
    }

    if (!clusterData) {
      return (
        <div className="visualize-clusters-container">
          <p>
            No clustering data available for <i>{selectedColumns.join(" and ")}</i>.
          </p>
          <p>Please compute clusters first using the button in the header.</p>
        </div>
      );
    }

    return (
      <div className="visualize-clusters-container">
        <div>
          <p>
            Showing clusters for <i>{selectedColumns.join(" and ")}</i>
          </p>
        </div>
        <div className="scatterplot-container">
          <ScatterplotClustered
            data={scatterData}
            xLabel={selectedColumns[0]}
            yLabel={selectedColumns[1]}
            k={numClusters}
          />
        </div>
      </div>
    );
  };

  return (
    <div
      className={`panel panel-middle ${expandedPanel === "middle" ? "expanded" : ""}`}
      onClick={(e) => handlePanelClick("middle", e)}
    >
      <h2 className="panel-header">
        <div className="panel-header-middle-title">Selection</div>
      </h2>
      {renderContent()}
    </div>
  );
};

export default Panel2Selection;
