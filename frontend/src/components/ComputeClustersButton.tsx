import { useState, useCallback } from 'react';
import { ClusteringService, ClusteringAlgorithm, ClusteringParams, DEFAULT_PARAMS } from '../services/ClusteringService';

interface DataRow {
  [key: string]: string | number;
}

interface ComputeClustersButtonProps {
  csvData: DataRow[];
  columns: string[];
  onClustersComputed: () => void;
}

interface HyperparamModalProps {
  algorithm: ClusteringAlgorithm;
  params: ClusteringParams[ClusteringAlgorithm];
  onClose: () => void;
  onSave: (params: ClusteringParams[ClusteringAlgorithm]) => void;
}

const HyperparamModal: React.FC<HyperparamModalProps> = ({ algorithm, params, onClose, onSave }) => {
  const [localParams, setLocalParams] = useState(params);

  const renderParamsInputs = () => {
    switch (algorithm) {
      case 'kmeans':
        return (
          <div className="params-inputs">
            <div className="param-group">
              <label htmlFor="k">Number of Clusters (k):</label>
              <input
                type="number"
                id="k"
                min="2"
                max="10"
                value={localParams.k}
                onChange={(e) => setLocalParams({
                  ...localParams,
                  k: Number(e.target.value)
                })}
              />
            </div>
            <div className="param-group">
              <label htmlFor="maxIterations">Max Iterations:</label>
              <input
                type="number"
                id="maxIterations"
                min="100"
                max="10000"
                step="100"
                value={localParams.maxIterations}
                onChange={(e) => setLocalParams({
                  ...localParams,
                  maxIterations: Number(e.target.value)
                })}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="hyperparam-modal">
      <div className="hyperparam-modal-content">
        <h3>Customize {algorithm.toUpperCase()} Parameters</h3>
        {renderParamsInputs()}
        <div className="modal-buttons">
          <button onClick={onClose}>Cancel</button>
          <button onClick={() => onSave(localParams)}>Save</button>
        </div>
      </div>
    </div>
  );
};

export function ComputeClustersButton({ csvData, columns, onClustersComputed }: ComputeClustersButtonProps) {
  const [isComputing, setIsComputing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showHyperparam, setShowHyperparam] = useState(false);
  const [algorithm, setAlgorithm] = useState<ClusteringAlgorithm>('kmeans');
  const [params, setParams] = useState<ClusteringParams[typeof algorithm]>(DEFAULT_PARAMS.kmeans);

  const computeClusters = useCallback(async () => {
    setIsComputing(true);
    setProgress(0);
    
    await ClusteringService.computeFeaturePairsClusters(
      csvData,
      columns,
      algorithm,
      params,
      setProgress
    );
    
    setIsComputing(false);
    onClustersComputed();
  }, [csvData, columns, algorithm, params, onClustersComputed]);

  return (
    <div className="clustering-controls">
      <select
        value={algorithm}
        onChange={(e) => setAlgorithm(e.target.value as ClusteringAlgorithm)}
        disabled={isComputing}
      >
        <option value="kmeans">K-Means</option>
      </select>

      <button
        onClick={() => setShowHyperparam(true)}
        disabled={isComputing}
        className="text-button"
      >
        Configure
      </button>

      <button
        onClick={computeClusters}
        disabled={isComputing}
        className="text-button"
      >
        {isComputing ? `Computing... ${Math.round(progress)}%` : 'Compute Clusters'}
      </button>

      {isComputing && (
        <div className="clustering-modal">
          <div className="clustering-modal-content">
            <h3>Computing Clusters</h3>
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

      {showHyperparam && (
        <HyperparamModal
          algorithm={algorithm}
          params={params}
          onClose={() => setShowHyperparam(false)}
          onSave={(newParams) => {
            setParams(newParams);
            setShowHyperparam(false);
          }}
        />
      )}
    </div>
  );
} 