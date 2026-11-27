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
    try {
      setShapleyValues(await ClusteringService.computeShapleyValues(data.csvData, numericColumns, targetColumn));
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
  }, [targetColumn, data.csvData, numericColumns, setShapleyValues]);

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
        {isComputing ? "Computing..." : "Compute SHAP Values"}
      </button>

      {isComputing && (
        <div className="modal-overlay">
          <div className="modal-content modal-progress">
            <div className="modal-header">
              <h3 className="modal-title">Computing Shapley Values</h3>
            </div>
            <div className="modal-body">
              <p className="progress-text">Running in your browser…</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
