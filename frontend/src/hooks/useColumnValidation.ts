import { useMemo } from 'react';
import { DataRow } from '../types';
import { getNumericColumns } from '../utils/validation';

/**
 * Custom hook for column validation with memoization
 */
export const useColumnValidation = (data: DataRow[]) => {
  const numericColumns = useMemo(() => getNumericColumns(data), [data]);

  const numericColumnSet = useMemo(() => new Set(numericColumns), [numericColumns]);
  const hasMinimumColumns = numericColumns.length >= 2;

  const isColumnNumeric = useMemo(
    () => (columnName: string) => numericColumnSet.has(columnName),
    [numericColumnSet]
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
