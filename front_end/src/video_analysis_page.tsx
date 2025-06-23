import './video_analysis_page.css'

interface VideoAnalysisPageProps {
  file: File | null;
  onBack?: () => void;
}

function VideoAnalysis({ file, onBack }: VideoAnalysisPageProps) {
  const handleExport = () => {
    // Export functionality will be implemented here
    console.log('Exporting results...');
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  return (
    <div>COming SOON</div>
  );
}

export default VideoAnalysis;