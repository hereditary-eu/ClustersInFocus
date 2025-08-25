import { useState, useCallback } from "react";
import { ClusteringService, DEFAULT_PARAMS } from "../../services/ClusteringService";
import { ComputeClustersButtonProps, HyperparamModalProps, ClusteringAlgorithm, ClusteringParams } from "../../types";
import { toast } from "../../stores/useToastStore";
import "../UI/Modal.css";

const HyperparamModal: React.FC<HyperparamModalProps> = ({ algorithm, params, onClose, onSave }) => {
  const [localParams, setLocalParams] = useState(params);

  const renderParamsInputs = () => {
    switch (algorithm) {
      case "kmeans":
        return (
          <>
            <div className="config-section">
              <label className="config-label" htmlFor="k">Number of Clusters (k)</label>
              <input
                className="config-input"
                type="number"
                id="k"
                min="2"
                max="10"
                value={(localParams as ClusteringParams["kmeans"]).k}
                onChange={(e) =>
                  setLocalParams({
                    ...localParams,
                    k: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="config-section">
              <label className="config-label" htmlFor="maxIterations">Max Iterations</label>
              <input
                className="config-input"
                type="number"
                id="maxIterations"
                min="100"
                max="10000"
                step="100"
                value={(localParams as ClusteringParams["kmeans"]).maxIterations}
                onChange={(e) =>
                  setLocalParams({
                    ...localParams,
                    maxIterations: Number(e.target.value),
                  })
                }
              />
            </div>
          </>
        );
      case "dbscan":
        return (
          <>
            <div className="config-section">
              <label className="config-label" htmlFor="eps">Epsilon (eps)</label>
              <input
                className="config-input"
                type="number"
                id="eps"
                min="0.1"
                max="2"
                step="0.1"
                value={(localParams as ClusteringParams["dbscan"]).eps}
                onChange={(e) =>
                  setLocalParams({
                    ...localParams,
                    eps: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="config-section">
              <label className="config-label" htmlFor="minSamples">Min Samples</label>
              <input
                className="config-input"
                type="number"
                id="minSamples"
                min="2"
                max="10"
                value={(localParams as ClusteringParams["dbscan"]).minSamples}
                onChange={(e) =>
                  setLocalParams({
                    ...localParams,
                    minSamples: Number(e.target.value),
                  })
                }
              />
            </div>
          </>
        );
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-config">
        <div className="modal-header">
          <h3 className="modal-title">Customize {algorithm.toUpperCase()} Parameters</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          {renderParamsInputs()}
        </div>
        <div className="modal-footer">
          <button className="modal-button modal-button--secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="modal-button modal-button--primary" onClick={() => onSave(localParams)}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export function ComputeClustersButton({
  csvData,
  columns,
  onClustersComputed,
  fileId,
  fileName,
}: ComputeClustersButtonProps) {
  const [isComputing, setIsComputing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showHyperparam, setShowHyperparam] = useState(false);
  const [algorithm, setAlgorithm] = useState<ClusteringAlgorithm>("kmeans");
  const [params, setParams] = useState<ClusteringParams[typeof algorithm]>(DEFAULT_PARAMS.kmeans);

  const computeClusters = useCallback(async () => {
    setIsComputing(true);
    setProgress(0);

    try {
      await ClusteringService.computeFeaturePairsClusters(
        csvData,
        columns,
        algorithm,
        params,
        setProgress,
        fileId,
        fileName,
      );

      setIsComputing(false);
      onClustersComputed();
      toast.success("Clusters computed successfully!");
    } catch (err) {
      setIsComputing(false);

      // Check if this is a network error
      if (
        (err instanceof TypeError && err.message.includes("network")) ||
        (err instanceof Error && err.message.includes("Failed to fetch"))
      ) {
        toast.error("Unable to connect to the server. Please check that the backend is running or try again later.");
      } else {
        toast.error("An error occurred while computing clusters. Please try again.");
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

      <button onClick={() => setShowHyperparam(true)} disabled={isComputing} className="button button-secondary">
        Configure
      </button>

      <button onClick={computeClusters} disabled={isComputing} className="button button-primary">
        {isComputing ? `Computing... ${Math.round(progress)}%` : "Compute Clusters"}
      </button>

      {isComputing && (
        <div className="modal-overlay">
          <div className="modal-content modal-progress">
            <div className="modal-header">
              <h3 className="modal-title">Computing Clusters</h3>
            </div>
            <div className="modal-body">
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${progress}%` }} />
              </div>
              <p className="progress-text">{Math.round(progress)}%</p>
            </div>
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
