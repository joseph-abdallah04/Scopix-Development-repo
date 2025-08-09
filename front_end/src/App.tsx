import React, { useEffect, useState } from "react"
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom"

import NavBar from "./components/nav_bar"
import BackendStatusAlert from "./components/BackendStatusAlert"
import CsvResultsPage from "./pages/csv_results_page"
import SettingsPage from "./pages/settings-page"
import CsvUpload from "./pages/csv_upload"
import VideoUpload from "./pages/video_upload"
import VideoAnalysis from "./pages/video_analysis_page" 
import { ThemeProvider, useTheme } from "./contexts/theme-context"
import { BackendStatusProvider, useBackendStatus } from "./contexts/backend-status-context"
import ManualMeasurement from "./pages/manual_measurement"

const AppContent: React.FC = () => {
  const location = useLocation()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayLocation, setDisplayLocation] = useState(location)
  const hideNavBar = ['/video-analysis', '/manual-measurement'].includes(location.pathname)
  const { isDarkMode } = useTheme()
  const { isBackendAvailable, isLoading } = useBackendStatus()

  // Handle page transition animation
  useEffect(() => {
    if (location !== displayLocation) {
      setIsTransitioning(true)
      const timer = setTimeout(() => {
        setDisplayLocation(location)
        setIsTransitioning(false)
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [location, displayLocation])

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-black text-white' 
        : 'bg-white text-gray-900'
    }`}>
      {!hideNavBar && <NavBar />}
      {!isLoading && !isBackendAvailable && <BackendStatusAlert isVisible={true} />}
      <main className={`transition-all duration-300 ease-in-out ${
        isTransitioning 
          ? 'opacity-0 transform translate-x-2 scale-98' 
          : 'opacity-100 transform translate-x-0 scale-100'
      }`}>
        <Routes location={displayLocation}>
          <Route path="/" element={<Navigate to="/csv-upload" replace />} />
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
      <ThemeProvider>
        <BackendStatusProvider>
          <AppContent />
        </BackendStatusProvider>
      </ThemeProvider>
    </Router>
  )
}

export default App

