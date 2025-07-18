import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FileUploadCard from '../components/file_upload_card'
import { useTheme } from '../contexts/theme-context'

const VideoUpload = () => {
  const navigate = useNavigate()
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { isDarkMode } = useTheme()

  const handleAnalyse = async (file: File) => {
    setIsUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      // Use the Docker host IP instead of localhost
      const response = await fetch('http://localhost:8000/upload-video/', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.message || 'Upload failed')
        setIsUploading(false)
        return
      }

      console.log('Video uploaded successfully:', result)
      
      navigate('/video-analysis', { 
        state: { 
          file,
          metadata: result.metadata,
          sessionInfo: {
            filename: result.filename,
            validation: result.validation
          }
        } 
      })
    } catch (err) {
      console.error('Network error:', err)
      setError('Network error occurred - make sure the backend server is running')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className={`upload-bg w-screen h-screen flex flex-col items-center justify-center pt-24 transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-black text-white' 
        : 'bg-white text-gray-900'
    }`}>
      {error && (
        <div className={`mb-4 p-4 rounded-lg max-w-md transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-red-600 text-white' 
            : 'bg-red-100 text-red-800 border border-red-300'
        }`}>
          {error}
        </div>
      )}
      
      <FileUploadCard
        accept=".mp4"
        buttonLabel={isUploading ? "Uploading..." : "Analyse"}
        fileLabel="Choose file"
        navigateTo="/video-analysis"
        onAnalyse={handleAnalyse}
        instructionList={[
          'Click the "Choose File" button',
          'Select an MP4 file from your computer',
          'To perform calculations and receive results, click the "Analyse" button',
          'If you choose the wrong file, click the "Remove" button to choose another one'
        ]}
      />
    </div>
  )
}

export default VideoUpload

