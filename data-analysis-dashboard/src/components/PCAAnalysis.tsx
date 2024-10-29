import React, { useState, useEffect } from 'react';
import ScatterplotRecharts from './ScatterplotRecharts';
import * as ml from 'ml-pca';

interface PCAAnalysisProps {
  data: any[];
  selectedColumns: string[];
}

interface PCAAnalysisProps {
  data: any[];
  selectedColumns: string[];
  onPCAUpdate: (pcSelection: { pc1: number | null; pc2: number | null }, variance: number[]) => void;
}

const PCAAnalysis: React.FC<PCAAnalysisProps> = ({ data, selectedColumns, onPCAUpdate }) => {
  const [pcaResult, setPcaResult] = useState<ml.PCA | null>(null);
  const [transformedData, setTransformedData] = useState<number[][]>([]);
  const [selectedPCs, setSelectedPCs] = useState<{ pc1: number | null; pc2: number | null }>({
    pc1: null,
    pc2: null,
  });
  const varianceRatios = pcaResult?.getExplainedVariance() || [];

  // Perform PCA when selected columns change
  useEffect(() => {
    if (selectedColumns.length < 2) {
      setPcaResult(null);
      setTransformedData([]);
      setSelectedPCs({ pc1: null, pc2: null });
      onPCAUpdate({ pc1: null, pc2: null }, []);
      return;
    }

    try {
      // Extract numerical data for selected columns
      const matrix = data.map((row) =>
        selectedColumns.map((col) => {
          const value = row[col];
          return typeof value === 'number' ? value : 0;
        })
      );

      // Perform PCA
      const pca = new ml.PCA(matrix);
      setPcaResult(pca);

      // Transform the data
      const transformed = pca.predict(matrix).to2DArray();
      setTransformedData(transformed);

      // Get individual explained variance ratios
      const varianceRatios = pca.getExplainedVariance();

      // Send the individual variance ratios instead of cumulative
      onPCAUpdate(selectedPCs, varianceRatios);
    } catch (error) {
      console.error('PCA calculation error:', error);
    }
  }, [data, selectedColumns, onPCAUpdate, selectedPCs]);

  if (!pcaResult || selectedColumns.length < 2) {
    return <p>Select at least two numerical columns for PCA analysis</p>;
  }

  return (
    <div className="pca-container">
      <div className="pca-controls">
        <div className="pc-selector">
          <label>
            1st Principal Component:
            <select
              value={selectedPCs.pc1 ?? ''}
              onChange={(e) =>
                setSelectedPCs((prev) => ({
                  ...prev,
                  pc1: e.target.value ? Number(e.target.value) : null,
                }))
              }
            >
              <option value="">Select PC</option>
              {varianceRatios.map((variance, i) => (
                <option key={i} value={i}>
                  PC{i + 1} ({(variance * 100).toFixed(2)}% variance)
                </option>
              ))}
            </select>
          </label>

          <label>
            2nd Principal Component:
            <select
              value={selectedPCs.pc2 ?? ''}
              onChange={(e) =>
                setSelectedPCs((prev) => ({
                  ...prev,
                  pc2: e.target.value ? Number(e.target.value) : null,
                }))
              }
            >
              <option value="">Select PC</option>
              {varianceRatios.map((variance, i) => (
                <option key={i} value={i}>
                  PC{i + 1} ({(variance * 100).toFixed(2)}% variance)
                </option>
              ))}
            </select>
          </label>
        </div>

        {selectedPCs.pc1 !== null && selectedPCs.pc2 !== null && (
          <div className="plot-container">
            <ScatterplotRecharts
              data={transformedData}
              xIndex={selectedPCs.pc1}
              yIndex={selectedPCs.pc2}
              xLabel={`PC${selectedPCs.pc1 + 1}`}
              yLabel={`PC${selectedPCs.pc2 + 1}`}
              width="100%"
              height={400}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PCAAnalysis;
