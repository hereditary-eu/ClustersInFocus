import React, { useState } from 'react';
import Papa from 'papaparse';

interface FileUploadProps {
  onFileLoaded: (data: any) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileLoaded }) => {
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      parseFile(file);
    }
  };

  const parseFile = (file: File) => {
    Papa.parse(file, {
      complete: (result) => {
        console.log('Parsed Data:', result.data);
        onFileLoaded(result.data); // Pass parsed data to parent component
      },
      header: true, // true if CSV has headers TODO: make this configurable
      skipEmptyLines: true,
    });
  };

  return (
    <div>
      <input 
        type="file" 
        accept=".csv" 
        onChange={handleFileChange} 
      />
      {fileName && <p>File Selected: {fileName}</p>}
    </div>
  );
};

export default FileUpload;
