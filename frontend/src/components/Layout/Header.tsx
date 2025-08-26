import React from "react";
import { FileUploadButton } from "../Controls/FileUploadButton/FileUploadButton";
import { ComputeClustersButton } from "../Controls/ComputeClustersButton";
import { ComputeShapleyValuesButton } from "../Controls/ComputeShapValuesButton";
import { DataRow } from "../../types";
import { useAppStore } from "../../stores/useAppStore";
import { useColumnValidation } from "../../hooks/useColumnValidation";

interface HeaderProps {
  onFileUpload: (fileName: string, data: DataRow[], headers: string[], fileId?: string) => void;
  onClustersComputed: () => void;
  onShapleyValuesComputed: (targetColumn: string, fileId: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onFileUpload, onClustersComputed, onShapleyValuesComputed }) => {
  const data = useAppStore(state => state.data);
  const { numericColumns, hasMinimumColumns } = useColumnValidation(data.csvData);

  const handleFileLoaded = (fileName: string, data: DataRow[], headers: string[], fileId?: string) => {
    onFileUpload(fileName, data, headers, fileId);
  };

  return (
    <header>
      <div className="header-title">Detail-On-Demand Analysis Dashboard</div>
      <div className="header-controls">
        {data.csvData.length > 0 && hasMinimumColumns && (
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
