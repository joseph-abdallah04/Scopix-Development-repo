import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import CSVUpload from './csv_upload.tsx'
import VideoUpload from './video_upload.tsx';
import SettingsPage from './settings-page.tsx';
import CSVResultsPage from './csv_results_page.tsx';
import NavBar from './components/nav_bar.tsx';
import VideoAnalysis from './video_analysis_page.tsx';

function App() {
  const [activeTab, setActiveTab] = useState('csv');
  const [csvFile, setCSVFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const rendercontent = () => {
    switch (activeTab) {
      case 'csv': return <CSVUpload onAnalyse={(file) => { setCSVFile(file); setActiveTab('csv-results'); }} />;
      case 'video': return <VideoUpload onAnalyse={(file) => {setVideoFile(file); setActiveTab('video-analysis')}} />;
      case 'settings': return <SettingsPage />;
      case 'csv-results': return <CSVResultsPage file={csvFile} onBack={() => setActiveTab('csv')} />;
      case 'video-analysis': return <VideoAnalysis file={videoFile} onBack={() => setActiveTab('video')} />;

      default: return <CSVUpload onAnalyse={(file) => { setCSVFile(file); setActiveTab('csv-results'); }} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh' }} >
      <div style={{ position: 'sticky', zIndex: 1000, padding: '1rem' }}>
        <NavBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      
      {rendercontent()}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)