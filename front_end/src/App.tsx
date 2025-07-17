// src/App.tsx
import React from "react"
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom"

import NavBar from "./components/nav_bar"
import CsvResultsPage from "./pages/csv_results_page"
import SettingsPage from "./pages/settings-page"
import CsvUpload from "./pages/csv_upload"
import VideoUpload from "./pages/video_upload"
import VideoAnalysis from "./pages/video_analysis_page" 
import { ThemeProvider, useTheme } from "./contexts/theme-context"

const AppContent: React.FC = () => {
  const location = useLocation()
  const hideNavBar = location.pathname === '/video-analysis'
  const { isDarkMode } = useTheme()

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-black text-white' 
        : 'bg-white text-gray-900'
    }`}>
      {!hideNavBar && <NavBar />}
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/csv-upload" replace />} />
          <Route path="/csv-upload" element={<CsvUpload />} />
          <Route path="/csv-results" element={<CsvResultsPage />} />
          <Route path="/video-upload" element={<VideoUpload />} />
          <Route path="/video-analysis" element={<VideoAnalysis />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  )
}

const App: React.FC = () => {
  return (
    <Router>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </Router>
  )
}

export default App

