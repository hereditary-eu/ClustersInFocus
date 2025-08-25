import { useState, useCallback } from "react";
import { ClusteringService } from "../../services/ClusteringService";
import { DataRow } from "../../types";
import { toast } from "../../stores/useToastStore";
import "../UI/Modal.css";

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
  fileName,
}: ComputeShapleyValuesButtonProps) {
  const [isComputing, setIsComputing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [targetColumn, setTargetColumn] = useState<string>(columns[0] || "");

  const computeShapleyValues = useCallback(async () => {
    if (!targetColumn) return;

    setIsComputing(true);
    setProgress(0);
    try {
      await ClusteringService.computeShapleyValues(targetColumn, fileId || "", setProgress, data, fileName);

      setIsComputing(false);
      onShapleyValuesComputed(targetColumn, fileId || "");
      toast.success("Shapley values computed successfully!");
    } catch (err) {
      setIsComputing(false);

      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("An error occurred while computing Shapley values.");
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
            columns.map((column) => (
              <option key={column} value={column}>
                {column}
              </option>
            ))
          )}
        </select>
      </div>

      <button onClick={computeShapleyValues} disabled={isComputing || !targetColumn} className="button button-primary">
        {isComputing ? `Computing... ${Math.round(progress)}%` : "Compute SHAP Values"}
      </button>

      {isComputing && (
        <div className="modal-overlay">
          <div className="modal-content modal-progress">
            <div className="modal-header">
              <h3 className="modal-title">Computing Shapley Values</h3>
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

    </div>
  );
}
