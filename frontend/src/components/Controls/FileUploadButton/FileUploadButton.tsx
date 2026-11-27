import React, { useRef, useState, useEffect } from "react";
import { EXAMPLE_DATASET, FileService } from "../../../services/FileService";
import { DatasetInfo } from "../../../types";
import { useAppStore } from "../../../stores/useAppStore";
import { toast } from "../../../stores/useToastStore";
import styles from "./FileUploadButton.module.css";

export function FileUploadButton() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileUpload = useAppStore(state => state.handleFileUpload);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [savedDatasets, setSavedDatasets] = useState<DatasetInfo[]>([]);
  const [showConfirmDelete, setShowConfirmDelete] = useState<DatasetInfo | null>(null);

  const loadSavedDatasets = async () => {
    setSavedDatasets(await FileService.getAllDatasets());
  };

  useEffect(() => {
    loadSavedDatasets();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setLoading(true);
        setFileName(file.name);
        setShowOptions(false);

        // Validate file size
        if (file.size > 10 * 1024 * 1024) {
          // 10MB limit
          throw new Error("File is too large. Maximum file size is 10MB.");
        }

        // Validate file type
        if (!file.name.toLowerCase().endsWith(".csv")) {
          throw new Error("Only CSV files are supported.");
        }

        const { data, headers } = await FileService.parseCSVFile(file);
        try {
          const saved = await FileService.saveDataset(file.name, data, headers);
          handleFileUpload(file.name, data, headers, String(saved.id));
          toast.success(`Successfully loaded ${file.name} with ${data.length} rows`);
        } catch {
          handleFileUpload(file.name, data, headers, "unsaved");
          toast.error(`Loaded ${file.name}, but this browser did not allow saving it for later.`);
        }
        await loadSavedDatasets();
      } catch (error) {
        setFileName(null);
        toast.error(error instanceof Error ? error.message : "Failed to upload file. Please check file format.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSelectDataset = async (dataset: DatasetInfo) => {
    try {
      setLoading(true);
      setFileName(dataset.name);
      setShowOptions(false);

      const { data, headers } = await FileService.getDataset(dataset);
      handleFileUpload(dataset.name, data, headers, String(dataset.id));
      toast.success(`Successfully loaded ${dataset.name} with ${data.length} rows`);
    } catch (error) {
      setFileName(null);
      toast.error(error instanceof Error ? error.message : "Failed to load dataset. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDataset = async (dataset: DatasetInfo, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering dataset selection

    // Show confirmation dialog
    setShowConfirmDelete(dataset);
  };

  const confirmDelete = async () => {
    if (!showConfirmDelete) {
      return;
    }

    try {
      setLoading(true);
      await FileService.deleteDataset(showConfirmDelete);
      await loadSavedDatasets();
      toast.success("Dataset deleted successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete dataset");
    } finally {
      setLoading(false);
      setShowConfirmDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowConfirmDelete(null);
  };

  const toggleOptions = async () => {
    // Refresh the list each time the options are shown
    if (!showOptions) {
      await loadSavedDatasets();
    }
    setShowOptions(!showOptions);
  };


  return (
    <div className={styles.fileUploadContainer}>
      {fileName && <span className={styles.fileName}>{fileName}</span>}
      {loading && <span className={styles.loadingIndicator}>Loading...</span>}

      {/* Confirmation dialog */}
      {showConfirmDelete && (
        <div className={styles.confirmDeleteContainer}>
          <div className={styles.confirmDeleteDialog}>
            <p className={styles.confirmDeleteMessage}>
              Are you sure you want to delete dataset "{showConfirmDelete.name}"?
            </p>
            <div className={styles.confirmDeleteButtons}>
              <button
                className={`${styles.confirmDeleteButton} ${styles.confirmDeleteButtonDelete}`}
                onClick={confirmDelete}
              >
                Delete
              </button>
              <button
                className={`${styles.confirmDeleteButton} ${styles.confirmDeleteButtonCancel}`}
                onClick={cancelDelete}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} style={{ display: "none" }} />

      <button className={styles.fileUploadButton} onClick={toggleOptions} aria-label="Choose dataset" title="Choose dataset" disabled={loading} />

      {showOptions && !showConfirmDelete && (
        <div className={styles.uploadOptionsDropdown}>
          <button className={styles.uploadOption} onClick={() => fileInputRef.current?.click()}>
            Open CSV file
          </button>
          <p className={styles.privacyNote}>Files are processed and saved only in this browser, never uploaded.</p>

          <div className={styles.savedDatasetsList}>
            <h4 className={styles.savedDatasetsTitle}>Saved Datasets</h4>
            {savedDatasets.map((dataset) => (
              <div key={dataset.id} className={styles.datasetOptionContainer}>
                <button className={styles.datasetOption} onClick={() => handleSelectDataset(dataset)}>
                  {dataset.name}
                  {dataset.id === EXAMPLE_DATASET.id && " (example)"}
                </button>
                {dataset.id !== EXAMPLE_DATASET.id && (
                  <button
                    className={styles.datasetDeleteButton}
                    onClick={(e) => handleDeleteDataset(dataset, e)}
                    aria-label={`Delete dataset ${dataset.name}`}
                    title={`Delete dataset ${dataset.name}`}
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
