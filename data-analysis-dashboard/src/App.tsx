import './App.css';
import React, { useState } from 'react';
import Papa from 'papaparse';
import DataTable from './components/DataTable';

import Boxplot from './components/BoxplotReactCharts';
import BoxplotRecharts from './components/BoxplotRecharts';
import HistogramRecharts from './components/HistogramRecharts';
import BarChart from './components/BarChartD3';

const App: React.FC = () => {
  const [csvData, setCsvData] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]); // Track selected columns

  const sampleData = [35, 42, 55, 70, 80, 90, 100, 120, 130, 145];

  const handleFileUpload = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const data = result.data as object[];
        const keys = Object.keys(data[0] as object);

        // Create columns in the format react-table requires
        const tableColumns = keys.map((key) => ({
          Header: key,
          accessor: key,
        }));

        setColumns(tableColumns);
        setCsvData(data);
      }
    });
  };

  const handleColumnSelect = (selected: string[]) => {
    setSelectedColumns(selected); // Track selected columns in state
  };

  return (
    <div className="App">
      <h1>Data Analysis Dashboard</h1>
      
      {/* File Upload Section */}
      <input
        type="file"
        accept=".csv"
        onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
      />
      
      {/* Display DataTable once CSV is uploaded */}
      {csvData.length > 0 && (
        <div>
          <h2>CSV Data Table</h2>
          <DataTable data={csvData} columns={columns} onColumnSelect={handleColumnSelect} />
        </div>
      )}
        
      {/* Display Boxplot with sample data
      <div>
        <h2>Boxplot attempt react charts</h2>
        <Boxplot data={sampleData} />
      </div> */}

      {/* Display Boxplot with sample data
      <div>
        <h2>Boxplot attempt recharts</h2>
        <BoxplotRecharts data={sampleData} />
      </div> */}
      <hr />
      <h2>DEBUG: Selected Columns</h2>
      <ul>
        {selectedColumns.map((col) => (
          <li key={col}>{col}</li>
        ))}
      </ul>
      
      <hr />
      
      <h2>Charting Component Tests</h2>
      {/* Display Histogram with sample data */}
      <div>
        <h2>Histogram</h2>
        <HistogramRecharts data={sampleData} />
      </div>

      {/* Display BarChart with sample data */}
      <div>
        <h2>Bar Chart</h2>
        <BarChart data={sampleData} />
      </div>
  </div>
  );
};

export default App;