import React from 'react';

interface AnalysisPanelProps {
  cumulativeExplainedVariance: number[];
  selectedPCs: { pc1: number | null; pc2: number | null };
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  cumulativeExplainedVariance,
  selectedPCs,
}) => {
  // Generate combinations of PCs
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
    return combinations.sort((a, b) => b.variance - a.variance); // Sort by highest variance
  };

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

export default AnalysisPanel; 