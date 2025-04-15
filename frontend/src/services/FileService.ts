import Papa from 'papaparse';
import { ApiClient } from './ApiClient';
import { API_ROUTES } from './ApiRoutes';
import { DataRow } from '../types';

export class FileService {
  private static inferColumnType(values: any[]): 'number' | 'string' {
    const nonEmptyValues = values.filter(v => v !== null && v !== '');
    
    const isNumeric = nonEmptyValues.every(value => {
      const num = Number(value);
      return !isNaN(num) && typeof num === 'number';
    });

    return isNumeric ? 'number' : 'string';
  }

  static async parseCSVFile(file: File): Promise<{
    fileName: string,
    data: DataRow[],
    headers: string[],
    fileId?: string
  }> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (result) => {
          if (result.data.length === 0) {
            reject(new Error('No data found in file'));
            return;
          }

          try {
            console.log('CSV parse result:', result);
            
            const rawData = result.data as Record<string, any>[];
            const headers = Object.keys(rawData[0]);

            if (headers.length === 0) {
              reject(new Error('No valid headers found in the file'));
              return;
            }

            console.log(`Found headers: ${headers.join(', ')}`);

            // Determine column types
            const columnTypes: Record<string, 'number' | 'string'> = {};
            headers.forEach(header => {
              const columnValues = rawData.map(row => row[header]);
              columnTypes[header] = this.inferColumnType(columnValues);
              console.log(`Column "${header}" inferred as type: ${columnTypes[header]}`);
            });

            // Filter and format data
            const formattedData = rawData
              .filter(row => {
                // Skip rows with all empty values
                const hasValues = Object.values(row).some(value => 
                  value !== null && value !== '' && value !== undefined
                );
                return hasValues;
              })
              .map((row, index) => {
                const newRow: Record<string, any> = {};
                
                headers.forEach(header => {
                  let value = row[header];
                  
                  // Explicitly handle null and undefined values
                  if (value === null || value === undefined || value === '') {
                    newRow[header] = null; // Keep all nulls as null
                    return;
                  }
                  
                  // Convert to appropriate type
                  if (columnTypes[header] === 'number') {
                    // Handle numeric values
                    const numValue = Number(value);
                    if (isNaN(numValue)) {
                      console.warn(`Row ${index}, Column "${header}": Non-numeric value "${value}" in numeric column, setting to null`);
                      newRow[header] = null;
                    } else {
                      newRow[header] = numValue;
                    }
                  } else {
                    // Handle string values - ensure it's a string
                    const strValue = String(value).trim();
                    newRow[header] = strValue === '' ? null : strValue;
                  }
                });
                
                return newRow;
              });

            if (formattedData.length === 0) {
              reject(new Error('No valid data rows found after processing'));
              return;
            }

            console.log(`Processed ${formattedData.length} rows of data`);
            
            // Check one row as sample for logging
            if (formattedData.length > 0) {
              console.log('Sample row:', formattedData[0]);
            }

            try {
              // Send data to backend
              const { file_id } = await this.uploadData(formattedData, file.name);
              
              resolve({ 
                fileName: file.name, 
                data: formattedData, 
                headers,
                fileId: file_id
              });
            } catch (error) {
              console.error('Error uploading data to server:', error);
              reject(error);
            }
          } catch (error) {
            console.error('Error processing CSV data:', error);
            reject(new Error(`Failed to process CSV data: ${error instanceof Error ? error.message : 'Unknown error'}`));
          }
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          reject(error);
        }
      });
    });
  }

  static async uploadData(data: DataRow[], filename: string): Promise<{ file_id: string }> {
    try {
      // Sanitize data to ensure compatibility with backend validation
      const sanitizedData = data.map(row => {
        const sanitizedRow: Record<string, any> = {};
        
        // Process each field to ensure valid types
        Object.entries(row).forEach(([key, value]) => {
          // Handle null values - keep them as null to match our updated backend
          if (value === null || value === undefined) {
            sanitizedRow[key] = null;
            return;
          }
          
          // Ensure numbers are actually numbers and not strings that look like numbers
          if (typeof value === 'number') {
            // If it's NaN or Infinity, replace with null
            sanitizedRow[key] = isNaN(value) || !isFinite(value) ? null : value;
          } else if (typeof value === 'string') {
            // Trim strings and handle empty strings
            const trimmed = value.trim();
            sanitizedRow[key] = trimmed === '' ? null : trimmed;
          } else {
            // Convert any other types to string
            sanitizedRow[key] = String(value);
          }
        });
        
        return sanitizedRow;
      });
      
      console.log('Sending sanitized data to server:', {
        rowCount: sanitizedData.length,
        sampleRow: sanitizedData.length > 0 ? sanitizedData[0] : 'No data'
      });
      
      const response = await ApiClient.post<{ message: string, dataset_id: string }>(
        API_ROUTES.dataset.upload,
        {
          data: sanitizedData,
          filename: filename
        }
      );
      return { file_id: response.dataset_id };
    } catch (error) {
      console.error('Error uploading data:', error);
      throw error;
    }
  }

  static async getDatasetById(fileId: string): Promise<{
    data: DataRow[],
    headers: string[]
  }> {
    try {
      const response = await ApiClient.get<{
        data: DataRow[],
        headers: string[]
      }>(API_ROUTES.dataset.getById(fileId));
      
      return response;
    } catch (error) {
      console.error('Error retrieving dataset:', error);
      throw error;
    }
  }
  
  static async deleteDataset(fileId: string): Promise<{ success: boolean, message: string }> {
    try {
      const response = await ApiClient.delete<{ message: string }>(
        API_ROUTES.dataset.deleteById(fileId)
      );
      
      return { 
        success: true, 
        message: response.message || 'Dataset deleted successfully' 
      };
    } catch (error) {
      console.error('Error deleting dataset:', error);
      
      // Return structured error
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error deleting dataset'
      };
    }
  }

  static async getAllDatasets(): Promise<{ id: string, filename: string }[]> {
    try {
      const response = await ApiClient.get<{ datasets: { id: string, filename: string }[] }>(
        API_ROUTES.dataset.getAll
      );
      
      return response.datasets;
    } catch (error) {
      console.error('Error retrieving all datasets:', error);
      return [];
    }
  }
}