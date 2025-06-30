import React from "react"
import { useNavigate } from 'react-router-dom'
import InterGraph from '../components/inter_graph'
import chartData from '../../test/output.json'


interface CSVResultsPageProps {
  file: File | null
  onBack?: () => void
}

function CSVResultsPage({ file, onBack }: CSVResultsPageProps) {
  const navigate = useNavigate()
  
  const handleExport = () => {
    console.log("Exporting results…")
  }


  const handleBack = () => {
    navigate("/csv-upload")
  }

  return (
    <div className="w-screen h-screen min-h-screen bg-black text-white flex flex-col pt-24 box-border overflow-y-auto">
      <div className="flex flex-col items-center justify-between px-8 py-8 max-w-3xl w-full mx-auto min-h-[calc(100vh-90px)]">
        <div className="flex flex-col w-full gap-8 flex-1">
          <div className="w-full">
            <h2 className="text-white text-lg font-medium mb-4 pl-2">Results</h2>
            <div className="bg-gray-800 border border-gray-600 rounded-xl min-h-[200px] p-6 flex items-center justify-center text-white/70 text-sm">
              <InterGraph data={chartData} />
            </div>
          </div>

          <div className="w-full">
            <h2 className="text-white text-lg font-medium mb-4 pl-2">Breath 1</h2>
            <div className="bg-gray-800 border border-gray-600 rounded-xl min-h-[200px] p-6 flex items-center justify-center text-white/70 text-sm">
              <p>Breath analysis results will appear here</p>
            </div>
          </div>
        </div>

        <div className="w-full flex justify-center pt-8 mt-auto gap-4 flex-wrap">
          <button
            onClick={handleBack}
            className="bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-full px-6 py-3 text-base transition-all"
          >
            Back
          </button>
          <button
            onClick={handleExport}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full px-12 py-3 text-base transition-all"
          >
            Export
          </button>
        </div>
      </div>
    </div>
  )
}

export default CSVResultsPage

