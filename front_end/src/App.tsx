// src/App.tsx
import React from "react"
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom"

import NavBar from "./components/nav_bar"
import CsvResultsPage from "./pages/csv_results_page"
import SettingsPage from "./pages/settings-page"
import CsvUpload from "./pages/csv_upload"
import VideoUpload from "./pages/video_upload"
import VideoAnalysis from "./pages/video_analysis_page" 
import ManualMeasurement from "./pages/manual_measurement"

const AppContent: React.FC = () => {
  const location = useLocation()
  const hideNavBar = location.pathname === '/video-analysis' || location.pathname === '/manual-measurement'

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      {!hideNavBar && <NavBar />}
      <main>
        <Routes>
          <Route path="/" element={<CsvUpload />} />
          <Route path="/csv-upload" element={<CsvUpload />} />
          <Route path="/csv-results" element={<CsvResultsPage />} />
          <Route path="/video-upload" element={<VideoUpload />} />
          <Route path="/video-analysis" element={<VideoAnalysis />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/manual-measurement" element={<ManualMeasurement />} />
        </Routes>
      </main>
    </div>
  )
}

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App

