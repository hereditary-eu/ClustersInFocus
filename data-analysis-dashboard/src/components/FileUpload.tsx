import React, { useState, useRef } from 'react';
import Papa from 'papaparse';

interface FileUploadProps {
  onFileLoaded: (data: any[], columns: string[]) => void;
}

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

        const data = result.data as Record<string, any>[];
        const headers = Object.keys(data[0]);

        // Filter out any empty rows and ensure data consistency
        const cleanData = data.filter(row => 
          Object.values(row).some(value => value !== null && value !== '')
        );

        // Format data for the table
        const formattedData = cleanData.map(row => {
          const newRow: Record<string, any> = {};
          headers.forEach(header => {
            newRow[header] = row[header] || ''; // Replace null/undefined with empty string
          });
          return newRow;
        });

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
        style={{ display: 'none' }}  // Hide the default input
      />
      <button 
        className="file-upload-button"
        onClick={handleButtonClick}
        aria-label="Upload file"
      />
      {fileName && <p>Selected File: {fileName}</p>}
    </div>
  );
};

export default FileUpload;
