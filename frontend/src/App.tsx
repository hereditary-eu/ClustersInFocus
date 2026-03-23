import React from "react";
import styles from "./App.module.css";
import { Panel1Data, Panel2Selection, Panel3ClusterSimilarity } from "./components/Panels";
import { Header, Footer } from "./components/Layout";
import { ErrorBoundary, ToastContainer } from "./components/UI";
import { useAppStore } from "./stores/useAppStore";

const App: React.FC = () => {
  const data = useAppStore(state => state.data);
  const setExpandedPanel = useAppStore(state => state.setExpandedPanel);
  const panelsContainerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelsContainerRef.current && !panelsContainerRef.current.contains(event.target as Node)) {
        setExpandedPanel(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [setExpandedPanel]);

  return (
    <div className={styles.app}>
      <Header />

      <main className={styles.mainContent}>
        {data.csvData.length > 0 ? (
          <div ref={panelsContainerRef} className={styles.panelsContainer}>
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
          <div className={styles.uploadPrompt}>
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
