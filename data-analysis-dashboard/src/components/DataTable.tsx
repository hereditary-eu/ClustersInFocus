import React, { useState, useMemo } from 'react';
import { useTable, Column } from 'react-table';
import HistogramRecharts from './HistogramRecharts';

interface DataTableProps {
  data: any[];
  columns: string[];
  onColumnSelect: (selectedColumns: string[]) => void;
  isExpanded: boolean;
}

const DataTable: React.FC<DataTableProps> = ({ 
  data, 
  columns, 
  onColumnSelect,
  isExpanded 
}) => {
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [activeHistogram, setActiveHistogram] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(columns);

  // Add toggle all columns function
  const toggleAllColumns = () => {
    if (visibleColumns.length === columns.length) {
      setVisibleColumns([]); // Hide all
    } else {
      setVisibleColumns([...columns]); // Show all
    }
  };

  // Get numerical data for histogram
  const getColumnData = (colName: string): number[] => {
    return data.map(row => row[colName]).filter(val => val !== null);
  };

  // Format columns for react-table, filtering by displayedColumns
  const expandedTableColumns = useMemo<Column[]>(() => 
    columns
      .filter(col => visibleColumns.includes(col))
      .map((col) => ({
        Header: col,
        accessor: col,
        id: col,
      })),
    [columns, visibleColumns]
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({
    columns: expandedTableColumns as readonly Column<any>[],
    data,
  });

  const toggleColumnSelection = (colId: string) => {
    setSelectedColumns(prevSelected =>
      prevSelected.includes(colId)
        ? prevSelected.filter(col => col !== colId)
        : [...prevSelected, colId]
    );
  };

  const toggleColumnVisibility = (colId: string) => {
    setVisibleColumns(prevVisible =>
      prevVisible.includes(colId)
        ? prevVisible.filter(col => col !== colId)
        : [...prevVisible, colId]
    );
  };

  // Notify parent component of selected columns
  React.useEffect(() => {
    onColumnSelect(selectedColumns);
  }, [selectedColumns, onColumnSelect]);

  return (
    <div className="table-panel-content">
      {isExpanded ? (
        <div className="table-container">
          <table {...getTableProps()}>
            <thead>
              {headerGroups.map((headerGroup) => (
                <tr {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map((column) => (
                    <th
                      {...column.getHeaderProps()}
                      onClick={() => toggleColumnSelection(column.id)}
                      className={selectedColumns.includes(column.id) ? 'selected' : ''}
                    >
                      {column.render('Header')}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody {...getTableBodyProps()}>
              {rows.map((row) => {
                prepareRow(row);
                return (
                  <tr {...row.getRowProps()}>
                    {row.cells.map((cell) => (
                      <td
                        {...cell.getCellProps()}
                        className={selectedColumns.includes(cell.column.id) ? 'selected' : ''}
                      >
                        {cell.render('Cell')}
                      </td>
                    ))}
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
                  <th>
                    <div className="show-header">
                      Show
                      <input
                        type="checkbox"
                        checked={visibleColumns.length === columns.length}
                        onChange={toggleAllColumns}
                        className="show-column-checkbox"
                        aria-label="Toggle all columns"
                      />
                    </div>
                  </th>
                  <th>Histogram</th>
                </tr>
              </thead>
              <tbody>
                {columns.map((col) => (
                  <tr key={col}>
                    <td
                      className={`column-name ${selectedColumns.includes(col) ? 'selected' : ''}`}
                      onClick={() => toggleColumnSelection(col)}
                    >
                      {col}
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={visibleColumns.includes(col)}
                        onChange={() => toggleColumnVisibility(col)}
                        className="show-column-checkbox"
                        aria-label={`Show ${col} column`}
                      />
                    </td>
                    <td>
                      {typeof data[0]?.[col] === 'number' && (
                        <button
                          className="histogram-button"
                          onClick={() => setActiveHistogram(activeHistogram === col ? null : col)}
                          aria-label={`Show histogram for ${col}`}
                        >
                          {activeHistogram === col ? 'Hide' : 'Show'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {activeHistogram && (
            <div className="histogram-container">
              <h3>{activeHistogram} Distribution</h3>
              <HistogramRecharts data={getColumnData(activeHistogram)} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataTable;
