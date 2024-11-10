import React from 'react';

interface ColumnMenuProps {
  column: string;
  onSort: (columnId: string) => void;
  onHide: (columnId: string) => void;
  sortConfig: { id: string; desc: boolean } | null;
}

const ColumnMenu: React.FC<ColumnMenuProps> = ({ 
  column, 
  onSort, 
  onHide,
  sortConfig 
}) => {
  const isSorted = sortConfig?.id === column;
  const sortDirection = isSorted ? (sortConfig.desc ? 'DESC ↓' : 'ASC ↑') : '';

  return (
    <div className="column-dropdown">
      <div 
        className="dropdown-item" 
        onClick={(e) => {
          e.stopPropagation();
          onSort(column);
        }}
      >
        <span>Sort {sortDirection}</span>
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