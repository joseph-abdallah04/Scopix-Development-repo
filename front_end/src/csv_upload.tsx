import React, { useState } from 'react';
import './upload_page.css';
import uploadIcon from './assets/uploadIcon.png';

interface CSVUploadProps {
  onAnalyse?: (file: File) => void;
}

function CSVUpload({ onAnalyse }: CSVUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const uploadedFile = event.target.files[0];
      const isCSV = uploadedFile.type === 'text/csv' || uploadedFile.name.endsWith('.csv');
      if (isCSV) {
        setFile(uploadedFile);
        setError(null);
      } else {
        setFile(null);
        setError('Please upload a valid CSV file.');
      }
    }
  };

  const handleAnalyse = async () => {
    if (!file || !onAnalyse) return;
    
    setIsAnalysing(true);
    
    // Simulate analysis processing
    setTimeout(() => {
      setIsAnalysing(false);
      onAnalyse(file);
    }, 500);
  };

  return (
    <div className="upload-bg">
      <div className="upload-center">
        <div className="upload-content">
          <div className="upload-box">
            <img src={uploadIcon} alt="Upload icon" className="upload-icon" />
            <h1>Upload .csv File</h1>
            <label className="file-upload-btn">
              Choose file
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>
            {file && <span className="file-name">{file.name}</span>}
            {error && <span style={{ color: 'red', marginTop: '1rem' }}>{error}</span>}
          </div>
          <div className="instructions-box">
            <h2>Instructions for CSV File Upload</h2>
            <p>Insert upload instructions here. Follow these instructions:</p>
            <ol>
              <li>Click the "Choose File" button</li>
              <li>Select a CSV file from your computer</li>
              <li>To perform calculations and receive results, <br />click the "Analyse" button</li>
              <li>If you choose the wrong file, click the <br /> "Remove" button to choose another one</li>
            </ol>
          </div>
        </div>
      </div>
      <div className="upload-actions">
        {file && (
          <button className="remove-btn" onClick={() => setFile(null)}>
            Remove File
          </button>
        )}
        <button
          className={`analyse-btn${!file || isAnalysing ? ' disabled' : ''}`}
          disabled={!file || isAnalysing}
          onClick={handleAnalyse}
        >
          {isAnalysing ? 'Analysing...' : 'Analyse'}
        </button>
      </div>
    </div>
  );
}

export default CSVUpload;
