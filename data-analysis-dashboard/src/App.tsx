import './App.css';
import React, { useState } from 'react';
import Panel1Data from './components/Panel1Data';
import Header from './components/Header';
import Footer from './components/Footer';
import ClusteringPanel from './components/Panel2Clustering';
import AnalysisPanel from './components/Panel3Analysis';

// Improve type safety with proper interfaces
interface DataRow {
  [key: string]: string | number;  // Each row is an object with string keys and string/number values
}

interface DataState {
  csvData: DataRow[];
  columns: string[];
}

const App: React.FC = () => {
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [isDataTableExpanded, setIsDataTableExpanded] = useState(true);
  const [data, setData] = useState<DataState>({
    csvData: [],
    columns: []
  });

  const [expandedPanel, setExpandedPanel] = useState<string | null>(null);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [dataViewMode, setDataViewMode] = useState<'numerical' | 'heatmap'>('numerical');

  const handleColumnSelect = (selected: string[]) => {
    setSelectedColumns(selected);
  };

  const handleFileUpload = (csvData: DataRow[], headers: string[]) => {
    console.log('Received data:', { rows: csvData.length, headers }); // Debug log
    setData({
      csvData: csvData,
      columns: headers
    });
  };

  const handlePanelClick = (panelId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent click from bubbling to document
    
    if (expandedPanel !== panelId) {
      setExpandedPanel(panelId);
    }
  };

  const handleColumnHide = (column: string) => {
    setHiddenColumns(prev => [...prev, column]);
  };

  const handleColumnRestore = (column: string) => {
    setHiddenColumns(prev => prev.filter(col => col !== column));
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const panelsContainer = document.querySelector('.panels-container');
      if (panelsContainer && !panelsContainer.contains(event.target as Node)) {
        setExpandedPanel(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="App">
      <Header 
        onFileUpload={handleFileUpload}
        data={data.csvData.length > 0 ? data : undefined}
        onClustersComputed={() => {
          handleColumnSelect([]);
        }}
      />
      
      <main className="main-content">
        {data.csvData.length > 0 ? (
          <div className="panels-container">
            <Panel1Data
              data={data.csvData}
              columns={data.columns}
              expandedPanel={expandedPanel}
              hiddenColumns={hiddenColumns}
              isDataTableExpanded={isDataTableExpanded}
              dataViewMode={dataViewMode}
              onPanelClick={handlePanelClick}
              onColumnHide={handleColumnHide}
              onColumnRestore={handleColumnRestore}
              onColumnSelect={handleColumnSelect}
              setDataViewMode={setDataViewMode}
              setIsDataTableExpanded={setIsDataTableExpanded}
            />
            <ClusteringPanel 
              data={data.csvData}
              selectedColumns={selectedColumns}
              expandedPanel={expandedPanel}
              onPanelClick={handlePanelClick}
            />
            <AnalysisPanel 
              cumulativeExplainedVariance={[/* your data here */]}
              selectedPCs={{ pc1: null, pc2: null }}
              expandedPanel={expandedPanel}
              onPanelClick={handlePanelClick}
            />
          </div>
        ) : (
          <div className="upload-prompt">
            <p>No data loaded. Please upload a CSV file.</p>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default App;
