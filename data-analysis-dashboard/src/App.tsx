import './App.css';
import React, { useState } from 'react';
import DataTable from './components/DataTable';
import PCAAnalysis from './components/PCAAnalysis';
import Header from './components/Header';
import Footer from './components/Footer';
import AnalysisPanel from './components/AnalysisPanel';

// Improve type safety with proper interfaces
interface DataRow {
  [key: string]: string | number;  // Each row is an object with string keys and string/number values
}

interface DataState {
  csvData: DataRow[];
  columns: string[];
}

// Add to your interfaces
interface PCSelection {
  pc1: number | null;
  pc2: number | null;
}

const App: React.FC = () => {
  // Initialize state with proper typing
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [isDataTableExpanded, setIsDataTableExpanded] = useState(true); // Add this state
  const [data, setData] = useState<DataState>({
    csvData: [],
    columns: []
  });
  const [selectedPCs, setSelectedPCs] = useState<PCSelection>({ pc1: null, pc2: null });
  const [cumulativeExplainedVariance, setCumulativeExplainedVariance] = useState<number[]>([]);
  const [expandedPanel, setExpandedPanel] = useState<string | null>(null);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

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

  const handlePCAUpdate = (pcSelection: PCSelection, variance: number[]) => {
    setSelectedPCs(pcSelection);
    setCumulativeExplainedVariance(variance);
  };

  const handlePanelClick = (panelId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent click from bubbling to document
    
    // Only change panel state if clicking a different panel or a collapsed panel
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
      <Header onFileUpload={handleFileUpload} />
      
      <main className="main-content">
        {data.csvData.length > 0 ? (
          <div className="panels-container">
            <div 
              className={`panel panel-left ${expandedPanel === 'left' ? 'expanded' : ''}`}
              onClick={(e) => handlePanelClick('left', e)}
            >
              <h2 className="panel-header-left">
                <div className="panel-header-title">Data</div>
                <div className='panel-header-options'>
                  {expandedPanel === 'left' && hiddenColumns.length > 0 && (
                    <div className="hidden-columns-tags">
                      {hiddenColumns.map((col) => (
                        <span key={col} className="column-tag">
                          {col}: hidden
                          <button 
                            className="restore-column-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleColumnRestore(col);
                            }}
                            title="Restore column"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <button 
                    className={`toggle-view-button ${isDataTableExpanded ? 'compress-button' : 'expand-button'}`}
                    onClick={() => setIsDataTableExpanded(!isDataTableExpanded)}
                    aria-label={isDataTableExpanded ? "Compress table" : "Expand table"}
                    title={isDataTableExpanded ? "Compress table" : "Expand table"}
                  />
                </div>
              </h2>
              <DataTable 
                data={data.csvData} 
                columns={data.columns}
                hiddenColumns={hiddenColumns}
                onColumnHide={handleColumnHide}
                onColumnRestore={handleColumnRestore}
                onColumnSelect={handleColumnSelect}
                isExpanded={isDataTableExpanded}
              />
            </div>
            
            <div 
              className={`panel panel-middle ${expandedPanel === 'middle' ? 'expanded' : ''}`}
              onClick={(e) => handlePanelClick('middle', e)}
            >
              <h2>
                <div className='panel-header-middle-title'>Clustering</div>
              </h2>
              <PCAAnalysis 
                data={data.csvData}
                selectedColumns={selectedColumns}
                onPCAUpdate={handlePCAUpdate}
              />
            </div>
            
            <div 
              className={`panel panel-right ${expandedPanel === 'right' ? 'expanded' : ''}`}
              onClick={(e) => handlePanelClick('right', e)}
            >
              <h2>
                <div className='panel-header-title'>Analysis</div>
              </h2>
              <AnalysisPanel
                selectedPCs={selectedPCs}
                cumulativeExplainedVariance={cumulativeExplainedVariance}
              />
            </div>
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
