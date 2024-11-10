import React, { useState, useRef } from 'react';
import Papa from 'papaparse';

interface FileUploadProps {
  onFileLoaded: (data: any[], columns: string[]) => void;
}

// Helper function to determine column type
const inferColumnType = (values: any[]): 'number' | 'string' => {
  // Filter out empty values
  const nonEmptyValues = values.filter(v => v !== null && v !== '');
  
  // If all values can be converted to numbers, it's a number column
  const isNumeric = nonEmptyValues.every(value => {
    const num = Number(value);
    return !isNaN(num) && typeof num === 'number';
  });

  return isNumeric ? 'number' : 'string';
};

const FileUpload: React.FC<FileUploadProps> = ({ onFileLoaded }) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      parseFile(file);
    }
  };

  const parseFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.data.length === 0) {
          console.error('No data found in file');
          return;
        }

        const rawData = result.data as Record<string, any>[];
        const headers = Object.keys(rawData[0]);

        // Determine column types
        const columnTypes: Record<string, 'number' | 'string'> = {};
        headers.forEach(header => {
          const columnValues = rawData.map(row => row[header]);
          columnTypes[header] = inferColumnType(columnValues);
        });

        // Filter and format data
        const formattedData = rawData
          .filter(row => Object.values(row).some(value => value !== null && value !== ''))
          .map(row => {
            const newRow: Record<string, any> = {};
            headers.forEach(header => {
              const value = row[header];
              if (columnTypes[header] === 'number') {
                // Convert to number if it's a numeric column
                newRow[header] = value === '' ? null : Number(value);
              } else {
                // Keep as string for string columns
                newRow[header] = value || '';
              }
            });
            return newRow;
          });

        console.log('Column types:', columnTypes); // Debug log
        onFileLoaded(formattedData, headers);
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
      }
    });
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="file-upload-content">
      <input 
        ref={fileInputRef}
        type="file" 
        accept=".csv" 
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      {fileName && <p>Selected File: {fileName}</p> }
      <button 
        className="file-upload-button"
        onClick={handleButtonClick}
        aria-label="Upload file"
      />
    </div>
  );
};

export default FileUpload;
