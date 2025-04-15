import { useState, useCallback } from 'react';
import { ClusteringService, DEFAULT_PARAMS } from '../services/ClusteringService';
import { ComputeClustersButtonProps, HyperparamModalProps, ClusteringAlgorithm, ClusteringParams } from '../types';

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
                value={(localParams as ClusteringParams['kmeans']).k}
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
                value={(localParams as ClusteringParams['kmeans']).maxIterations}
                onChange={(e) => setLocalParams({
                  ...localParams,
                  maxIterations: Number(e.target.value)
                })}
              />
            </div>
          </div>
        );
      case 'dbscan':
        return (
          <div className="params-inputs">
            <div className="param-group">
              <label htmlFor="eps">Epsilon (eps):</label>
              <input
                type="number"
                id="eps"
                min="0.1"
                max="2"
                step="0.1"
                value={(localParams as ClusteringParams['dbscan']).eps}
                onChange={(e) => setLocalParams({
                  ...localParams,
                  eps: Number(e.target.value)
                })}
              />
            </div>
            <div className="param-group">
              <label htmlFor="minSamples">Min Samples:</label>
              <input
                type="number"
                id="minSamples"
                min="2"
                max="10"
                value={(localParams as ClusteringParams['dbscan']).minSamples}
                onChange={(e) => setLocalParams({
                  ...localParams,
                  minSamples: Number(e.target.value)
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
          <button className="button button-secondary" onClick={onClose}>Cancel</button>
          <button className="button button-primary" onClick={() => onSave(localParams)}>Save</button>
        </div>
      </div>
    </div>
  );
};

export function ComputeClustersButton({ csvData, columns, onClustersComputed, fileId, fileName }: ComputeClustersButtonProps) {
  const [isComputing, setIsComputing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showHyperparam, setShowHyperparam] = useState(false);
  const [algorithm, setAlgorithm] = useState<ClusteringAlgorithm>('kmeans');
  const [params, setParams] = useState<ClusteringParams[typeof algorithm]>(DEFAULT_PARAMS.kmeans);
  const [error, setError] = useState<string | null>(null);

  const computeClusters = useCallback(async () => {
    setIsComputing(true);
    setProgress(0);
    setError(null);
    
    try {
      await ClusteringService.computeFeaturePairsClusters(
        csvData,
        columns,
        algorithm,
        params,
        setProgress,
        fileId,
        fileName
      );
      
      setIsComputing(false);
      onClustersComputed();
    } catch (err) {
      console.error('Error computing clusters:', err);
      setIsComputing(false);
      
      // Check if this is a network error
      if (err instanceof TypeError && err.message.includes('network') || 
          (err instanceof Error && err.message.includes('Failed to fetch'))) {
        setError('Unable to connect to the server. Please check that the backend is running or try again later.');
      } else {
        setError('An error occurred while computing clusters. Please try again.');
      }
    }
  }, [csvData, columns, algorithm, params, onClustersComputed, fileId, fileName]);

  return (
    <div className="clustering-controls">
      <div className="select-container">
        <select
          className="select"
          value={algorithm}
          onChange={(e) => {
            const newAlgorithm = e.target.value as ClusteringAlgorithm;
            setAlgorithm(newAlgorithm);
            setParams(DEFAULT_PARAMS[newAlgorithm]);
          }}
          disabled={isComputing}
        >
          <option value="kmeans">K-Means</option>
          <option value="dbscan">DBSCAN</option>
        </select>
      </div>

      <button
        onClick={() => setShowHyperparam(true)}
        disabled={isComputing}
        className="button button-secondary"
      >
        Configure
      </button>

      <button
        onClick={computeClusters}
        disabled={isComputing}
        className="button button-primary"
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

      {error && (
        <div className="clustering-modal">
          <div className="clustering-modal-content error-modal">
            <h3>Connection Error</h3>
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