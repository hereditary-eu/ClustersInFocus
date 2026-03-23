import React from "react";
import styles from "./DataTable.module.css";

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
    <div className={styles.columnDropdown} onClick={(e) => e.stopPropagation()}>
      {menuOptions.canSort && onSort && (
        <div
          className={styles.dropdownItem}
          onClick={(e) => {
            e.stopPropagation();
            onSort(column);
          }}
        >
          <span className={styles.dropdownItemText}>
            {sortConfig?.id === column ? (sortConfig.desc ? "Sort ASC \u2191" : "Sort DESC \u2193") : "Sort \u21C5"}
          </span>
        </div>
      )}
      {menuOptions.canHide && onHide && (
        <div
          className={styles.dropdownItem}
          onClick={(e) => {
            e.stopPropagation();
            onHide(column);
          }}
        >
          <span className={styles.dropdownItemText}>Hide Column</span>
        </div>
      )}
    </div>
  );
};

export default ColumnMenu;
