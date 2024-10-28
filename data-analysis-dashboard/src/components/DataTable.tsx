import React, { useState, useMemo } from 'react';
import { useTable, Column } from 'react-table';

interface DataTableProps {
  data: any[];
  columns: string[];
  onColumnSelect: (selectedColumns: string[]) => void;
}

const DataTable: React.FC<DataTableProps> = ({ data, columns, onColumnSelect }) => {
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  // Format columns for react-table
  const tableColumns = useMemo<Column[]>(() => 
    columns.map((col) => ({
      Header: col,
      accessor: col, // This is the key that was missing
      id: col,
    })),
    [columns]
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({
    columns: tableColumns as readonly Column<any>[],
    data,
  });

  const toggleColumnSelection = (colId: string) => {
    setSelectedColumns(prevSelected =>
      prevSelected.includes(colId)
        ? prevSelected.filter(col => col !== colId) // Remove if already selected
        : [...prevSelected, colId] // Add if not selected
    );
  };

  // Notify parent component of selected columns
  React.useEffect(() => {
    onColumnSelect(selectedColumns);
  }, [selectedColumns, onColumnSelect]);

  return (
    <div className="table-container">
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => {
                const headerProps = column.getHeaderProps();
                return (
                  <th
                    {...headerProps}
                    onClick={() => toggleColumnSelection(column.id)}
                    className={selectedColumns.includes(column.id) ? 'selected' : ''}
                  >
                    {column.render('Header')}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row, i) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map((cell) => {
                  const cellProps = cell.getCellProps();
                  return (
                    <td
                      {...cellProps}
                      className={selectedColumns.includes(cell.column.id) ? 'selected' : ''}
                    >
                      {cell.render('Cell')}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
