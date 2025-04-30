import React from "react";
import { FileUploadButton } from "./FileUploadButton";
import { ComputeClustersButton } from "./ComputeClustersButton";
import { ComputeShapleyValuesButton } from "./ComputeShapValuesButton";
import { DataRow, DataState } from "../types";

interface HeaderProps {
  onFileUpload: (fileName: string, data: DataRow[], headers: string[], fileId?: string) => void;
  onClustersComputed: () => void;
  onShapleyValuesComputed: (targetColumn: string, fileId: string) => void;
  data?: DataState;
}

const Header: React.FC<HeaderProps> = ({ onFileUpload, data, onClustersComputed, onShapleyValuesComputed }) => {
  const numericColumns =
    data?.columns.filter((col) => data.csvData.length > 0 && typeof data.csvData[0][col] === "number") ?? [];

  const handleFileLoaded = (fileName: string, data: DataRow[], headers: string[], fileId?: string) => {
    onFileUpload(fileName, data, headers, fileId);
  };

  return (
    <header>
      <div className="header-title">Detail-On-Demand Analysis Dashboard</div>
      <div className="header-controls">
        {data && numericColumns.length >= 2 && (
          <>
            <ComputeClustersButton
              csvData={data.csvData}
              columns={numericColumns}
              onClustersComputed={onClustersComputed}
              fileId={data.fileId}
              fileName={data.fileName}
            />
            <div className="separator">|</div>
            <ComputeShapleyValuesButton
              columns={numericColumns}
              onShapleyValuesComputed={onShapleyValuesComputed}
              fileId={data.fileId}
              data={data.csvData}
              fileName={data.fileName}
            />
          </>
        )}
        <FileUploadButton onFileLoaded={handleFileLoaded} onClustersFound={onClustersComputed} />
      </div>
    </header>
  );
};

export default Header;
