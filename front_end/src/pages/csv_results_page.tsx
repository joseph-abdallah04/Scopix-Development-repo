import { useNavigate } from 'react-router-dom'
import InterGraph from '../components/inter_graph'
import { useTheme } from '../contexts/theme-context'
import { useFullscreen } from '../contexts/fullscreen'
import { FiMaximize, FiMinimize, FiArrowLeft, FiDownload, FiChevronUp, FiChevronDown } from "react-icons/fi"
import { useEffect, useState } from 'react'
import { useCSVResultStore } from '../stores/csvResultStore'
import PreviewTable from "../components/previewtable"

function CSVResultsPage() {
  const navigate = useNavigate()
  const { isDarkMode } = useTheme()
  const chartData = useCSVResultStore((state) => state.result)
  const clearResult = useCSVResultStore((state) => state.clearResult)
  const segmentData = useCSVResultStore((state) => state.segmentData)

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [currentSection, setCurrentSection] = useState(0)

  const {
    ref: previewRef,
    isFullscreen,
    toggleFullscreen
  } = useFullscreen<HTMLDivElement>()

  const {
    ref: chartRef,
    isFullscreen: isChartFullscreen,
    toggleFullscreen: toggleChartFullscreen
  } = useFullscreen<HTMLDivElement>()

  useEffect(() => {
    setLoading(true)

    if (!chartData || !segmentData || segmentData.length === 0) {
      setError("Data not found, please upload again.")
    } else {
      setError(null)
    }

    setLoading(false)
  }, [chartData, segmentData])

  // Scroll tracking useEffect
  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = document.querySelector('.scroll-container')
      if (scrollContainer) {
        const scrollTop = scrollContainer.scrollTop
        const scrollHeight = scrollContainer.scrollHeight - scrollContainer.clientHeight
        const progress = (scrollTop / scrollHeight) * 100
        setScrollProgress(Math.min(progress, 100))

        // Determine current section based on scroll position
        if (progress < 50) {
          setCurrentSection(0) // Chart section
        } else {
          setCurrentSection(1) // Table section
        }
      }
    }

    const scrollContainer = document.querySelector('.scroll-container')
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll)
      return () => scrollContainer.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const scrollToSection = (sectionIndex: number) => {
    const scrollContainer = document.querySelector('.scroll-container')
    if (scrollContainer) {
      const targetPosition = sectionIndex * window.innerHeight
      scrollContainer.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      })
    }
  }

const handleExport = async () => {
  try {
    const response = await fetch("http://localhost:8000/export-zip/", {
      method: "GET",
    })

    if (!response.ok) {
      throw new Error("Export failed.")
    }

    const blob = await response.blob()
    
    // Check if we're in Electron environment
    const isElectron = (window as any).electronAPI?.isElectron || 
                      window.navigator.userAgent.toLowerCase().includes('electron');
    
    if (isElectron && (window as any).electronAPI?.downloadFile) {
      // Use Electron's download API
      const url = URL.createObjectURL(blob)
      try {
        await (window as any).electronAPI.downloadFile(url, "report.zip");
      } finally {
        URL.revokeObjectURL(url)
      }
    } else {
      // For web browsers or fallback, use the standard approach
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "report.zip"
      a.style.display = 'none'
      
      // Append to body, click, and remove
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      // Cleanup URL after a delay to ensure download starts
      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 1000)
    }
  } catch (err) {
    console.error(err)
    alert("Failed to export report.")
  }
}

  const handleBack = () => {
    // Navigate immediately
    navigate("/csv-upload")
    // Clear result after navigation completes
    setTimeout(() => {
      clearResult()
    }, 500)
  }

  return (
    <div className={`w-screen scroll-container transition-colors duration-300 ${
      isDarkMode ? 'bg-black text-white' : 'bg-white text-gray-900'
    }`}>
      {/* Chart Section - Full Page */}
      <section className="parallax-section w-screen h-screen flex items-center justify-center relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5 pointer-events-none"></div>
        <div className="w-full max-w-6xl px-4 parallax-element ">

          <div
            ref={chartRef}
            className={`relative ${
              isChartFullscreen
                ? "fixed inset-0 z-30 overflow-hidden"
                : "rounded-xl p-4 shadow-lg"
            } text-sm border ${
              isChartFullscreen
                ? isDarkMode 
                  ? 'bg-gray-900 border-gray-700 text-white'
                  : 'bg-white border-gray-200 text-gray-900'
                : isDarkMode
                  ? 'bg-gray-800 border-gray-600 text-white/80 shadow-gray-900/50'
                  : 'bg-white border-gray-300 text-gray-800 shadow-gray-400/30'
            }`}
          >
            {/* Fullscreen content container */}
            <div className={`relative ${
              isChartFullscreen 
                ? "w-full h-full flex flex-col" 
                : "w-full max-w-7xl mx-auto"
            }`}>
              <button
                onClick={toggleChartFullscreen}
                className={`absolute z-10 p-2 rounded-md transition-colors duration-300 ${
                  isChartFullscreen 
                    ? 'top-2 right-2' 
                    : 'top-0 right-0'
                } ${
                  isDarkMode 
                    ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                    : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                }`}
                title={isChartFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                aria-label={isChartFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isChartFullscreen ? <FiMinimize size={18} /> : <FiMaximize size={18} />}
              </button>

              <h2 className={`text-lg font-semibold ${
                isChartFullscreen ? 'pt-12 px-4 mb-2' : 'mb-4'
              }`}>Results</h2>
              
              <div className={`${
                isChartFullscreen ? 'flex-1 overflow-hidden min-h-0' : 'rounded-xl h-[600px] flex items-center justify-center'
              } ${
                isDarkMode 
                  ? 'bg-transparent text-white/70' 
                  : 'bg-transparent text-gray-600'
              }`}>
                {loading ? (
                  <p>Loading chart...</p>
                ) : error ? (
                  <p className="text-red-500">{error}</p>
                ) : (
                  chartData && <InterGraph data={chartData} />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Table Section - Full Page */}
      <section className="parallax-section w-screen h-screen flex items-center justify-center relative">
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-black/5 pointer-events-none"></div>
        <div className="w-full max-w-6xl px-4 parallax-element ">
          <div
            ref={previewRef}
            className={`relative ${
              isFullscreen
                ? "fixed inset-0 z-30 overflow-hidden"
                : "rounded-xl p-4 shadow-lg"
            } text-sm border ${
              isFullscreen
                ? isDarkMode 
                  ? 'bg-gray-900 border-gray-700 text-white'
                  : 'bg-white border-gray-200 text-gray-900'
                : isDarkMode
                  ? 'bg-gray-800 border-gray-600 text-white/80 shadow-gray-900/50'
                  : 'bg-white border-gray-300 text-gray-800 shadow-gray-400/30'
            }`}
          >
            {/* Fullscreen content container */}
            <div className={`relative ${
              isFullscreen 
                ? "w-full h-full flex flex-col" 
                : "w-full max-w-7xl mx-auto"
            }`}>
              <button
                onClick={toggleFullscreen}
                className={`absolute z-10 p-2 rounded-md transition-colors duration-300 ${
                  isFullscreen 
                    ? 'top-2 right-2' 
                    : 'top-0 right-0'
                } ${
                  isDarkMode 
                    ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                    : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                }`}
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? <FiMinimize size={18} /> : <FiMaximize size={18} />}
              </button>

              <h2 className={`text-lg font-semibold mb-4 ${
                isFullscreen ? 'pt-16 px-4' : ''
              }`}>Data Preview</h2>
              
              <div className={`${
                isFullscreen ? 'flex-1 overflow-hidden' : ''
              }`}>
                <PreviewTable data={segmentData ?? []} isFullscreen={isFullscreen} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Action Buttons Section - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-20 p-6 animate-fade-in-up">
        <div className="w-full max-w-6xl mx-auto flex justify-between">
          <button
            onClick={handleBack}
            className={`font-medium rounded-full px-16 py-3 text-base transition-all duration-300 flex items-center gap-2 backdrop-blur-md transform hover:scale-105 hover:-translate-y-1 active:scale-95 shadow-lg hover:shadow-xl ${
              isDarkMode 
                ? 'bg-gray-700/80 hover:bg-gray-600/80 text-white border border-gray-600' 
                : 'bg-white/80 hover:bg-gray-100/80 text-gray-900 border border-gray-300'
            }`}
          >
            <FiArrowLeft className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={handleExport}
            className="bg-blue-600/80 hover:bg-blue-700/80 text-white font-medium rounded-full px-16 py-3 text-base transition-all duration-300 flex items-center gap-2 backdrop-blur-md border border-blue-500 transform hover:scale-105 hover:-translate-y-1 active:scale-95 shadow-lg hover:shadow-xl"
          >
            <FiDownload className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Scroll Indicator - Fixed in lower right corner */}
      <div className="fixed bottom-24 right-6 z-30 flex flex-col items-center gap-2 animate-fade-in-right">
        {/* Progress Circle */}
        <div className={`relative w-12 h-12 rounded-full border-2 ${
          isDarkMode 
            ? 'border-gray-600 bg-gray-800/80' 
            : 'border-gray-300 bg-white/80'
        } backdrop-blur-md shadow-lg transition-all duration-300`}>
          {/* Progress Ring */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke={isDarkMode ? '#374151' : '#e5e7eb'}
              strokeWidth="2"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeDasharray={`${scrollProgress}, 100`}
              className="transition-all duration-300"
            />
          </svg>
          
          {/* Section Indicator */}
          <div className={`absolute inset-0 flex items-center justify-center text-xs font-semibold ${
            isDarkMode ? 'text-white' : 'text-gray-700'
          }`}>
            {currentSection + 1}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col gap-1">
          <button
            onClick={() => scrollToSection(0)}
            className={`p-2 rounded-full transition-all duration-300 backdrop-blur-md ${
              currentSection === 0
                ? isDarkMode 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-blue-600 text-white shadow-lg'
                : isDarkMode
                  ? 'bg-gray-700/80 text-gray-300 hover:bg-gray-600/80 hover:text-white'
                  : 'bg-white/80 text-gray-600 hover:bg-gray-100/80 hover:text-gray-800'
            } shadow-md hover:shadow-lg transform hover:scale-110`}
            title="Go to Chart Section"
          >
            <FiChevronUp size={16} />
          </button>
          
          <button
            onClick={() => scrollToSection(1)}
            className={`p-2 rounded-full transition-all duration-300 backdrop-blur-md ${
              currentSection === 1
                ? isDarkMode 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-blue-600 text-white shadow-lg'
                : isDarkMode
                  ? 'bg-gray-700/80 text-gray-300 hover:bg-gray-600/80 hover:text-white'
                  : 'bg-white/80 text-gray-600 hover:bg-gray-100/80 hover:text-gray-800'
            } shadow-md hover:shadow-lg transform hover:scale-110`}
            title="Go to Table Section"
          >
            <FiChevronDown size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default CSVResultsPage

