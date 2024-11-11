import React from 'react';

interface ColumnMenuProps {
  column: string;
  onSort: (column: string) => void;
  onHide: (column: string) => void;
  sortConfig: { id: string; desc: boolean } | null;
}

const ColumnMenu: React.FC<ColumnMenuProps> = ({ column, onSort, onHide, sortConfig }) => {
  return (
    <div className="column-dropdown" onClick={(e) => e.stopPropagation()}>
      <div 
        className="dropdown-item"
        onClick={(e) => {
          e.stopPropagation();
          onSort(column);
        }}
      >
        <span>
          {sortConfig?.id === column 
            ? (sortConfig.desc ? 'Sort ASC ↑' : 'Sort DESC ↓')
            : 'Sort ⇅'
          }
        </span>
      </div>
      <div 
        className="dropdown-item"
        onClick={(e) => {
          e.stopPropagation();
          onHide(column);
        }}
      >
        <span>Hide Column</span>
      </div>
    </div>
  );
};

export default ColumnMenu; 