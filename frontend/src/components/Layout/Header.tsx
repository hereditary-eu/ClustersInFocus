import React from "react";
import styles from "./Header.module.css";
import { FileUploadButton } from "../Controls/FileUploadButton/FileUploadButton";
import { ComputeClustersButton } from "../Controls/ComputeClustersButton";
import { ComputeShapleyValuesButton } from "../Controls/ComputeShapValuesButton";
import { useAppStore } from "../../stores/useAppStore";
import { useColumnValidation } from "../../hooks/useColumnValidation";

const Header: React.FC = () => {
  const data = useAppStore(state => state.data);
  const { hasMinimumColumns } = useColumnValidation(data.csvData);

  return (
    <header className={styles.header}>
      <div className={styles.title}>Detail-On-Demand Analysis Dashboard</div>
      <div className={styles.controls}>
        {data.csvData.length > 0 && hasMinimumColumns && (
          <>
            <ComputeClustersButton />
            <div className={styles.separator}>|</div>
            <ComputeShapleyValuesButton />
          </>
        )}
        <FileUploadButton />
      </div>
    </header>
  );
};

export default Header;
