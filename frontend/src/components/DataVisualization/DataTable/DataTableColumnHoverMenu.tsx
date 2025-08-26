import React from "react";

interface ColumnMenuProps {
  column: string;
  sortConfig: { id: string; desc: boolean } | null;
  menuOptions: {
    canSort?: boolean;
    canHide?: boolean;
  };
  onSort?: (column: string) => void;
  onHide?: (column: string) => void;
}

const ColumnMenu: React.FC<ColumnMenuProps> = ({
  column,
  sortConfig,
  menuOptions = {
    canSort: true,
    canHide: true,
  },
  onSort,
  onHide,
}) => {
  return (
    <div className="column-dropdown" onClick={(e) => e.stopPropagation()}>
      {menuOptions.canSort && onSort && (
        <div
          className="dropdown-item"
          onClick={(e) => {
            e.stopPropagation();
            onSort(column);
          }}
        >
          <span>{sortConfig?.id === column ? (sortConfig.desc ? "Sort ASC ↑" : "Sort DESC ↓") : "Sort ⇅"}</span>
        </div>
      )}
      {menuOptions.canHide && onHide && (
        <div
          className="dropdown-item"
          onClick={(e) => {
            e.stopPropagation();
            onHide(column);
          }}
        >
          <span>Hide Column</span>
        </div>
      )}
    </div>
  );
};

export default ColumnMenu;
