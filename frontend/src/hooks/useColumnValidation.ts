import { useMemo } from 'react';
import { DataRow } from '../types';
import { getNumericColumns, isNumericColumn, hasMinimumNumericColumns } from '../utils/validation';

/**
 * Custom hook for column validation with memoization
 */
export const useColumnValidation = (data: DataRow[]) => {
  const numericColumns = useMemo(() => getNumericColumns(data), [data]);
  
  const hasMinimumColumns = useMemo(
    () => hasMinimumNumericColumns(data, 2),
    [data]
  );
  
  const isColumnNumeric = useMemo(
    () => (columnName: string) => isNumericColumn(data, columnName),
    [data]
  );
  
  const validateColumnsForClustering = useMemo(
    () => (selectedColumns: string[]) => {
      if (selectedColumns.length !== 2) {
        return {
          isValid: false,
          message: 'Select exactly two columns for clustering'
        };
      }
      
      const nonNumericColumns = selectedColumns.filter(col => !isColumnNumeric(col));
      if (nonNumericColumns.length > 0) {
        return {
          isValid: false,
          message: `Non-numeric columns selected: ${nonNumericColumns.join(', ')}`
        };
      }
      
      return {
        isValid: true,
        message: ''
      };
    },
    [isColumnNumeric]
  );
  
  return {
    numericColumns,
    hasMinimumColumns,
    isColumnNumeric,
    validateColumnsForClustering,
  };
};