import React, { useState, useEffect } from 'react';
import ScatterplotClustered from './ScatterplotClustered';
import { getClustersByFeaturePair } from './KMeansFeaturePairs';

interface ClusteringPanelProps {
  data: Record<string, any>[];
  selectedColumns: string[];
  k: number;
}

const ClusteringPanel: React.FC<ClusteringPanelProps> = ({ data, selectedColumns, k }) => {
  const [clusterData, setClusterData] = useState<number[] | null>(null);
  const [scatterData, setScatterData] = useState<number[][]>([]);

  useEffect(() => {
    const fetchClusters = async () => {
      if (selectedColumns.length !== 2) {
        setClusterData(null);
        setScatterData([]);
        return;
      }

      const [feature1, feature2] = selectedColumns;
      const clusters = getClustersByFeaturePair(feature1, feature2, k);

      if (clusters) {
        setClusterData(clusters);
        // Create scatter data with x, y coordinates from selected features
        const newScatterData = data.map((row, index) => [
          Number(row[feature1]),
          Number(row[feature2]),
          clusters[index] // Add cluster assignment as third dimension
        ]);
        setScatterData(newScatterData);
      }
    };

    fetchClusters();
  }, [data, selectedColumns, k]);

  const numericalColumns = selectedColumns.filter(col => 
    data.some(row => typeof row[col] === 'number')
  );

  if (numericalColumns.length < 2) {
    return <p>Select exactly two numerical columns to view clustering results</p>;
  }

  if (!clusterData) {
    return (
      <div className="clustering-container">
        <p>No clustering data available for {selectedColumns.join(' and ')}.</p>
        <p>Please compute clusters first using the button in the header.</p>
      </div>
    );
  }

  return (
    <div className="clustering-container">
      <div className="clustering-info">
        <p>Showing clusters for {selectedColumns.join(' vs ')}</p>
      </div>
      <div className="scatterplot-container">
        <ScatterplotClustered
          data={scatterData}
          xLabel={selectedColumns[0]}
          yLabel={selectedColumns[1]}
          k={k}
        />
      </div>
    </div>
  );
};

export default ClusteringPanel; 