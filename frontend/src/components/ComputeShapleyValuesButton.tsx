import { useState, useCallback } from 'react';
import { ClusteringService } from '../services/ClusteringService';

interface ComputeShapleyValuesButtonProps {
  columns: string[];
  onShapleyValuesComputed: (targetColumn: string) => void;
}

export function ComputeShapleyValuesButton({ columns, onShapleyValuesComputed }: ComputeShapleyValuesButtonProps) {
  const [isComputing, setIsComputing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [targetColumn, setTargetColumn] = useState<string>(columns.length > 0 ? columns[0] : '');

  const computeShapleyValues = useCallback(async () => {
    if (!targetColumn) {
      setError('Please select a target column');
      return;
    }

    setIsComputing(true);
    setProgress(0);
    setError(null);
    
    try {
      // Only sending the target column to the backend
      await ClusteringService.computeShapleyValues(
        targetColumn,
        setProgress
      );
      
      setIsComputing(false);
      onShapleyValuesComputed(targetColumn);
    } catch (err) {
      console.error('Error computing Shapley values:', err);
      setIsComputing(false);
      
      // Check if this is a network error
      if (err instanceof TypeError && err.message.includes('network') || 
          (err instanceof Error && err.message.includes('Failed to fetch'))) {
        setError('Unable to connect to the server. Please check that the backend is running or try again later.');
      } else {
        setError('An error occurred while computing Shapley values. Please try again.');
      }
    }
  }, [targetColumn, onShapleyValuesComputed]);

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
        {isComputing ? `Computing... ${Math.round(progress)}%` : 'Compute Shapley Values'}
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
