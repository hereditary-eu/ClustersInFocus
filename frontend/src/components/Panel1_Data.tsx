import React from 'react';
import DataTable from './DataTable';

interface DataRow {
  [key: string]: string | number;
}

interface Panel1DataProps {
  data: DataRow[];
  columns: string[];
  expandedPanel: string | null;
  hiddenColumns: string[];
  isDataTableExpanded: boolean;
  dataViewMode: 'numerical' | 'heatmap';
  onPanelClick: (panelId: string, event: React.MouseEvent) => void;
  onColumnHide: (column: string) => void;
  onColumnRestore: (column: string) => void;
  onColumnSelect: (selected: string[]) => void;
  setDataViewMode: (mode: 'numerical' | 'heatmap') => void;
  setIsDataTableExpanded: (expanded: boolean) => void;
}

const Panel1Data: React.FC<Panel1DataProps> = ({
  data,
  columns,
  expandedPanel,
  hiddenColumns,
  isDataTableExpanded,
  dataViewMode,
  onPanelClick,
  onColumnHide,
  onColumnRestore,
  onColumnSelect,
  setDataViewMode,
  setIsDataTableExpanded,
}) => {
  return (
    <div 
      className={`panel panel-left ${expandedPanel === 'left' ? 'expanded' : ''}`}
      onClick={(e) => onPanelClick('left', e)}
    >
      <h2 className="panel-header-left">
        <div className="panel-header-title">Data</div>
        <div className='panel-header-options'>
          {expandedPanel === 'left' && hiddenColumns.length > 0 && (
            <div className="hidden-columns-tags">
              {hiddenColumns.map((col) => (
                <button
                  key={col}
                  className="column-tag"
                  onClick={(e) => {
                    e.stopPropagation();
                    onColumnRestore(col);
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
                className={`view-mode-button ${dataViewMode === 'numerical' ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setDataViewMode('numerical');
                }}
                title="Show numerical values"
              >
                123
              </button>
              <button
                className={`view-mode-button ${dataViewMode === 'heatmap' ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setDataViewMode('heatmap');
                }}
                title="Show heatmap"
              >
                ▦
              </button>
            </div>
          )}
          <button 
            className={`toggle-view-button ${isDataTableExpanded ? 'compress-button' : 'expand-button'}`}
            onClick={() => setIsDataTableExpanded(!isDataTableExpanded)}
            aria-label={isDataTableExpanded ? "Compress table" : "Expand table"}
            title={isDataTableExpanded ? "Compress table" : "Expand table"}
          />
        </div>
      </h2>
      <DataTable 
        data={data} 
        columns={columns}
        hiddenColumns={hiddenColumns}
        onColumnHide={onColumnHide}
        onColumnRestore={onColumnRestore}
        onColumnSelect={onColumnSelect}
        isExpanded={isDataTableExpanded}
        viewMode={dataViewMode}
        menuOptions={{
          canSort: true,
          canHide: true
        }}
      />
    </div>
  );
};

export default Panel1Data; 