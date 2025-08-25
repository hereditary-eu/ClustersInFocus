import "./App.css";
import React from "react";
import { Panel1Data, Panel2Selection, Panel3ClusterSimilarity } from "./components/Panels";
import { Header, Footer } from "./components/Layout";
import { ErrorBoundary, ToastContainer } from "./components/UI";
import { ClusteringService } from "./services/ClusteringService";
import { DataRow } from "./types";
import { useAppStore } from "./stores/useAppStore";
import { toast } from "./stores/useToastStore";

const App: React.FC = () => {
  // Get state and actions from Zustand store using direct access
  const data = useAppStore(state => state.data);
  const setSelectedColumns = useAppStore(state => state.setSelectedColumns);
  const setShapleyValues = useAppStore(state => state.setShapleyValues);
  const handleFileUpload = useAppStore(state => state.handleFileUpload);
  const setExpandedPanel = useAppStore(state => state.setExpandedPanel);

  const handleFileUploadWrapper = (fileName: string, csvData: DataRow[], headers: string[], fileId?: string) => {
    handleFileUpload(fileName, csvData, headers, fileId);
    toast.success(`Successfully loaded ${fileName} with ${csvData.length} rows`);
  };


  const handleShapleyValuesComputed = async (targetColumn: string, fileId: string) => {
    try {
      const values = await ClusteringService.getShapleyValues(targetColumn, fileId);
      setShapleyValues(values);
    } catch (error) {
      toast.error("Failed to compute Shapley values. Please try again.");
    }
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const panelsContainer = document.querySelector(".panels-container");
      if (panelsContainer && !panelsContainer.contains(event.target as Node)) {
        setExpandedPanel(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [setExpandedPanel]);

  return (
    <div className="App">
      <Header
        onFileUpload={handleFileUploadWrapper}
        onClustersComputed={() => {
          setSelectedColumns([]);
        }}
        onShapleyValuesComputed={handleShapleyValuesComputed}
      />

      <main className="main-content">
        {data.csvData.length > 0 ? (
          <div className="panels-container">
            <ErrorBoundary>
              <Panel1Data />
            </ErrorBoundary>
            <ErrorBoundary>
              <Panel2Selection />
            </ErrorBoundary>
            <ErrorBoundary>
              <Panel3ClusterSimilarity />
            </ErrorBoundary>
          </div>
        ) : (
          <div className="upload-prompt">
            <p>No data loaded. Please upload a CSV file.</p>
          </div>
        )}
      </main>

      <Footer />
      <ToastContainer />
    </div>
  );
};

export default App;
