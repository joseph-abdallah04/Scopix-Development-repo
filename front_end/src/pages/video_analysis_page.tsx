import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiPlay, FiPause } from 'react-icons/fi';
import './video_analysis_page.css';
import { useTheme } from '../contexts/theme-context';

interface VideoAnalysisPageProps {
  file?: File | null;
  onBack?: () => void;
}

interface SavedFrame {
  id: string;
  name: string;
  timestamp: number;
  frameIdx?: number;
  thumbnailUrl?: string;
  isBaseline: boolean;
  measurements: Array<{
    id: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  }>;
}

function VideoAnalysis({ file: propFile, onBack }: VideoAnalysisPageProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  
  // Get file from either props or navigation state
  const file = propFile || location.state?.file;
  
  // State for video player
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  
  // State for saved frames (this will come from your backend session)
  const [savedFrames, setSavedFrames] = useState<SavedFrame[]>([]);
  const [capturedFrameUrl, setCapturedFrameUrl] = useState<string | null>(null);

  // Set up video source when file is available
  useEffect(() => {
    if (file && videoRef.current) {
      const url = URL.createObjectURL(file);
      videoRef.current.src = url;
      videoRef.current.load();
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      // Calculate approximate frame index (assuming 30fps for now)
      const fps = 30; // You can get this from your video metadata
      setCurrentFrameIdx(Math.floor(videoRef.current.currentTime * fps));
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const skipSeconds = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Function to capture current frame using backend API
  const handleMeasureFrame = async () => {
    try {
      // Call your backend API endpoint
      const response = await fetch(`http://0.0.0.0:8000/frame-capture/?timestamp=${currentTime}&frame_idx=${currentFrameIdx}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to capture frame');
      }

      // Convert response to blob and create URL for display
      const blob = await response.blob();
      const frameUrl = URL.createObjectURL(blob);
      setCapturedFrameUrl(frameUrl);

      // Create new saved frame entry
      const frameNumber = savedFrames.length + 1;
      const newFrame: SavedFrame = {
        id: `frame-${Date.now()}`,
        name: `Frame ${frameNumber}`,
        timestamp: currentTime,
        frameIdx: currentFrameIdx,
        thumbnailUrl: frameUrl,
        isBaseline: savedFrames.length === 0,
        measurements: []
      };

      setSavedFrames([...savedFrames, newFrame]);
      
    } catch (error) {
      console.error('Error capturing frame:', error);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/video-upload');
    }
  };

  const handleExport = () => {
    console.log('Exporting results...', savedFrames);
    // Export functionality will be implemented here
  };

  if (!file) {
    return (
      <div className="video-analysis-bg">
        <div className="video-analysis-container">
          <p>No video file available</p>
          <button onClick={handleBack} className="back-btn">Back to Upload</button>
        </div>
      </div>
    );
  }

  // Update the return JSX structure to match the new CSS layout
  return (
    <div className={`video-analysis-bg ${isDarkMode ? 'theme-dark' : 'theme-light'}`}>
      <div className="video-analysis-container">
        {/* Main Layout - Two Column Flexbox */}
        <div className="analysis-layout">
          
          {/* Left Column - Back Button + Saved Frames List */}
          <div className="left-column">
            {/* Back Button - Now positioned above frames list */}
            <div className="back-btn-container">
              <button onClick={handleBack} className="back-btn-top">
                Back to Upload Page
              </button>
            </div>
            
            {/* Frames Container */}
            <div className="frames-container">
              <div className="frames-section">
                <h3>Saved Frames</h3>
                <div className="frames-list">
                  {savedFrames.map((frame) => (
                    <div key={frame.id} className="frame-item">
                      {frame.thumbnailUrl && (
                        <img 
                          src={frame.thumbnailUrl} 
                          alt={frame.name}
                          className="frame-thumbnail"
                        />
                      )}
                      <div className="frame-info">
                        <div className="frame-name-container">
                          {frame.isBaseline && <div className="baseline-dot"></div>}
                          <span className="frame-name">{frame.name}</span>
                        </div>
                        <div className="frame-time">{formatTime(frame.timestamp)}</div>
                        <div className="frame-index">Frame: {frame.frameIdx}</div>
                      </div>
                    </div>
                  ))}
                  {savedFrames.length === 0 && (
                    <div className="no-frames">No frames captured yet</div>
                  )}
                </div>
              </div>
              
              {/* Export Results Button */}
              <button onClick={handleExport} className="export-btn">
                Export Results
              </button>
            </div>
          </div>

          {/* Right Column - Video Player and Controls */}
          <div className="right-column">
            
            {/* Video Player */}
            <div className="video-container">
              <video
                ref={videoRef}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                className="video-player"
                controls={false}
                preload="metadata"
              />
            </div>

            {/* Video Controls */}
            <div className="video-controls">
              <div className="playback-controls">
                <button onClick={() => skipSeconds(-10)} className="skip-btn">-10s</button>
                <button onClick={() => skipSeconds(-1)} className="skip-btn">-1s</button>
                <button onClick={handlePlayPause} className="play-pause-btn">
                  {isPlaying ? <FiPause /> : <FiPlay />}
                </button>
                <button onClick={() => skipSeconds(1)} className="skip-btn">+1s</button>
                <button onClick={() => skipSeconds(10)} className="skip-btn">+10s</button>
                <button onClick={handleMeasureFrame} className="measure-frame-btn-inline">
                  Measure Frame
                </button>
              </div>
            </div>

            {/* Timeline Scrubber */}
            <div className="timeline-container">
              <span className="time-display">{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="timeline-slider"
              />
              <span className="time-display">{formatTime(duration)}</span>
            </div>

            {/* Frame Info Display */}
            <div className="frame-info-section">
              <div className="frame-info-display">
                <span>Current Time: {formatTime(currentTime)}</span>
                <span>Frame Index: {currentFrameIdx}</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoAnalysis;