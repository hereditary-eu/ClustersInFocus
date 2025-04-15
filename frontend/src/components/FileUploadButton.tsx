import React, { useRef, useState, useEffect } from 'react';
import { FileService } from '../services/FileService';
import { ClusteringService } from '../services/ClusteringService';
import { DatasetInfo, FileUploadButtonProps } from '../types';
import '../components/styles/FileUploadButton.css';

export function FileUploadButton({ onFileLoaded, onClustersFound }: FileUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [savedDatasets, setSavedDatasets] = useState<DatasetInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<DatasetInfo | null>(null);

  const loadSavedDatasets = async () => {
    try {
      // Get all datasets directly from the server
      const serverDatasets = await FileService.getAllDatasets();
      const mappedDatasets = serverDatasets.map(dataset => ({
        name: dataset.filename,
        hash: dataset.id
      }));
      setSavedDatasets(mappedDatasets);
    } catch (error) {
      console.error('Error loading datasets from server:', error);
      setSavedDatasets([]);
    }
  };

  useEffect(() => {
    // Load saved datasets from backend
    loadSavedDatasets();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setLoading(true);
        setFileName(file.name);
        setShowOptions(false);
        setError(null); // Clear any previous errors
        
        // Validate file size
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          throw new Error("File is too large. Maximum file size is 10MB.");
        }

        // Validate file type
        if (!file.name.toLowerCase().endsWith('.csv')) {
          throw new Error("Only CSV files are supported.");
        }

        const { data, headers, fileId } = await FileService.parseCSVFile(file);
        onFileLoaded(file.name, data, headers, fileId);
        // Refresh the saved datasets list
        await loadSavedDatasets();
      } catch (error) {
        console.error('Error parsing file:', error);
        setFileName(null);
        setError(error instanceof Error ? error.message : "Failed to upload file. Please check file format.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSelectDataset = async (dataset: DatasetInfo) => {
    if (!dataset.hash) {
      console.error('Dataset has no hash ID');
      setError("Dataset has no ID. Cannot load.");
      return;
    }

    try {
      setLoading(true);
      setFileName(dataset.name);
      setShowOptions(false);
      setError(null); // Clear any previous errors
      
      const { data, headers } = await FileService.getDatasetById(dataset.hash);
      onFileLoaded(dataset.name, data, headers, dataset.hash);
      
      // Check if there are existing clusters for this dataset
      if (onClustersFound) {
        try {
          const existingClusters = await ClusteringService.checkExistingClusters(dataset.hash);
          if (existingClusters && existingClusters.length > 0) {
            console.log('Found existing clusters for dataset:', existingClusters);
            onClustersFound();
          }
        } catch (clusterErr) {
          console.error('Error checking for existing clusters:', clusterErr);
          // Continue normally even if cluster check fails
        }
      }
    } catch (error) {
      console.error('Error loading dataset:', error);
      setFileName(null);
      setError(error instanceof Error ? error.message : "Failed to load dataset. Please try again.");
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
    if (!showConfirmDelete || !showConfirmDelete.hash) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await FileService.deleteDataset(showConfirmDelete.hash);
      
      if (result.success) {
        // Update the list of datasets
        await loadSavedDatasets();
      } else {
        setError(`Failed to delete dataset: ${result.message}`);
      }
    } catch (error) {
      console.error('Error deleting dataset:', error);
      setError(error instanceof Error ? error.message : "Failed to delete dataset");
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

  const dismissError = () => {
    setError(null);
  };

  return (
    <div className="file-upload-container">
      {fileName && <span className="file-name">{fileName}</span>}
      {loading && <span className="loading-indicator">Loading...</span>}
      {error && (
        <div className="error-container">
          <span className="error-message">{error}</span>
          <button 
            className="error-dismiss" 
            onClick={dismissError}
            aria-label="Dismiss error"
          >
            &times;
          </button>
        </div>
      )}
      
      {/* Confirmation dialog */}
      {showConfirmDelete && (
        <div className="confirm-delete-container">
          <div className="confirm-delete-dialog">
            <p className="confirm-delete-message">
              Are you sure you want to delete dataset "{showConfirmDelete.name}"?
            </p>
            <div className="confirm-delete-buttons">
              <button 
                className="confirm-delete-button delete"
                onClick={confirmDelete}
              >
                Delete
              </button>
              <button 
                className="confirm-delete-button cancel"
                onClick={cancelDelete}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      <input 
        ref={fileInputRef}
        type="file" 
        accept=".csv" 
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      
      <button 
        className="file-upload-button"
        onClick={toggleOptions}
        aria-label="Upload file"
        disabled={loading}
      />
      
      {showOptions && !showConfirmDelete && (
        <div className="upload-options-dropdown">
          <button 
            className="upload-option button button-primary"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload new file
          </button>
          
          <div className="saved-datasets-list">
            <h4>Saved Datasets</h4>
            {savedDatasets.length === 0 ? (
              <p className="no-datasets">No saved datasets</p>
            ) : (
              savedDatasets.map((dataset, index) => (
                <div key={index} className="dataset-option-container">
                  <button
                    className="dataset-option"
                    onClick={() => handleSelectDataset(dataset)}
                  >
                    {dataset.name}
                  </button>
                  <button
                    className="dataset-delete-button"
                    onClick={(e) => handleDeleteDataset(dataset, e)}
                    aria-label={`Delete dataset ${dataset.name}`}
                    title={`Delete dataset ${dataset.name}`}
                  >
                    &times;
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}