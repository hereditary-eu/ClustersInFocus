import React from 'react';
import { FileUploadButton } from './FileUploadButton';
import { ComputeClustersButton } from './ComputeClustersButton';
import { DataRow } from '../services/FileService';

interface HeaderProps {
  onFileUpload: (data: DataRow[], headers: string[]) => void;
  onClustersComputed: () => void;
  data?: {
    csvData: DataRow[];
    columns: string[];
  };
}

const Header: React.FC<HeaderProps> = ({ onFileUpload, data, onClustersComputed }) => {
  const numericColumns = data?.columns.filter(col => 
    data.csvData.length > 0 && typeof data.csvData[0][col] === 'number'
  ) ?? [];

  return (
    <header>
      <div className="header-title">Data Analysis Dashboard</div>
      <div className="header-controls">
        {data && numericColumns.length >= 2 && (
          <ComputeClustersButton
            csvData={data.csvData}
            columns={numericColumns}
            onClustersComputed={onClustersComputed}
          />
        )}
        <FileUploadButton onFileLoaded={onFileUpload} />
      </div>
    </header>
  );
};

export default Header;
