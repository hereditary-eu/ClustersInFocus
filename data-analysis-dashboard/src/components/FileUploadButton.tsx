import React, { useRef, useState } from 'react';
import { FileService, DataRow } from '../services/FileService';

interface FileUploadButtonProps {
  onFileLoaded: (data: DataRow[], headers: string[]) => void;
}

export function FileUploadButton({ onFileLoaded }: FileUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setFileName(file.name);
        const { data, headers } = await FileService.parseCSVFile(file);
        onFileLoaded(data, headers);
      } catch (error) {
        console.error('Error parsing file:', error);
        setFileName(null);
      }
    }
  };

  return (
    <div className="file-upload-container">
      {fileName && <span className="file-name">{fileName}</span>}
      <input 
        ref={fileInputRef}
        type="file" 
        accept=".csv" 
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <button 
        className="file-upload-button"
        onClick={() => fileInputRef.current?.click()}
        aria-label="Upload file"
      />
    </div>
  );
} 