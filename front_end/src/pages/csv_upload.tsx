import FileUploadCard from '../components/file_upload_card'
import { useTheme } from '../contexts/theme-context'

const CSVUpload = () => {
  const { isDarkMode } = useTheme()
  
  return (
    <div className={`upload-bg w-screen h-screen flex flex-col items-center justify-center pt-24 transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-black text-white' 
        : 'bg-white text-gray-900'
    }`}>
      <FileUploadCard
        accept=".csv"
        buttonLabel="Analyse"
        fileLabel="Choose file"
        onAnalyse={(file) => {
          console.log("Analyzing CSV:", file)
        }}
        instructionList={[
          'Click the "Choose File" button',
          'Select a CSV file from your computer',
          'To perform calculations and receive results, click the "Analyse" button',
          'If you choose the wrong file, click the "Remove" button to choose another one'
        ]}
      />
    </div>
  )
}

export default CSVUpload

