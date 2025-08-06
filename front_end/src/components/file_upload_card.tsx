import React, { useState, useRef, useEffect } from 'react'
import { FiUpload } from "react-icons/fi"
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/theme-context'
import { useBackendStatus } from '../contexts/backend-status-context'

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
  const [, setProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const navigate = useNavigate()
  const { isDarkMode } = useTheme()
  const { isBackendAvailable } = useBackendStatus()

  // Reset component state when component mounts
  useEffect(() => {
    setFile(null)
    setError(null)
    setIsAnalysing(false)
    setProgress(0)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }, [])

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
    
    // Check backend availability before proceeding
    if (!isBackendAvailable) {
      return
    }
    
    setIsAnalysing(true)
    setProgress(0)

    // Start progress simulation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev
        return prev + Math.random() * 15
      })
    }, 300)

    try {
      // Call the provided onAnalyse function (could be async)
      await onAnalyse(file)
      
      // Set progress to 100% when complete
      setProgress(100)
      
      // Clear the interval
      clearInterval(progressInterval)
      
      // Only navigate if onAnalyse doesn't handle navigation itself
      // For CSV uploads, this will still work as before
      if (navigateTo === '/csv-results') {
        navigate(navigateTo)
      }
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setIsAnalysing(false)
      setProgress(0)
      clearInterval(progressInterval)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-row gap-16 items-start justify-center w-full">
        <div className="flex flex-col items-center justify-center gap-6 animate-fade-in-left">
          <div className={`w-[450px] h-[500px] border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-4 transition-colors duration-300 ${
            isDarkMode 
              ? 'border-gray-500 bg-[#181c23] text-white' 
              : 'border-gray-400 bg-gray-50 text-gray-900'
          }`}>
            <label className={`cursor-pointer flex flex-col items-center justify-center px-6 py-8 rounded-2xl transition-colors group ${
              isDarkMode 
                ? 'hover:bg-blue-700' 
                : 'hover:bg-blue-600'
            } ${!isBackendAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <div className="flex flex-col items-center justify-center active:scale-85 transition-transform">
                <FiUpload className={`w-20 h-20 transition-colors ${
                  isDarkMode 
                    ? 'text-white' 
                    : 'text-gray-600 group-hover:text-white'
                }`} />
                <span className={`mt-2 text-xl transition-colors ${
                  isDarkMode 
                    ? 'text-gray-400' 
                    : 'text-gray-500 group-hover:text-white'
                }`}>{fileLabel}</span>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept={accept}
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                disabled={!isBackendAvailable}
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
          <div className="max-w-md text-left mt-4 animate-fade-in-right-sync">
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

      <div className="flex gap-40 justify-center mt-20 w-full animate-fade-in-up-sync">
        {file && (
          <button
            className={`font-medium rounded-full px-24 py-3 text-base transition-all duration-300 flex items-center gap-2 w-32 justify-center ${
              isDarkMode 
                ? 'bg-gray-700 hover:bg-red-600 text-white' 
                : 'bg-gray-200 hover:bg-red-500 text-gray-900'
            }`}
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
          className={`font-medium rounded-full px-24 py-3 text-base transition-all duration-300 flex items-center gap-2 w-32 justify-center relative overflow-hidden ${
            !file || isAnalysing || !isBackendAvailable 
              ? 'opacity-50 cursor-not-allowed bg-gray-400 text-gray-600' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
          onClick={handleAnalyse}
          disabled={!file || isAnalysing || !isBackendAvailable}
        >
          {isAnalysing && (
            <div className="absolute inset-0 bg-blue-500">
              <div 
                className="h-full bg-blue-400 animate-pulse"
                style={{ 
                  background: `linear-gradient(90deg, 
                    rgba(59, 130, 246, 0.8) 0%, 
                    rgba(96, 165, 250, 1) 50%, 
                    rgba(59, 130, 246, 0.8) 100%)`,
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s ease-in-out infinite'
                }}
              ></div>
            </div>
          )}
          <span className="relative z-10">
            {isAnalysing ? `Analysing...` : buttonLabel}
          </span>
        </button>
      </div>
    </div>
  )
}

export default FileUploadCard

