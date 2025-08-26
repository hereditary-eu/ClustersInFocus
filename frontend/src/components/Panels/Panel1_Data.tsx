import React from "react";
import DataTable from "../DataVisualization/DataTable/DataTable";
import { useAppStore } from "../../stores/useAppStore";

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

  const handlePanelClick = (panelId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (expandedPanel !== panelId) {
      setExpandedPanel(panelId);
    }
  };
  return (
    <div
      className={`panel panel-left ${expandedPanel === "left" ? "expanded" : ""}`}
      onClick={(e) => handlePanelClick("left", e)}
    >
      <h2 className="panel-header">
        <div className="panel-header-title">Data</div>
        <div className="panel-header-options">
          {expandedPanel === "left" && hiddenColumns.length > 0 && (
            <div className="hidden-columns-tags">
              {hiddenColumns.map((col) => (
                <button
                  key={col}
                  className="column-tag"
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
            <div className="view-mode-switch">
              <button
                className={`view-mode-button ${dataViewMode === "numerical" ? "active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setDataViewMode("numerical");
                }}
                title="Show numerical values"
              >
                123
              </button>
              <button
                className={`view-mode-button ${dataViewMode === "heatmap" ? "active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setDataViewMode("heatmap");
                }}
                title="Show heatmap"
              >
                ▦
              </button>
            </div>
          )}
          <button
            className={`toggle-view-button ${isDataTableExpanded ? "compress-button" : "expand-button"}`}
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
        onColumnRestore={removeHiddenColumn}
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
