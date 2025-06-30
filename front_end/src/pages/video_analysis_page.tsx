import React, { useState, useRef, useEffect } from 'react';
import './video_analysis_page.css';

interface VideoAnalysisPageProps {
  file: File | null;
  onBack?: () => void;
}

interface SavedFrame {
  id: string;
  name: string;
  timestamp: number;
  isBaseline: boolean;
  measurements: Array<{
    id: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  }>;
}

function VideoAnalysis({ file, onBack }: VideoAnalysisPageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [savedFrames, setSavedFrames] = useState<SavedFrame[]>([]);
  const [selectedTool, setSelectedTool] = useState<'line' | 'select'>('select');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentMeasurements, setCurrentMeasurements] = useState<Array<{
    id: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  }>>([]);
  const [editingFrameId, setEditingFrameId] = useState<string | null>(null);
  const [editingFrameName, setEditingFrameName] = useState('');

  useEffect(() => {
    if (file && videoRef.current) {
      const url = URL.createObjectURL(file);
      videoRef.current.src = url;
      videoRef.current.load(); // Add this to ensure video loads
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

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

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      // Ensure canvas matches video dimensions
      const canvas = canvasRef.current;
      if (canvas) {
        const video = videoRef.current;
        canvas.width = video.videoWidth || 800;
        canvas.height = video.videoHeight || 450;
      }
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

  const handleSaveFrame = () => {
    const frameNumber = savedFrames.length + 1;
    const newFrame: SavedFrame = {
      id: `frame-${Date.now()}`,
      name: `Frame ${frameNumber}`,
      timestamp: currentTime,
      isBaseline: savedFrames.length === 0, // First frame is baseline by default
      measurements: [...currentMeasurements]
    };
    setSavedFrames([...savedFrames, newFrame]);
    setCurrentMeasurements([]);
    redrawCanvas();
  };

  const setAsBaseline = (frameId: string) => {
    setSavedFrames(frames => 
      frames.map(frame => ({
        ...frame,
        isBaseline: frame.id === frameId
      }))
    );
  };

  const handleFrameNameEdit = (frameId: string, newName: string) => {
    setSavedFrames(frames =>
      frames.map(frame =>
        frame.id === frameId ? { ...frame, name: newName } : frame
      )
    );
    setEditingFrameId(null);
    setEditingFrameName('');
  };

  const goToFrame = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      setCurrentTime(timestamp);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool === 'line') {
      setIsDrawing(true);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const newMeasurement = {
          id: `measurement-${Date.now()}`,
          startX: x,
          startY: y,
          endX: x,
          endY: y
        };
        setCurrentMeasurements([...currentMeasurements, newMeasurement]);
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDrawing && selectedTool === 'line' && currentMeasurements.length > 0) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const updatedMeasurements = [...currentMeasurements];
        updatedMeasurements[updatedMeasurements.length - 1].endX = x;
        updatedMeasurements[updatedMeasurements.length - 1].endY = y;
        setCurrentMeasurements(updatedMeasurements);
        redrawCanvas();
      }
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        
        currentMeasurements.forEach(measurement => {
          ctx.beginPath();
          ctx.moveTo(measurement.startX, measurement.startY);
          ctx.lineTo(measurement.endX, measurement.endY);
          ctx.stroke();
        });
      }
    }
  };

  const handleExport = () => {
    console.log('Exporting results...', savedFrames);
    // Export functionality will be implemented here
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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

  return (
    <div className="video-analysis-bg">
      <div className="video-analysis-container">
        <div className="analysis-content">
          {/* Left Sidebar - Frames List */}
          <div className="frames-sidebar">
            <h3>Saved Frames</h3>
            <div className="frames-list">
              {savedFrames.map((frame) => (
                <div key={frame.id} className="frame-item">
                  <div className="frame-info">
                    <div className="frame-name-container">
                      {frame.isBaseline && <div className="baseline-dot"></div>}
                      {editingFrameId === frame.id ? (
                        <input
                          type="text"
                          value={editingFrameName}
                          onChange={(e) => setEditingFrameName(e.target.value)}
                          onBlur={() => handleFrameNameEdit(frame.id, editingFrameName)}
                          onKeyPress={(e) => e.key === 'Enter' && handleFrameNameEdit(frame.id, editingFrameName)}
                          className="frame-name-input"
                          autoFocus
                        />
                      ) : (
                        <span 
                          className="frame-name"
                          onDoubleClick={() => {
                            setEditingFrameId(frame.id);
                            setEditingFrameName(frame.name);
                          }}
                        >
                          {frame.name}
                        </span>
                      )}
                    </div>
                    <div className="frame-time">{formatTime(frame.timestamp)}</div>
                  </div>
                  <div className="frame-actions">
                    <button 
                      onClick={() => goToFrame(frame.timestamp)}
                      className="goto-btn"
                    >
                      Go to
                    </button>
                    {!frame.isBaseline && (
                      <button 
                        onClick={() => setAsBaseline(frame.id)}
                        className="baseline-btn"
                      >
                        Set as Baseline
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {savedFrames.length === 0 && (
                <div className="no-frames">No frames saved yet</div>
              )}
            </div>
          </div>

          {/* Main Video Area */}
          <div className="video-main">
            {/* Toolbar */}
            <div className="video-toolbar">
              <button 
                className={`tool-btn ${selectedTool === 'select' ? 'active' : ''}`}
                onClick={() => setSelectedTool('select')}
              >
                Select
              </button>
              <button 
                className={`tool-btn ${selectedTool === 'line' ? 'active' : ''}`}
                onClick={() => setSelectedTool('line')}
              >
                Line Tool
              </button>
              <button 
                className="clear-btn"
                onClick={() => {
                  setCurrentMeasurements([]);
                  redrawCanvas();
                }}
              >
                Clear
              </button>
            </div>

            {/* Video Player */}
            <div className="video-container">
              <div className="video-wrapper">
                <video
                  ref={videoRef}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  className="video-player"
                  controls={false}
                  preload="metadata"
                />
                <canvas
                  ref={canvasRef}
                  className={`measurement-canvas ${selectedTool === 'select' ? 'select-mode' : ''}`}
                  width={800}
                  height={450}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                />
              </div>
            </div>

            {/* Video Controls */}
            <div className="video-controls">
              <div className="playback-controls">
                <button onClick={() => skipSeconds(-10)} className="skip-btn">-10s</button>
                <button onClick={() => skipSeconds(-1)} className="skip-btn">-1s</button>
                <button onClick={handlePlayPause} className="play-pause-btn">
                  {isPlaying ? 'Pause' : 'Play'}
                </button>
                <button onClick={() => skipSeconds(1)} className="skip-btn">+1s</button>
                <button onClick={() => skipSeconds(10)} className="skip-btn">+10s</button>
              </div>
              
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
            </div>

            {/* Action Buttons */}
            <div className="video-actions">
              <button onClick={handleSaveFrame} className="save-frame-btn">
                Save Measured Frame
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="analysis-actions">
          <button onClick={handleBack} className="back-btn">
            Back to Upload
          </button>
          <button onClick={handleExport} className="export-btn">
            Export Results
          </button>
        </div>
      </div>
    </div>
  );
}

export default VideoAnalysis;