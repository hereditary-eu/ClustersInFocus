import React, { useEffect } from 'react';
import { ClusteringService } from '../services/ClusteringService';

interface Panel3AnalysisProps {
  expandedPanel: string | null;
  onPanelClick: (panelId: string, event: React.MouseEvent) => void;
  selectedCluster: number | null;
  selectedColumns: string[];
  onClusterSelect: (cluster: number | null) => void;
}

const Panel3Analysis: React.FC<Panel3AnalysisProps> = ({
  expandedPanel,
  onPanelClick,
  selectedCluster,
  selectedColumns,
  onClusterSelect,
}) => {
  useEffect(() => {
    onClusterSelect(null);
  }, [selectedColumns, onClusterSelect]);

  const renderSimilarityAnalysis = () => {
    if (selectedCluster === null || selectedColumns.length !== 2) {
      return <p>Select a cluster point to view similarity analysis</p>;
    }

    const similarities = ClusteringService.getClusterSimilarities(
      selectedColumns[0],
      selectedColumns[1],
      selectedCluster
    );

    if (!similarities.length) {
      return <p>No similarity data available</p>;
    }

    return (
      <div className="similarity-analysis">
        Feature pair: {selectedColumns[0]} & {selectedColumns[1]} <br /> Cluster {selectedCluster + 1} Similarity Analysis.
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
                  <td>{sim.clusterId + 1}</td>
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
      className={`panel panel-right ${expandedPanel === 'right' ? 'expanded' : ''}`}
      onClick={(e) => onPanelClick('right', e)}
    >
      <h2>
        <div className='panel-header-title'>Cluster Similarity Analysis</div>
      </h2>
      <div className="analysis-panel">
        {renderSimilarityAnalysis()}
      </div>
    </div>
  );
};

export default Panel3Analysis;