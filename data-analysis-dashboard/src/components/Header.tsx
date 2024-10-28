// should contain the title of the app and the load button
import React from 'react';
import FileUpload from './FileUpload';

interface HeaderProps {
  onFileUpload: (data: any[], headers: string[]) => void;
}

const Header: React.FC<HeaderProps> = ({ onFileUpload }) => {
  const handleFileLoaded = (data: any[], headers: string[]) => {
    // Pass the data up to the parent component
    onFileUpload(data, headers);
  };

  return (
    <header>
      <div className="header-title">Data Analysis Dashboard</div>
      <FileUpload onFileLoaded={handleFileLoaded} />
    </header>
  );
};

export default Header;
