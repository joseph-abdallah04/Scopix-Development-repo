import React, { useState, useRef } from 'react'
import { FiUpload } from "react-icons/fi"
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/theme-context'

interface FileUploadCardProps {
  accept: string
  onAnalyse: (file: File) => void | Promise<void>  // Support async
  buttonLabel?: string
  fileLabel?: string
  instructionList?: string[]
  navigateTo?: string
}

const FileUploadCard: React.FC<FileUploadCardProps> = ({
  accept,
  onAnalyse,
  buttonLabel = 'Analyse',
  fileLabel = 'Choose File',
  instructionList = [],
  navigateTo = '/csv-results'
}) => {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isAnalysing, setIsAnalysing] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const navigate = useNavigate()
  const { isDarkMode } = useTheme()

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = event.target.files?.[0]
    if (!uploaded) return

    const isValid = accept
      .split(',')
      .some((type) => uploaded.name.toLowerCase().endsWith(type.trim()))

    if (isValid) {
      setFile(uploaded)
      setError(null)
    } else {
      setFile(null)
      setError(`Please upload a valid ${accept} file.`)
    }
  }

  const handleAnalyse = async () => {
    if (!file) return
    setIsAnalysing(true)

    try {
      // Call the provided onAnalyse function (could be async)
      await onAnalyse(file)
      
      // Only navigate if onAnalyse doesn't handle navigation itself
      // For CSV uploads, this will still work as before
      if (navigateTo === '/csv-results') {
        navigate(navigateTo)
      }
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setIsAnalysing(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-row gap-16 items-start justify-center w-full">
        <div className="flex flex-col items-center justify-center gap-6">
          <div className={`w-[450px] h-[500px] border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-4 transition-colors duration-300 ${
            isDarkMode 
              ? 'border-gray-500 bg-[#181c23] text-white' 
              : 'border-gray-400 bg-gray-50 text-gray-900'
          }`}>
            <label className={`cursor-pointer flex flex-col items-center justify-center px-6 py-8 rounded-2xl transition-colors active:scale-85 transition-transform ${
              isDarkMode 
                ? 'hover:bg-blue-700' 
                : 'hover:bg-blue-600'
            }`}>
              <FiUpload className={`w-20 h-20 transition-colors ${
                isDarkMode 
                  ? 'text-white' 
                  : 'text-gray-600'
              }`} />
              <span className={`mt-2 text-xl transition-colors ${
                isDarkMode 
                  ? 'text-gray-400' 
                  : 'text-gray-500'
              }`}>{fileLabel}</span>
              <input
                ref={inputRef}
                type="file"
                accept={accept}
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>
            {file && <span className="text-green-400 text-sm">{file.name}</span>}
            {error && <span className={`mt-4 text-sm ${
              isDarkMode 
                ? 'text-red-400' 
                : 'text-red-600'
            }`}>{error}</span>}
          </div>
        </div>

        {instructionList.length > 0 && (
          <div className="max-w-md text-left mt-4">
            <h2 className={`text-[42px] font-bold mb-2 transition-colors duration-300 ${
              isDarkMode 
                ? 'text-white' 
                : 'text-gray-900'
            }`}>Instructions</h2>
            <ol className={`list-decimal list-inside space-y-1 text-lg transition-colors duration-300 ${
              isDarkMode 
                ? 'text-white' 
                : 'text-gray-700'
            }`}>
              {instructionList.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ol>
          </div>
        )}
      </div>

      <div className="flex gap-16 justify-center mt-10 w-full">
        {file && (
          <button
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-2 rounded-full"
            disabled={!file || isAnalysing}
            onClick={() => {
              setFile(null)
              setError(null)
              if (inputRef.current) {
                inputRef.current.value = ''
              }
            }}
          >
            Remove
          </button>
        )}
        <button
          className={`px-8 py-2 rounded-full text-white bg-blue-600 hover:bg-blue-700${
            !file || isAnalysing ? ' opacity-50 cursor-not-allowed' : ''
          }`}
          onClick={handleAnalyse}
          disabled={!file || isAnalysing}
        >
          {isAnalysing ? `Analysing...` : buttonLabel}
        </button>
      </div>
    </div>
  )
}

export default FileUploadCard

