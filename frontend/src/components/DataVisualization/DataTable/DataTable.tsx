import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useTable, Column } from "react-table";
import Histogram from "../Histogram";
import ColumnMenu from "./DataTableColumnHoverMenu";
import { ShapleyValueItem, DataRow } from "../../../types";
import styles from "./DataTable.module.css";

interface DataTableProps {
  data: DataRow[];
  columns: string[];
  hiddenColumns: string[];
  onColumnHide: (column: string) => void;
  onColumnSelect: (selectedColumns: string[]) => void;
  isExpanded: boolean;
  viewMode: "numerical" | "heatmap";
  menuOptions?: {
    canSort?: boolean;
    canHide?: boolean;
  };
  shapleyValues?: ShapleyValueItem[] | null;
}

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
  const visibleColumns = useMemo(() => columns.filter((col) => !hiddenColumns.includes(col)), [columns, hiddenColumns]);

  useEffect(() => {
    setActiveHistogram(null);
  }, [data]);

  const handleSort = (columnId: string) => {
    setSortConfig((prev) => ({
      id: columnId,
      desc: prev?.id === columnId ? !prev.desc : false,
    }));
  };

  const handleHideColumn = useCallback((columnId: string) => {
    onColumnHide(columnId);
  }, [onColumnHide]);

  const columnMetadata = useMemo(() => {
    const metadata: Record<
      string,
      {
        type: ColumnType;
        numericValues: number[];
        isStrictNumeric: boolean;
      }
    > = {};

    columns.forEach((columnId) => {
      let hasNumbers = false;
      let hasStrings = false;
      const numericValues: number[] = [];

      for (const row of data) {
        const value = row[columnId];

        if (typeof value === "number") {
          hasNumbers = true;
          if (!Number.isNaN(value)) {
            numericValues.push(value);
          }
        } else if (typeof value === "string") {
          hasStrings = true;
        }
      }

      const firstValue = data[0]?.[columnId];
      const isStrictNumeric =
        typeof firstValue === "number" &&
        data.every((row) => typeof row[columnId] === "number" || row[columnId] === null);

      metadata[columnId] = {
        type: hasNumbers && !hasStrings ? "number" : hasStrings && !hasNumbers ? "string" : "mixed",
        numericValues,
        isStrictNumeric,
      };
    });

    return metadata;
  }, [columns, data]);

  const sortData = useCallback((a: DataRow, b: DataRow, columnId: string): number => {
    const columnType = columnMetadata[columnId]?.type ?? "mixed";
    const aValue = a[columnId];
    const bValue = b[columnId];

    if (aValue == null) return 1;
    if (bValue == null) return -1;
    if (aValue == null && bValue == null) return 0;

    switch (columnType) {
      case "number":
        return Number(aValue) - Number(bValue);
      case "string":
        return String(aValue).localeCompare(String(bValue));
      case "mixed": {
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
  }, [columnMetadata]);

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const sortOrder = sortConfig.desc ? -1 : 1;
      return sortData(a, b, sortConfig.id) * sortOrder;
    });
  }, [data, sortConfig, sortData]);

  const expandedTableColumns = useMemo<Column[]>(
    () =>
      visibleColumns
        .map((col) => ({
          Header: () => (
            <div
              className={`${styles.columnHeader} ${
                sortConfig?.id === col ? (sortConfig.desc ? styles.sortedDesc : styles.sortedAsc) : ""
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
        })),
    [visibleColumns, hoveredColumn, sortConfig, menuOptions, handleHideColumn],
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
    onColumnSelect(newSelected);
  };

  const handleHistogramClick = (columnName: string) => {
    setActiveHistogram(activeHistogram === columnName ? null : columnName);
  };

  const columnStats = useMemo(() => {
    const stats: Record<string, { min: number; max: number; range: number }> = {};

    visibleColumns.forEach((col) => {
      const values = columnMetadata[col]?.numericValues ?? [];

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
  }, [columnMetadata, visibleColumns]);

  const getCellStyle = (value: number, columnId: string) => {
    if (viewMode !== "heatmap" || typeof value !== "number") return {};

    const stats = columnStats[columnId];
    if (!stats) return {};

    const normalizedValue = stats.range !== 0 ? (value - stats.min) / stats.range : 0.5;

    return {
      "--normalized-value": normalizedValue,
    } as React.CSSProperties;
  };

  const featureImportanceMap = useMemo(() => {
    if (!shapleyValues || shapleyValues.length === 0) return null;

    const sorted = [...shapleyValues].sort((a, b) => b["SHAP Value"] - a["SHAP Value"]);
    const maxValue = sorted[0]["SHAP Value"];

    return new Map(
      sorted.map((item, index) => [
        item.feature,
        {
          ...item,
          rank: index + 1,
          normalizedValue: maxValue === 0 ? 0 : item["SHAP Value"] / maxValue,
        },
      ]),
    );
  }, [shapleyValues]);

  const getFeatureImportance = (featureName: string) => {
    return featureImportanceMap?.get(featureName) ?? null;
  };

  return (
    <div className={styles.tablePanelContent}>
      {isExpanded ? (
        <div className={styles.tableContainer}>
          <table {...getTableProps()} className={styles.table}>
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
                          className={`${styles.headerCell} ${selectedColumns.includes(column.id) ? styles.headerCellSelected : ""}`}
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
                const rowParityClass = rowIndex % 2 === 0 ? styles.bodyRowOdd : styles.bodyRowEven;

                return (
                  <tr
                    key={key}
                    {...rowProps}
                    className={`${rowParityClass} ${isRowHovered && viewMode === "heatmap" ? styles.hoveredRow : ""}`}
                    onMouseEnter={() => viewMode === "heatmap" && setHoveredRowIndex(rowIndex)}
                    onMouseLeave={() => viewMode === "heatmap" && setHoveredRowIndex(null)}
                  >
                    {row.cells.map((cell) => {
                      const { key: cellKey, ...cellProps } = cell.getCellProps();
                      return (
                        <td
                          key={cellKey}
                          {...cellProps}
                          className={`${styles.dataCell} ${selectedColumns.includes(cell.column.id) ? styles.selectedCell : ""} ${
                            viewMode === "heatmap" ? styles.heatmapCell : ""
                          } ${isRowHovered && viewMode === "heatmap" ? styles.hoveredCell : ""}`}
                          style={getCellStyle(cell.value, cell.column.id)}
                        >
                          {viewMode === "numerical" ? (
                            cell.render("Cell")
                          ) : (
                            <>
                              {isRowHovered && viewMode === "heatmap" ? (
                                <div className={styles.hoveredCellContent}>{cell.render("Cell")}</div>
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
        <div className={styles.compressedViewContainer}>
          <div className={styles.compressedTableContainer}>
            <table className={styles.compressedTable}>
              <thead>
                <tr>
                  <th>Feature</th>
                  {shapleyValues && shapleyValues.length > 0 && <th>Importance</th>}
                  <th>Distribution</th>
                </tr>
              </thead>
              <tbody>
                {columns.map((col, index) => {
                  const importance = getFeatureImportance(col);
                  const rowParityClass = index % 2 === 0 ? styles.bodyRowOdd : styles.bodyRowEven;

                  return (
                    <tr key={col} className={rowParityClass}>
                      <td
                        className={`${styles.columnName} ${selectedColumns.includes(col) ? styles.selectedCompressedColumn : ""}`}
                        onClick={() => toggleColumnSelection(col)}
                      >
                        {col}
                        {hiddenColumns.includes(col) && (
                          <span title="Hidden in expanded view">
                            (hidden)
                          </span>
                        )}
                      </td>
                      {shapleyValues && shapleyValues.length > 0 && (
                        <td className={styles.importanceCell}>
                          {importance ? (
                            <div className={styles.importanceContainer}>
                              <div className={styles.importanceRank}>#{importance.rank}</div>
                              <div className={styles.importanceBarContainer}>
                                <div
                                  className={styles.importanceBar}
                                  style={{ width: `${importance.normalizedValue * 100}%` }}
                                  title={`SHAP Value: ${importance["SHAP Value"].toFixed(4)}`}
                                ></div>
                              </div>
                            </div>
                          ) : (
                            <span>{"\u2014"}</span>
                          )}
                        </td>
                      )}
                      <td className={styles.tinyHistogramCell}>
                        <button
                          className={`${styles.tinyHistogramButton} ${columnMetadata[col]?.isStrictNumeric ? styles.tinyHistogramClickable : ""}`}
                          onClick={() => columnMetadata[col]?.isStrictNumeric && handleHistogramClick(col)}
                          disabled={!columnMetadata[col]?.isStrictNumeric}
                          title={columnMetadata[col]?.isStrictNumeric ? "Click to view detailed histogram" : "Not a numerical column"}
                        >
                          {columnMetadata[col]?.isStrictNumeric ? (
                            <Histogram data={columnMetadata[col].numericValues} variant="tiny" width={100} height={30} />
                          ) : (
                            <span className={styles.nonNumericalIndicator}>{"\u2014"}</span>
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
            <div className={styles.histogramContainer}>
              <div className={styles.histogramHeader}>
                <h3>{activeHistogram} Distribution</h3>
                <button className={styles.closeButton} onClick={() => setActiveHistogram(null)} aria-label="Close histogram">
                  {"\u00D7"}
                </button>
              </div>
              <Histogram data={columnMetadata[activeHistogram]?.numericValues ?? []} variant="big" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataTable;
