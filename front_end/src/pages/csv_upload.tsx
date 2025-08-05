// src/pages/CSVUpload.tsx
import { useEffect } from 'react'
import FileUploadCard from '../components/file_upload_card'
import { useTheme } from '../contexts/theme-context'
import { useNavigate } from 'react-router-dom'
import { useCSVResultStore } from '../stores/csvResultStore'

const CSVUpload = () => {
  const { isDarkMode } = useTheme()
  const navigate = useNavigate()

  const setResult = useCSVResultStore((state) => state.setResult)
  const setSegmentData = useCSVResultStore((state) => state.setSegmentData)
  const clearResult = useCSVResultStore((state) => state.clearResult)

  // Clear any existing results when entering the upload page
  useEffect(() => {
    clearResult()
  }, [clearResult])

  const handleAnalyse = async (file: File) => {
    try {
      const formData1 = new FormData()
      formData1.append('file', file)

      const formData2 = new FormData()
      formData2.append('file', file)

      const [segmentResp, chartData] = await Promise.all([
        fetch('http://localhost:8000/upload-download/', {
          method: 'POST',
          body: formData1
        }).then((res) => res.json()),

        fetch('http://localhost:8000/plot-csv/', {
          method: 'POST',
          body: formData2
        }).then((res) => res.json()) 
      ])


      if (!Array.isArray(segmentResp.items) || segmentResp.items.length === 0) {
        throw new Error("The backend did not return valid segmentData")
      }

      setResult(chartData)
      setSegmentData(segmentResp.items)
      navigate('/csv-results')

    } catch (err) {
      console.error('Error uploading file:', err)
      alert('Upload failed, please check the CSV file format.')
    }
  }

  return (
    <div className={`upload-bg w-screen h-screen flex flex-col items-center justify-center pt-24 transition-colors duration-300 ${
      isDarkMode ? 'bg-black text-white' : 'bg-white text-gray-900'
    }`}>
      <FileUploadCard
        accept=".csv, .xlsx"
        buttonLabel="Analyse"
        fileLabel="Choose file"
        onAnalyse={handleAnalyse}
        instructionList={[
          'Click the "Choose File" button',
          'Select a CSV file from your computer',
          'Click the "Analyse" button to upload and analyse the file',
          'If you chose the wrong file, click "Remove" to choose another one'
        ]}
      />
    </div>
  )
}

export default CSVUpload

