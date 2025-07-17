import { useNavigate } from 'react-router-dom'
import InterGraph from '../components/inter_graph'
import chartDataRaw from '../../test/output.json'
import { useTheme } from '../contexts/theme-context'

// Type the imported JSON data properly
const chartData = chartDataRaw as Array<{
  id: string;
  data: Array<{ x: number; y: number }>;
}>;


function CSVResultsPage() {
  const navigate = useNavigate()
  const { isDarkMode } = useTheme()
  
  const handleExport = () => {
    console.log("Exporting results…")
  }


  const handleBack = () => {
    navigate("/csv-upload")
  }

  return (
    <div className={`w-screen h-screen min-h-screen flex flex-col pt-24 box-border overflow-y-auto transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-black text-white' 
        : 'bg-white text-gray-900'
    }`}>
      <div className="flex flex-col items-center justify-between px-8 py-8 max-w-3xl w-full mx-auto min-h-[calc(100vh-90px)]">
        <div className="flex flex-col w-full gap-8 flex-1">
          <div className="w-full">
            <h2 className={`text-lg font-medium mb-4 pl-2 transition-colors duration-300 ${
              isDarkMode 
                ? 'text-white' 
                : 'text-gray-900'
            }`}>Results</h2>
            <div className={`rounded-xl min-h-[200px] p-6 flex items-center justify-center text-sm border transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-600 text-white/70' 
                : 'bg-gray-50 border-gray-300 text-gray-600'
            }`}>
              <InterGraph data={chartData} />
            </div>
          </div>

          <div className="w-full">
            <h2 className={`text-lg font-medium mb-4 pl-2 transition-colors duration-300 ${
              isDarkMode 
                ? 'text-white' 
                : 'text-gray-900'
            }`}>Breath 1</h2>
            <div className={`rounded-xl min-h-[200px] p-6 flex items-center justify-center text-sm border transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-600 text-white/70' 
                : 'bg-gray-50 border-gray-300 text-gray-600'
            }`}>
              <p>Breath analysis results will appear here</p>
            </div>
          </div>
        </div>

        <div className="w-full flex justify-center pt-8 mt-auto gap-4 flex-wrap">
          <button
            onClick={handleBack}
            className={`font-medium rounded-full px-6 py-3 text-base transition-all duration-300 ${
              isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
            }`}
          >
            Back
          </button>
          <button
            onClick={handleExport}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full px-12 py-3 text-base transition-all duration-300"
          >
            Export
          </button>
        </div>
      </div>
    </div>
  )
}

export default CSVResultsPage

