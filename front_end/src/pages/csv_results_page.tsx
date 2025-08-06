import { useNavigate } from 'react-router-dom'
import InterGraph from '../components/inter_graph'
import { useTheme } from '../contexts/theme-context'
import { useFullscreen } from '../contexts/fullscreen'
import { FiMaximize, FiMinimize, FiArrowLeft, FiDownload } from "react-icons/fi"
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

const handleExport = async () => {
  try {
    const response = await fetch("http://localhost:8000/export-zip/", {
      method: "GET",
    })

    if (!response.ok) {
      throw new Error("Export failed.")
    }

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = "report.zip"
    a.click()
    URL.revokeObjectURL(url)
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

              <h2 className={`text-lg font-semibold mb-4 ${
                isChartFullscreen ? 'pt-16 px-4' : ''
              }`}>Results</h2>
              
              <div className={`${
                isChartFullscreen ? 'flex-1 overflow-hidden' : 'rounded-xl h-[600px] flex items-center justify-center'
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
    </div>
  )
}

export default CSVResultsPage

