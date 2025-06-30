import React, { useState, useRef } from 'react'
import { FiUpload } from "react-icons/fi"
import { useNavigate } from 'react-router-dom'

interface FileUploadCardProps {
  accept: string
  onAnalyse: (file: File) => void
  buttonLabel?: string
  fileLabel?: string
  instructionList?: string[]
}

const FileUploadCard: React.FC<FileUploadCardProps> = ({
  accept,
  onAnalyse,
  buttonLabel = 'Analyse',
  fileLabel = 'Choose File',
  instructionList = [],
}) => {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isAnalysing, setIsAnalysing] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const navigate = useNavigate()



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

const handleAnalyse = () => {
  if (!file) return
  setIsAnalysing(true)

  setTimeout(() => {
    setIsAnalysing(false)
    onAnalyse(file)
    navigate('/csv-results')
  }, 1000)
}


  return (
    <div className="flex flex-col items-center justify-center w-full">

      <div className="flex flex-row gap-16 items-start justify-center w-full">

        <div className="flex flex-col items-center justify-center gap-6">
          <div className="w-[450px] h-[500px] border-2 border-dashed border-gray-500 rounded-2xl bg-[#181c23] text-white p-6 flex flex-col items-center justify-center gap-4">
            <label className="cursor-pointer flex flex-col items-center justify-center px-6 py-8 rounded-2xl hover:bg-blue-700 transition-colors active:scale-85 transition-transform">
              <FiUpload className="w-20 h-20 transition-colors" />
              <span className="mt-2 text-xl text-gray-400">{fileLabel}</span>
              <input
                ref={inputRef}
                type="file"
                accept={accept}
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>
            {file && <span className="text-green-400 text-sm">{file.name}</span>}
            {error && <span className="text-red-400 mt-4 text-sm">{error}</span>}
          </div>
        </div>


        {instructionList.length > 0 && (
          <div className="max-w-md text-left mt-4">
            <h2 className="text-[42px] font-bold mb-2">Instructions</h2>
            <ol className="list-decimal list-inside space-y-1 text-lg">
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
        >
          {isAnalysing ? `Analysing...` : buttonLabel}
        </button>
      </div>
    </div>
  )
}

export default FileUploadCard

