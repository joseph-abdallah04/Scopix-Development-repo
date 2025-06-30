import React from 'react'
import FileUploadCard from '../components/file_upload_card'

const VideoUpload = () => {
  return (
    <div className="upload-bg w-screen h-screen bg-black text-white flex flex-col items-center justify-center pt-24">
      <FileUploadCard
        accept=".mp4"
        buttonLabel="Analyse"
        fileLabel="Choose file"
        onAnalyse={(file) => {
          console.log("Analyzing CSV:", file)
        }}
        instructionList={[
          'Click the "Choose File" button"',
          'Select a MP4 file from your computer',
          'To perform calculations and receive results, click the "Analyse" button',
          'If you choose the wrong file, click the "Remove" button to choose another one'
        ]}
      />
    </div>
  )
}

export default VideoUpload

