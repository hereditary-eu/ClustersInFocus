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
  const [isExpanded, setIsExpanded] = useState(true); // Add this state
  const [data, setData] = useState<DataState>({
    csvData: [],
    columns: []
  });
  const [selectedPCs, setSelectedPCs] = useState<PCSelection>({ pc1: null, pc2: null });
  const [cumulativeExplainedVariance, setCumulativeExplainedVariance] = useState<number[]>([]);

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

  return (
    <div className="App">
      <Header onFileUpload={handleFileUpload} />
      
      <main className="main-content">
        {data.csvData.length > 0 ? (
          <div className="panels-container">
            <div className="panel panel-left">
              <h2>
                Data
                <button 
                  className={`toggle-view-button ${isExpanded ? 'compress-button' : 'expand-button'}`}
                  onClick={() => setIsExpanded(!isExpanded)}
                  aria-label={isExpanded ? "Compress table" : "Expand table"}
                  // hovered: display tooltip
                  title={isExpanded ? "Compress table" : "Expand table"}
                />
              </h2>
              <DataTable 
                data={data.csvData} 
                columns={data.columns} 
                onColumnSelect={handleColumnSelect}
                isExpanded={isExpanded}
              />
            </div>
            
            <div className="panel panel-middle">
              <h2>PCA / Clustering</h2>
              <PCAAnalysis 
                data={data.csvData}
                selectedColumns={selectedColumns}
                onPCAUpdate={handlePCAUpdate}
              />
            </div>
            
            <div className="panel panel-right">
              <h2>Analysis</h2>
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
