import { useState, useCallback } from 'react';
import { ClusteringService } from '../services/ClusteringService';
import { DataRow } from '../types';

interface ComputeShapleyValuesButtonProps {
  columns: string[];
  onShapleyValuesComputed: (targetColumn: string, fileId: string) => void;
  fileId?: string;
  data?: DataRow[];
  fileName?: string;
}

export function ComputeShapleyValuesButton({ 
  columns, 
  onShapleyValuesComputed,
  fileId,
  data,
  fileName
}: ComputeShapleyValuesButtonProps) {
  const [isComputing, setIsComputing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [targetColumn, setTargetColumn] = useState<string>(columns[0] || '');
  const [error, setError] = useState<string | null>(null);

  const computeShapleyValues = useCallback(async () => {
    if (!targetColumn) return;
    
    setIsComputing(true);
    setProgress(0);
    setError(null);
    
    try {
      await ClusteringService.computeShapleyValues(
        targetColumn, 
        fileId || '',
        setProgress,
        data,
        fileName
      );
      
      setIsComputing(false);
      onShapleyValuesComputed(targetColumn, fileId || '');
    } catch (err) {
      console.error('Error computing Shapley values:', err);
      setIsComputing(false);
      
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred while computing Shapley values.');
      }
    }
  }, [targetColumn, onShapleyValuesComputed, fileId, data, fileName]);

  return (
    <div className="clustering-controls">
      <div className="select-container">
        <select
          className="select"
          value={targetColumn}
          onChange={(e) => setTargetColumn(e.target.value)}
          disabled={isComputing}
        >
          {columns.length === 0 ? (
            <option value="">No columns available</option>
          ) : (
            columns.map(column => (
              <option key={column} value={column}>
                {column}
              </option>
            ))
          )}
        </select>
      </div>

      <button
        onClick={computeShapleyValues}
        disabled={isComputing || !targetColumn}
        className="button button-primary"
      >
        {isComputing ? `Computing... ${Math.round(progress)}%` : 'Compute SHAP Values'}
      </button>

      {isComputing && (
        <div className="clustering-modal">
          <div className="clustering-modal-content">
            <h3>Computing Shapley Values</h3>
            <div className="clustering-progress-bar-container">
              <div 
                className="clustering-progress-bar"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p>{Math.round(progress)}%</p>
          </div>
        </div>
      )}

      {error && (
        <div className="clustering-modal">
          <div className="clustering-modal-content error-modal">
            <h3>Error</h3>
            <p>{error}</p>
            <button 
              onClick={() => setError(null)}
              className="button button-secondary"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
