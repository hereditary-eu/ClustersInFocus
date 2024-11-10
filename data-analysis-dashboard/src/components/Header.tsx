// should contain the title of the app and the load button
import React from 'react';
import FileUpload from './FileUpload';
import { KMeansFeaturePairs } from './KMeansFeaturePairs';

interface DataRow {
  [key: string]: string | number;
}

interface HeaderProps {
  onFileUpload: (data: DataRow[], headers: string[]) => void;
  data?: {
    csvData: DataRow[];
    columns: string[];
  };
}

const Header: React.FC<HeaderProps> = ({ 
  onFileUpload, 
  data 
}) => {
  const handleFileLoaded = (csvData: DataRow[], headers: string[]) => {
    onFileUpload(csvData, headers);
  };

  // Get only numeric columns
  const numericColumns = data?.columns.filter(col => 
    data.csvData.length > 0 && typeof data.csvData[0][col] === 'number'
  ) ?? [];

  return (
    <header>
      <div className="header-title">Data Analysis Dashboard</div>
      <div className="header-controls">
        {data && numericColumns.length >= 2 && (
          <KMeansFeaturePairs
            csvData={data.csvData}
            columns={numericColumns}
            k={3}
          />
        )}
        <FileUpload onFileLoaded={handleFileLoaded} />
      </div>
    </header>
  );
};

export default Header;
