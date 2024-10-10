import React, { useState } from 'react';
import { useTable } from 'react-table';

interface DataTableProps {
  data: any[];
  columns: any[];
  onColumnSelect: (selectedColumns: string[]) => void; // Prop to send selected columns back to parent
}

const DataTable: React.FC<DataTableProps> = ({ data, columns, onColumnSelect }) => {
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({
    columns,
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
  );
};

export default DataTable;
