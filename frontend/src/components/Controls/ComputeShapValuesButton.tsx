import { useState, useCallback, useEffect } from "react";
import { ClusteringService } from "../../services/ClusteringService";
import { useAppStore } from "../../stores/useAppStore";
import { useColumnValidation } from "../../hooks/useColumnValidation";
import { toast } from "../../stores/useToastStore";
import "../UI/Modal.css";
import styles from "./ComputeShapValuesButton.module.css";

export function ComputeShapleyValuesButton() {
  const data = useAppStore(state => state.data);
  const setShapleyValues = useAppStore(state => state.setShapleyValues);
  const { numericColumns } = useColumnValidation(data.csvData);
  const [isComputing, setIsComputing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [targetColumn, setTargetColumn] = useState<string>(numericColumns[0] || "");

  useEffect(() => {
    if (numericColumns.length === 0) {
      setTargetColumn("");
      return;
    }

    if (!numericColumns.includes(targetColumn)) {
      setTargetColumn(numericColumns[0]);
    }
  }, [numericColumns, targetColumn]);

  const computeShapleyValues = useCallback(async () => {
    if (!targetColumn) return;

    setIsComputing(true);
    setProgress(0);
    try {
      await ClusteringService.computeShapleyValues(
        targetColumn,
        data.fileId || "",
        setProgress,
        data.csvData,
        data.fileName,
      );
      const values = await ClusteringService.getShapleyValues(targetColumn, data.fileId || "");
      setShapleyValues(values);
      toast.success("Shapley values computed successfully!");
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("An error occurred while computing Shapley values.");
      }
    } finally {
      setIsComputing(false);
    }
  }, [targetColumn, data.fileId, data.csvData, data.fileName, setShapleyValues]);

  return (
    <div className={styles.controls}>
      <div className={styles.selectContainer}>
        <select
          className={styles.select}
          value={targetColumn}
          onChange={(e) => setTargetColumn(e.target.value)}
          disabled={isComputing}
        >
          {numericColumns.length === 0 ? (
            <option value="">No columns available</option>
          ) : (
            numericColumns.map((column) => (
              <option key={column} value={column}>
                {column}
              </option>
            ))
          )}
        </select>
      </div>

      <button onClick={computeShapleyValues} disabled={isComputing || !targetColumn} className={styles.button}>
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
