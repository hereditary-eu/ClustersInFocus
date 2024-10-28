import './App.css';
import React, { useState } from 'react';
import DataTable from './components/DataTable';
// import HistogramRecharts from './components/HistogramRecharts';
import Header from './components/Header';
import Footer from './components/Footer';

// Improve type safety with proper interfaces
interface DataRow {
  [key: string]: string | number;  // Each row is an object with string keys and string/number values
}

interface DataState {
  csvData: DataRow[];
  columns: string[];
}

const App: React.FC = () => {
  // Initialize state with proper typing
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [data, setData] = useState<DataState>({
    csvData: [],
    columns: []
  });

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

  return (
    <div className="App">
      <Header onFileUpload={handleFileUpload} />
      
      <main className="main-content">
        {data.csvData.length > 0 ? (
          <div className="panels-container">
            <div className="panel panel-left">
              <div className="table-panel-content">
                <h2> Data</h2>
                <DataTable 
                  data={data.csvData} 
                  columns={data.columns} 
                  onColumnSelect={handleColumnSelect} 
                />
              </div>
            </div>
            
            <div className="panel panel-middle">
              <h2>Visualization</h2>
              {/* pca clustering component here */}
              <p>Visualization coming soon...</p>
            </div>
            
            <div className="panel panel-right">
              <h2>Analysis</h2>
              <div className="debug-section">
                <h4>Debug Section</h4>
                <p>Selected Columns</p>
                <ul>
                  {selectedColumns.map((col) => (
                    <li key={col}>{col}</li>
                  ))}
                </ul>
              </div>
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
