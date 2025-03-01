import React, { useState, useEffect } from 'react';
import ScatterplotClustered from './ScatterplotClustered';
import { LocalStorageService } from '../services/LocalStorageService';

interface Panel2ClusteringProps {
  data: Record<string, any>[];
  selectedColumns: string[];
  expandedPanel: string | null;
  onPanelClick: (panelId: string, event: React.MouseEvent) => void;
  onClusterSelect: (cluster: number | null) => void;
}

const Panel2Clustering: React.FC<Panel2ClusteringProps> = ({
  data,
  selectedColumns,
  expandedPanel,
  onPanelClick,
  onClusterSelect,
}) => {
  const [clusterData, setClusterData] = useState<number[] | null>(null);
  const [scatterData, setScatterData] = useState<number[][]>([]);
  const [numClusters, setNumClusters] = useState<number>(0);

  useEffect(() => {
    const fetchClusters = async () => {
      if (selectedColumns.length !== 2) {
        setClusterData(null);
        setScatterData([]);
        return;
      }

      // Sort features alphabetically
      const [feature1, feature2] = selectedColumns;
      const clusterGroups = LocalStorageService.getClusters(feature1, feature2);

      if (clusterGroups) {
        // Convert cluster groups to array format
        const clusterArray = new Array(data.length).fill(-1);
        Object.entries(clusterGroups).forEach(([clusterId, indices]) => {
          indices.forEach((index: number) => {
            clusterArray[Number(index)] = Number(clusterId);
          });
        });

        setClusterData(clusterArray);
        setNumClusters(Object.keys(clusterGroups).length);
        
        const newScatterData = data.map((row, index) => [
          Number(row[feature1]),
          Number(row[feature2]),
          clusterArray[index]
        ]);
        setScatterData(newScatterData);
      }
    };

    fetchClusters();
  }, [data, selectedColumns]);

  const renderContent = () => {
    if (selectedColumns.length < 2) {
      return <p>Select exactly two numerical columns to view clustering results</p>;
    }

    // Check if selected columns contain numerical data
    const hasNonNumericalValues = data.some(row => 
      typeof Number(row[selectedColumns[0]]) !== 'number' || 
      isNaN(Number(row[selectedColumns[0]])) ||
      typeof Number(row[selectedColumns[1]]) !== 'number' || 
      isNaN(Number(row[selectedColumns[1]]))
    );

    if (hasNonNumericalValues) {
      return <p>Please select numerical columns only</p>;
    }

    if (!clusterData) {
      return (
        <div className="visualize-clusters-container">
          <p>No clustering data available for {selectedColumns.join(' and ')}.</p>
          <p>Please compute clusters first using the button in the header.</p>
        </div>
      );
    }

    return (
      <div className="visualize-clusters-container">
        <div>
          <p>Showing clusters for {selectedColumns.join(' vs ')}</p>
        </div>
        <div className="scatterplot-container">
          <ScatterplotClustered
            data={scatterData}
            xLabel={selectedColumns[0]}
            yLabel={selectedColumns[1]}
            k={numClusters}
            onPointClick={(cluster) => onClusterSelect(cluster)}
            onPanelClick={onPanelClick}
          />
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`panel panel-middle ${expandedPanel === 'middle' ? 'expanded' : ''}`}
      onClick={(e) => onPanelClick('middle', e)}
    >
      <h2>
        <div className='panel-header-middle-title'>Visualization</div>
      </h2>
      {renderContent()}
    </div>
  );
};

export default Panel2Clustering;