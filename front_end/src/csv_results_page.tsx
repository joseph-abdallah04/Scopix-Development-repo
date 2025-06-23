import React from 'react';
import './csv_results_page.css';

interface CSVResultsPageProps {
  file: File | null;
  onBack?: () => void;
}

function CSVResultsPage({ file, onBack }: CSVResultsPageProps) {
  const handleExport = () => {
    // Export functionality will be implemented here
    console.log('Exporting results...');
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  return (
    <div className="results-bg">
      <div className="results-container">
        <div className="results-content">
          <div className="results-section">
            <h2 className="section-title">Results</h2>
            <div className="results-box">
              {file ? (
                <div>
                  <p>Analysis complete for: {file.name}</p>
                  <p>File size: {(file.size / 1024).toFixed(2)} KB</p>
                  {/* Results content will be populated here */}
                </div>
              ) : (
                <p>No file data available</p>
              )}
            </div>
          </div>

          <div className="results-section">
            <h2 className="section-title">Breath 1</h2>
            <div className="results-box">
              {/* Breath 1 content will be populated here */}
              <p>Breath analysis results will appear here</p>
            </div>
          </div>
        </div>

        <div className="results-actions">
          <button className="export-btn" onClick={handleBack} style={{ marginRight: '1rem', background: '#4a5568' }}>
            Back to Upload
          </button>
          <button className="export-btn" onClick={handleExport}>
            Export
          </button>
        </div>
      </div>
    </div>
  );
}

export default CSVResultsPage;