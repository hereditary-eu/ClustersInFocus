import React from 'react';

interface Panel3AnalysisProps {
  cumulativeExplainedVariance: number[];
  selectedPCs: { pc1: number | null; pc2: number | null };
  expandedPanel: string | null;
  onPanelClick: (panelId: string, event: React.MouseEvent) => void;
}

const Panel3Analysis: React.FC<Panel3AnalysisProps> = ({
  cumulativeExplainedVariance,
  selectedPCs,
  expandedPanel,
  onPanelClick,
}) => {
  const generatePCCombinations = () => {
    const combinations = [];
    for (let i = 0; i < cumulativeExplainedVariance.length - 1; i++) {
      for (let j = i + 1; j < cumulativeExplainedVariance.length; j++) {
        combinations.push({
          pc1: i,
          pc2: j,
          variance: cumulativeExplainedVariance[i] + cumulativeExplainedVariance[j],
        });
      }
    }
    return combinations.sort((a, b) => b.variance - a.variance);
  };

  const renderContent = () => {
    if (selectedPCs.pc1 === null || selectedPCs.pc2 === null) {
      return <div>Select principal components to view analysis</div>;
    }

    return (
      <div className="analysis-panel">
        <h3>PCA Details</h3>
        <div className="variance-info">
          <p>Cumulative Explained Variance for Selected PCs:</p>
          <p>
            {(
              (cumulativeExplainedVariance[selectedPCs.pc1] +
              cumulativeExplainedVariance[selectedPCs.pc2]) * 100
            ).toFixed(2)}
            %
          </p>
        </div>
        
        <div className="pc-combinations">
          <h4>PC Combinations Analysis</h4>
          <table>
            <thead>
              <tr>
                <th>Components</th>
                <th>Explained Variance</th>
              </tr>
            </thead>
            <tbody>
              {generatePCCombinations().slice(0, 5).map((combo, idx) => (
                <tr key={idx} className={
                  selectedPCs.pc1 === combo.pc1 && selectedPCs.pc2 === combo.pc2 ? 'selected' : ''
                }>
                  <td>PC{combo.pc1 + 1} + PC{combo.pc2 + 1}</td>
                  <td>{(combo.variance * 100).toFixed(2)}%</td>
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
        <div className='panel-header-title'>Analysis</div>
      </h2>
      {renderContent()}
    </div>
  );
};

export default Panel3Analysis; 