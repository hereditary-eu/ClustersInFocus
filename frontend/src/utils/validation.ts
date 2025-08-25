import { DataRow } from '../types';

/**
 * Utility functions for data validation and type checking
 */

/**
 * Checks if a value is numeric (number or string that can be converted to number)
 */
export const isNumericValue = (value: unknown): value is number | string => {
  if (value === null || value === undefined || value === '') {
    return false;
  }
  
  if (typeof value === 'number') {
    return !isNaN(value) && isFinite(value);
  }
  
  if (typeof value === 'string') {
    const num = Number(value);
    return !isNaN(num) && isFinite(num);
  }
  
  return false;
};

/**
 * Checks if a column in the dataset contains only numeric values
 */
export const isNumericColumn = (data: DataRow[], columnName: string): boolean => {
  if (!data.length || !columnName) return false;
  
  // Check if all non-null values in the column are numeric
  return data.every(row => {
    const value = row[columnName];
    return value === null || isNumericValue(value);
  });
};

/**
 * Checks if multiple columns contain only numeric values
 */
export const areColumnsNumeric = (data: DataRow[], columnNames: string[]): boolean => {
  return columnNames.every(columnName => isNumericColumn(data, columnName));
};

/**
 * Validates if data contains non-numeric values for specified columns
 */
export const hasNonNumericValues = (data: DataRow[], columnNames: string[]): boolean => {
  if (!data.length || !columnNames.length) return false;
  
  return data.some(row => 
    columnNames.some(columnName => {
      const value = row[columnName];
      return value !== null && !isNumericValue(value);
    })
  );
};

/**
 * Gets all numeric columns from a dataset
 */
export const getNumericColumns = (data: DataRow[]): string[] => {
  if (!data.length) return [];
  
  const columns = Object.keys(data[0]);
  return columns.filter(column => isNumericColumn(data, column));
};

/**
 * Validates if a dataset has enough numeric columns for analysis
 */
export const hasMinimumNumericColumns = (data: DataRow[], minimumCount: number = 2): boolean => {
  const numericColumns = getNumericColumns(data);
  return numericColumns.length >= minimumCount;
};

/**
 * Type guard for numeric data points (used in scatter plots)
 */
export const isNumericDataPoint = (point: unknown[]): point is [number, number, ...unknown[]] => {
  return point.length >= 2 && 
         isNumericValue(point[0]) && 
         isNumericValue(point[1]);
};