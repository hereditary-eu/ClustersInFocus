import React from 'react';

interface SelectedRowDisplayProps {
  row: any;
  columns: string[];
  onClear: () => void;
}

const SelectedRowDisplay: React.FC<SelectedRowDisplayProps> = ({ row, columns, onClear }) => {
  return (
    <div className="selected-row-display">
      <div className="selected-row-header">
        <h3>Selected Row</h3>
        <button 
          className="clear-button" 
          onClick={onClear}
          aria-label="Clear selected row"
        >
          ×
        </button>
      </div>
      <div className="selected-row-content">
        {columns.map(column => (
          <div key={column} className="selected-row-item">
            <span className="selected-row-label">{column}</span>
            <span className="selected-row-value">
              {row[column] !== null && row[column] !== undefined 
                ? String(row[column]) 
                : '-'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SelectedRowDisplay; 