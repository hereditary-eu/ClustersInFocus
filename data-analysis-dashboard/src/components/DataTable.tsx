import React, { useState, useMemo } from 'react';
import { useTable, Column } from 'react-table';
import Histogram from './Histogram';
import ColumnMenu from './DataTableColumnHoverMenu';

interface DataTableProps {
  data: any[];
  columns: string[];
  hiddenColumns: string[];
  onColumnHide: (column: string) => void;
  onColumnRestore: (column: string) => void;
  onColumnSelect: (selectedColumns: string[]) => void;
  isExpanded: boolean;
  viewMode: 'numerical' | 'heatmap';
}

// Add type definition for column types
type ColumnType = 'number' | 'string' | 'mixed';

const DataTable: React.FC<DataTableProps> = ({ 
  data, 
  columns,
  hiddenColumns,
  onColumnHide,
  onColumnSelect,
  isExpanded,
  viewMode
}) => {
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [activeHistogram, setActiveHistogram] = useState<string | null>(null);
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ id: string; desc: boolean } | null>(null);

  const handleSort = (columnId: string) => {
    setSortConfig(prev => ({
      id: columnId,
      desc: prev?.id === columnId ? !prev.desc : false
    }));
  };

  const handleHideColumn = (columnId: string) => {
    onColumnHide(columnId);
  };

  // Determine column type based on data
  const getColumnType = (columnId: string): ColumnType => {
    const values = data.map(row => row[columnId]);
    const hasNumbers = values.some(val => typeof val === 'number');
    const hasStrings = values.some(val => typeof val === 'string');
    
    if (hasNumbers && !hasStrings) return 'number';
    if (hasStrings && !hasNumbers) return 'string';
    return 'mixed';
  };

  // Custom sort function
  const sortData = (a: any, b: any, columnId: string): number => {
    const columnType = getColumnType(columnId);
    const aValue = a[columnId];
    const bValue = b[columnId];

    // Handle null/undefined values
    if (aValue == null) return 1;
    if (bValue == null) return -1;
    if (aValue == null && bValue == null) return 0;

    switch (columnType) {
      case 'number':
        return Number(aValue) - Number(bValue);
      case 'string':
        return String(aValue).localeCompare(String(bValue));
      case 'mixed':
        // For mixed types, try to convert to numbers if possible
        const aNum = Number(aValue);
        const bNum = Number(bValue);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        return String(aValue).localeCompare(String(bValue));
      default:
        return 0;
    }
  };

  // Sort the data based on current sort config
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const sortOrder = sortConfig.desc ? -1 : 1;
      return sortData(a, b, sortConfig.id) * sortOrder;
    });
  }, [data, sortConfig]);

  // Format columns for react-table
  const expandedTableColumns = useMemo<Column[]>(() => 
    columns
      .filter(col => !hiddenColumns.includes(col))
      .map((col) => ({
        Header: () => (
          <div
            className={`column-header ${
              sortConfig?.id === col 
                ? sortConfig.desc 
                  ? 'sorted-desc' 
                  : 'sorted-asc'
                : ''
            }`}
            onMouseEnter={() => setHoveredColumn(col)}
            onMouseLeave={() => setHoveredColumn(null)}
          >
            <span>{col}</span>
            {hoveredColumn === col && (
              <ColumnMenu
                column={col}
                onSort={handleSort}
                onHide={handleHideColumn}
                sortConfig={sortConfig}
              />
            )}
          </div>
        ),
        accessor: col,
        id: col,
        sortType: (rowA: any, rowB: any) => sortData(rowA, rowB, col),
      })),
    [columns, hiddenColumns, hoveredColumn, sortConfig]
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({
    columns: expandedTableColumns as readonly Column<any>[],
    data: sortedData
  });

  const toggleColumnSelection = (colId: string) => {
    setSelectedColumns(prevSelected => {
      let newSelected;
      // If column is already selected, remove it
      if (prevSelected.includes(colId)) {
        newSelected = prevSelected.filter(col => col !== colId);
      } else {
        // If trying to add a new column
        if (prevSelected.length >= 2) {
          // If already at max selection, remove the first selected column
          newSelected = [...prevSelected.slice(1), colId];
        } else {
          // Otherwise, add the new column
          newSelected = [...prevSelected, colId];
        }
      }
      
      // Update parent component directly here
      onColumnSelect(newSelected);
      return newSelected;
    });
  };

  const getColumnData = (columnName: string): number[] => {
    return data.map(row => row[columnName]).filter(value => !isNaN(value));
  };

  // Helper function to check if a column is numerical
  const isNumericalColumn = (columnName: string): boolean => {
    return data.length > 0 && typeof data[0][columnName] === 'number' &&
      data.every(row => typeof row[columnName] === 'number' || row[columnName] === null);
  };

  const handleHistogramClick = (columnName: string) => {
    setActiveHistogram(activeHistogram === columnName ? null : columnName);
  };

  // Add helper function to calculate cell background color
  const getCellStyle = (value: number, columnId: string) => {
    if (viewMode !== 'heatmap' || typeof value !== 'number') return {};
    
    const columnValues = data
      .map(row => row[columnId])
      .filter(val => typeof val === 'number');
    
    const min = Math.min(...columnValues);
    const max = Math.max(...columnValues);
    const range = max - min;
    const normalizedValue = range !== 0 ? (value - min) / range : 0.5;
    
    return {
      background: `hsl(200, 70%, ${100 - normalizedValue * 50}%)`,
      height: '2px',
      padding: '0px 2px',
      textAlign: 'center' as const,
      fontSize: viewMode === 'heatmap' ? '0px' : 'inherit'
    };
  };

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
                        className={`
                          ${selectedColumns.includes(cell.column.id) ? 'selected' : ''}
                          ${viewMode === 'heatmap' ? 'heatmap-cell' : ''}
                        `}
                        style={getCellStyle(cell.value, cell.column.id)}
                      >
                        {viewMode === 'numerical' ? cell.render('Cell') : ''}
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
                  <th>Distribution</th>
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
                      {hiddenColumns.includes(col) && (
                        <span className="hidden-indicator" title="Hidden in expanded view">
                          (hidden)
                        </span>
                      )}
                    </td>
                    <td className="tiny-histogram-cell">
                      <button 
                        className={`tiny-histogram-wrapper ${isNumericalColumn(col) ? 'clickable' : ''}`}
                        onClick={() => isNumericalColumn(col) && handleHistogramClick(col)}
                        disabled={!isNumericalColumn(col)}
                        title={isNumericalColumn(col) ? "Click to view detailed histogram" : "Not a numerical column"}
                      >
                        {isNumericalColumn(col) ? (
                          <Histogram 
                            data={getColumnData(col)}
                            variant="tiny"
                            width={100}
                            height={30}
                          />
                        ) : (
                          <span className="non-numerical-indicator">—</span>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {activeHistogram && (
            <div className="histogram-container">
              <h3>{activeHistogram} Distribution</h3>
              <Histogram 
                data={getColumnData(activeHistogram)}
                variant="big"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataTable;
