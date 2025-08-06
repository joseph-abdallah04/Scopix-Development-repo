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
    clearResult()
    navigate("/csv-upload")
  }

  return (
    <div className={`w-screen h-screen flex flex-col pt-24 transition-colors duration-300 ${
      isDarkMode ? 'bg-black text-white' : 'bg-white text-gray-900'
    }`}>
      <div className="flex flex-col items-center justify-between px-8 py-8 max-w-3xl w-full mx-auto min-h-[calc(100vh-90px)]">
        <div className="flex flex-col w-full gap-8 flex-1">

          <div className="w-full">
            <h2 className="text-lg font-medium mb-4 pl-2">Results</h2>
            <div className={`rounded-xl h-[500px] p-0 flex items-center justify-center text-sm border ${
              isDarkMode 
                ? 'bg-transparent border-gray-600 text-white/70' 
                : 'bg-transparent border-gray-300 text-gray-600'
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

          <div
            ref={previewRef}
            className={`relative ${
              isFullscreen
                ? "fixed inset-0 z-30 bg-white dark:bg-gray-900 overflow-hidden"
                : "rounded-xl p-4"
            } text-sm border ${
              isDarkMode
                ? 'bg-gray-800 border-gray-600 text-white/80'
                : 'bg-white border-gray-300 text-gray-800'
            }`}
          >
            {/* Fullscreen content container */}
            <div className={`relative ${
              isFullscreen 
                ? "w-full h-full flex flex-col" 
                : "w-full max-w-5xl"
            }`}>
              <button
                onClick={toggleFullscreen}
                className={`absolute z-10 p-2 rounded-md transition-colors duration-300 ${
                  isFullscreen 
                    ? 'top-2 right-2' 
                    : 'top-1 right-1'
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


          <div className="w-full flex justify-between pt-8 pb-24 mt-auto">
            <button
              onClick={handleBack}
              className={`font-medium rounded-full px-16 py-3 text-base transition-all duration-300 flex items-center gap-2 ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
              }`}
            >
              <FiArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={handleExport}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full px-16 py-3 text-base transition-all duration-300 flex items-center gap-2"
            >
              <FiDownload className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CSVResultsPage

