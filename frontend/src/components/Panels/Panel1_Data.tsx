import React from "react";
import DataTable from "../DataVisualization/DataTable/DataTable";
import { useAppStore } from "../../stores/useAppStore";
import styles from "./Panel1_Data.module.css";
import shellStyles from "./PanelShell.module.css";

const Panel1Data: React.FC = () => {
  const data = useAppStore(state => state.data);
  const shapleyValues = useAppStore(state => state.shapleyValues);
  const expandedPanel = useAppStore(state => state.expandedPanel);
  const hiddenColumns = useAppStore(state => state.hiddenColumns);
  const isDataTableExpanded = useAppStore(state => state.isDataTableExpanded);
  const dataViewMode = useAppStore(state => state.dataViewMode);
  const setExpandedPanel = useAppStore(state => state.setExpandedPanel);
  const addHiddenColumn = useAppStore(state => state.addHiddenColumn);
  const removeHiddenColumn = useAppStore(state => state.removeHiddenColumn);
  const setDataViewMode = useAppStore(state => state.setDataViewMode);
  const setIsDataTableExpanded = useAppStore(state => state.setIsDataTableExpanded);
  const setSelectedColumns = useAppStore(state => state.setSelectedColumns);
  const isExpanded = expandedPanel === "left";
  const isCollapsed = expandedPanel !== null && !isExpanded;

  const handlePanelClick = (panelId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (expandedPanel !== panelId) {
      setExpandedPanel(panelId);
    }
  };

  return (
    <div
      className={`${shellStyles.panel} ${styles.panelLeft} ${isExpanded ? shellStyles.expanded : ""} ${isCollapsed ? shellStyles.collapsed : ""} ${isCollapsed ? shellStyles.dimmed : ""}`}
      onClick={(e) => handlePanelClick("left", e)}
    >
      <h2 className={shellStyles.panelHeader}>
        <div>Data</div>
        <div className={styles.headerOptions}>
          {expandedPanel === "left" && hiddenColumns.length > 0 && (
            <div className={styles.hiddenColumnsTags}>
              {hiddenColumns.map((col) => (
                <button
                  key={col}
                  className={styles.columnTag}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeHiddenColumn(col);
                  }}
                  title="Click to restore column"
                >
                  {col}: hidden
                </button>
              ))}
            </div>
          )}
          {isDataTableExpanded && (
            <div className={styles.viewModeSwitch}>
              <button
                className={`${styles.viewModeButton} ${dataViewMode === "numerical" ? styles.viewModeButtonActive : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setDataViewMode("numerical");
                }}
                title="Show numerical values"
              >
                123
              </button>
              <button
                className={`${styles.viewModeButton} ${dataViewMode === "heatmap" ? styles.viewModeButtonActive : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setDataViewMode("heatmap");
                }}
                title="Show heatmap"
              >
                {"\u25A6"}
              </button>
            </div>
          )}
          <button
            className={`${styles.toggleViewButton} ${isDataTableExpanded ? styles.compressButton : styles.expandButton}`}
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
        onColumnHide={addHiddenColumn}
        onColumnSelect={setSelectedColumns}
        isExpanded={isDataTableExpanded}
        viewMode={dataViewMode}
        menuOptions={{
          canSort: true,
          canHide: true,
        }}
        shapleyValues={shapleyValues}
      />
    </div>
  );
};

export default Panel1Data;
