import Papa from 'papaparse';

export interface DataRow {
  [key: string]: string | number;
}

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
    data: DataRow[],
    headers: string[]
  }> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          if (result.data.length === 0) {
            reject(new Error('No data found in file'));
            return;
          }

          const rawData = result.data as Record<string, any>[];
          const headers = Object.keys(rawData[0]);

          // Determine column types
          const columnTypes: Record<string, 'number' | 'string'> = {};
          headers.forEach(header => {
            const columnValues = rawData.map(row => row[header]);
            columnTypes[header] = this.inferColumnType(columnValues);
          });

          // Filter and format data
          const formattedData = rawData
            .filter(row => Object.values(row).some(value => value !== null && value !== ''))
            .map(row => {
              const newRow: Record<string, any> = {};
              headers.forEach(header => {
                const value = row[header];
                newRow[header] = columnTypes[header] === 'number' 
                  ? (value === '' ? null : Number(value))
                  : (value || '');
              });
              return newRow;
            });

          resolve({ data: formattedData, headers });
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }
} 