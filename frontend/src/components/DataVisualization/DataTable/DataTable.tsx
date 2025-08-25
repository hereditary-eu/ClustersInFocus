import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useTable, Column } from "react-table";
import Histogram from "../Histogram";
import ColumnMenu from "./DataTableColumnHoverMenu";
import { ShapleyValueItem, DataRow } from "../../../types";

interface DataTableProps {
  data: DataRow[];
  columns: string[];
  hiddenColumns: string[];
  onColumnHide: (column: string) => void;
  onColumnRestore: (column: string) => void;
  onColumnSelect: (selectedColumns: string[]) => void;
  isExpanded: boolean;
  viewMode: "numerical" | "heatmap";
  menuOptions?: {
    canSort?: boolean;
    canHide?: boolean;
  };
  shapleyValues?: ShapleyValueItem[] | null;
}

// Add type definition for column types
type ColumnType = "number" | "string" | "mixed";

const DataTable: React.FC<DataTableProps> = ({
  data,
  columns,
  hiddenColumns,
  onColumnHide,
  onColumnSelect,
  isExpanded,
  viewMode,
  menuOptions = {
    canSort: true,
    canHide: true,
  },
  shapleyValues,
}) => {
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [activeHistogram, setActiveHistogram] = useState<string | null>(null);
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ id: string; desc: boolean } | null>(null);
  const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null);

  // Reset activeHistogram when data changes
  useEffect(() => {
    if (activeHistogram) {
      setActiveHistogram(null);
    }
  }, [data, activeHistogram]);

  const handleSort = (columnId: string) => {
    setSortConfig((prev) => ({
      id: columnId,
      desc: prev?.id === columnId ? !prev.desc : false,
    }));
  };

  const handleHideColumn = useCallback((columnId: string) => {
    onColumnHide(columnId);
  }, [onColumnHide]);

  // Determine column type based on data
  const getColumnType = useCallback((columnId: string): ColumnType => {
    const values = data.map((row) => row[columnId]);
    const hasNumbers = values.some((val) => typeof val === "number");
    const hasStrings = values.some((val) => typeof val === "string");

    if (hasNumbers && !hasStrings) return "number";
    if (hasStrings && !hasNumbers) return "string";
    return "mixed";
  }, [data]);

  // Custom sort function
  const sortData = useCallback((a: DataRow, b: DataRow, columnId: string): number => {
    const columnType = getColumnType(columnId);
    const aValue = a[columnId];
    const bValue = b[columnId];

    // Handle null/undefined values
    if (aValue == null) return 1;
    if (bValue == null) return -1;
    if (aValue == null && bValue == null) return 0;

    switch (columnType) {
      case "number":
        return Number(aValue) - Number(bValue);
      case "string":
        return String(aValue).localeCompare(String(bValue));
      case "mixed": {
        // For mixed types, try to convert to numbers if possible
        const aNum = Number(aValue);
        const bNum = Number(bValue);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        return String(aValue).localeCompare(String(bValue));
      }
      default:
        return 0;
    }
  }, [data, getColumnType]);

  // Sort the data based on current sort config
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const sortOrder = sortConfig.desc ? -1 : 1;
      return sortData(a, b, sortConfig.id) * sortOrder;
    });
  }, [data, sortConfig, sortData]);

  // Format columns for react-table
  const expandedTableColumns = useMemo<Column[]>(
    () =>
      columns
        .filter((col) => !hiddenColumns.includes(col))
        .map((col) => ({
          Header: () => (
            <div
              className={`column-header ${
                sortConfig?.id === col ? (sortConfig.desc ? "sorted-desc" : "sorted-asc") : ""
              }`}
              onMouseEnter={() => setHoveredColumn(col)}
              onMouseLeave={() => setHoveredColumn(null)}
            >
              <span>{col}</span>
              {hoveredColumn === col && (
                <ColumnMenu
                  column={col}
                  onSort={menuOptions.canSort ? handleSort : undefined}
                  onHide={menuOptions.canHide ? handleHideColumn : undefined}
                  sortConfig={sortConfig}
                  menuOptions={menuOptions}
                />
              )}
            </div>
          ),
          accessor: col,
          id: col,
          sortType: (rowA: DataRow, rowB: DataRow) => sortData(rowA, rowB, col),
        })),
    [columns, hiddenColumns, hoveredColumn, sortConfig, menuOptions, handleHideColumn, sortData],
  );

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable({
    columns: expandedTableColumns as readonly Column<DataRow>[],
    data: sortedData,
  });

  const toggleColumnSelection = (colId: string) => {
    const newSelected = selectedColumns.includes(colId)
      ? selectedColumns.filter((col) => col !== colId)
      : selectedColumns.length >= 2
        ? [...selectedColumns.slice(1), colId]
        : [...selectedColumns, colId];

    setSelectedColumns(newSelected);
    // Move the parent update outside of setState
    onColumnSelect(newSelected);
  };

  const getColumnData = (columnName: string): number[] => {
    return data.map((row) => row[columnName]).filter((value) => !isNaN(value));
  };

  // Helper function to check if a column is numerical
  const isNumericalColumn = (columnName: string): boolean => {
    return (
      data.length > 0 &&
      typeof data[0][columnName] === "number" &&
      data.every((row) => typeof row[columnName] === "number" || row[columnName] === null)
    );
  };

  const handleHistogramClick = (columnName: string) => {
    setActiveHistogram(activeHistogram === columnName ? null : columnName);
  };

  // Add this memoized function to cache column statistics
  const columnStats = useMemo(() => {
    const stats: Record<string, { min: number; max: number; range: number }> = {};

    // Only process visible columns to save computation
    columns
      .filter((col) => !hiddenColumns.includes(col))
      .forEach((col) => {
        const values = data.map((row) => row[col]).filter((val) => typeof val === "number");

        if (values.length > 0) {
          const min = Math.min(...values);
          const max = Math.max(...values);
          stats[col] = {
            min,
            max,
            range: max - min,
          };
        }
      });

    return stats;
  }, [data, columns, hiddenColumns]);

  // Update the getCellStyle function to use the cached stats
  const getCellStyle = (value: number, columnId: string) => {
    if (viewMode !== "heatmap" || typeof value !== "number") return {};

    const stats = columnStats[columnId];
    if (!stats) return {};

    const normalizedValue = stats.range !== 0 ? (value - stats.min) / stats.range : 0.5;

    return {
      "--normalized-value": normalizedValue,
    } as React.CSSProperties;
  };

  // ranked Shapley values
  const rankedShapleyValues = useMemo(() => {
    if (!shapleyValues || shapleyValues.length === 0) return null;

    const sorted = [...shapleyValues].sort((a, b) => b["SHAP Value"] - a["SHAP Value"]);

    const maxValue = sorted[0]["SHAP Value"];

    // Add rank and normalized value
    return sorted.map((item, index) => ({
      ...item,
      rank: index + 1,
      normalizedValue: item["SHAP Value"] / maxValue,
    }));
  }, [shapleyValues]);

  const getFeatureImportance = (featureName: string) => {
    if (!rankedShapleyValues) return null;
    return rankedShapleyValues.find((item) => item.feature === featureName);
  };

  return (
    <div className="table-panel-content">
      {isExpanded ? (
        <div className="table-container">
          <table {...getTableProps()}>
            <thead>
              {headerGroups.map((headerGroup) => {
                const { key, ...headerGroupProps } = headerGroup.getHeaderGroupProps();
                return (
                  <tr key={key} {...headerGroupProps}>
                    {headerGroup.headers.map((column) => {
                      const { key: headerKey, ...headerProps } = column.getHeaderProps();
                      return (
                        <th
                          key={headerKey}
                          {...headerProps}
                          onClick={() => toggleColumnSelection(column.id)}
                          className={selectedColumns.includes(column.id) ? "selected" : ""}
                        >
                          {column.render("Header")}
                        </th>
                      );
                    })}
                  </tr>
                );
              })}
            </thead>
            <tbody {...getTableBodyProps()}>
              {rows.map((row, rowIndex) => {
                prepareRow(row);
                const { key, ...rowProps } = row.getRowProps();
                const isRowHovered = hoveredRowIndex === rowIndex;

                return (
                  <tr
                    key={key}
                    {...rowProps}
                    className={isRowHovered && viewMode === "heatmap" ? "hovered-row" : ""}
                    onMouseEnter={() => viewMode === "heatmap" && setHoveredRowIndex(rowIndex)}
                    onMouseLeave={() => viewMode === "heatmap" && setHoveredRowIndex(null)}
                  >
                    {row.cells.map((cell) => {
                      const { key: cellKey, ...cellProps } = cell.getCellProps();
                      return (
                        <td
                          key={cellKey}
                          {...cellProps}
                          className={`
                            ${selectedColumns.includes(cell.column.id) ? "selected" : ""}
                            ${viewMode === "heatmap" ? "heatmap-cell" : ""}
                            ${isRowHovered && viewMode === "heatmap" ? "hovered-cell" : ""}
                          `}
                          style={getCellStyle(cell.value, cell.column.id)}
                        >
                          {viewMode === "numerical" ? (
                            cell.render("Cell")
                          ) : (
                            <>
                              {isRowHovered && viewMode === "heatmap" ? (
                                <div className="hovered-cell-content">{cell.render("Cell")}</div>
                              ) : null}
                            </>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="compressed-view-container">
          <div className="table-container compressed">
            <table>
              <thead>
                <tr>
                  <th>Feature</th>
                  {shapleyValues && shapleyValues.length > 0 && <th>Importance</th>}
                  <th>Distribution</th>
                </tr>
              </thead>
              <tbody>
                {columns.map((col) => {
                  const importance = getFeatureImportance(col);

                  return (
                    <tr key={col}>
                      <td
                        className={`column-name ${selectedColumns.includes(col) ? "selected" : ""}`}
                        onClick={() => toggleColumnSelection(col)}
                      >
                        {col}
                        {hiddenColumns.includes(col) && (
                          <span className="hidden-indicator" title="Hidden in expanded view">
                            (hidden)
                          </span>
                        )}
                      </td>
                      {shapleyValues && shapleyValues.length > 0 && (
                        <td className="importance-cell">
                          {importance ? (
                            <div className="importance-container">
                              <div className="importance-rank">#{importance.rank}</div>
                              <div className="importance-bar-container">
                                <div
                                  className="importance-bar"
                                  style={{ width: `${importance.normalizedValue * 100}%` }}
                                  title={`SHAP Value: ${importance["SHAP Value"].toFixed(4)}`}
                                ></div>
                              </div>
                            </div>
                          ) : (
                            <span>—</span>
                          )}
                        </td>
                      )}
                      <td className="tiny-histogram-cell">
                        <button
                          className={`tiny-histogram-wrapper ${isNumericalColumn(col) ? "clickable" : ""}`}
                          onClick={() => isNumericalColumn(col) && handleHistogramClick(col)}
                          disabled={!isNumericalColumn(col)}
                          title={isNumericalColumn(col) ? "Click to view detailed histogram" : "Not a numerical column"}
                        >
                          {isNumericalColumn(col) ? (
                            <Histogram data={getColumnData(col)} variant="tiny" width={100} height={30} />
                          ) : (
                            <span className="non-numerical-indicator">—</span>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {activeHistogram && (
            <div className="histogram-container">
              <div className="histogram-header">
                <h3>{activeHistogram} Distribution</h3>
                <button className="close-button" onClick={() => setActiveHistogram(null)} aria-label="Close histogram">
                  ×
                </button>
              </div>
              <Histogram data={getColumnData(activeHistogram)} variant="big" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataTable;
