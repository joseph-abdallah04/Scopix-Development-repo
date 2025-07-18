import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GoArrowLeft } from "react-icons/go";
import SavedFrames from '../components/SavedFrames';
import VideoPlayer from '../components/VideoPlayer';
import TimelineScrubber from '../components/TimelineScrubber';
import FrameInfoDisplay from '../components/FrameInfoDisplay';
import ConfirmationPopup from '../components/ConfirmationPopup';
import { useExport } from '../hooks/useExport';

interface VideoAnalysisPageProps {
  file?: File | null;
  onBack?: () => void;
}

interface SavedFrame {
  id: string;
  name: string;
  customName?: string;  // Add this field
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
  
  // Get session info from upload or check if session exists
  const sessionInfo = location.state?.sessionInfo;
  const uploadedFile = propFile || location.state?.file;
  
  // Resume state from navigation (when coming back from manual measurement)
  const resumeAtFrame = location.state?.resumeAtFrame;
  const resumeAtTimestamp = location.state?.resumeAtTimestamp;
  
  // State for video player
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [fps, setFps] = useState(30);
  const [isDragging, setIsDragging] = useState(false);
  
  // Session-based state
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  
  // State for saved frames
  const [savedFrames, setSavedFrames] = useState<SavedFrame[]>([]);
  const [lastPositionUpdate, setLastPositionUpdate] = useState(0);
  const [showBackConfirmation, setShowBackConfirmation] = useState(false);

  // State for duplicate frame confirmation
  const [showDuplicateFrameConfirmation, setShowDuplicateFrameConfirmation] = useState(false);
  const [duplicateFrameData, setDuplicateFrameData] = useState<any>(null);

  // Add backend frame count state
  const [backendFrameCount, setBackendFrameCount] = useState<number | null>(null);

  // Calculate frame duration and total frames
  const frameDuration = 1 / fps;
  const totalFrames = backendFrameCount ?? Math.floor(duration * fps);

  // Function to update position in session
  const updateSessionPosition = useCallback(async (timestamp: number, frameIdx: number, isPaused?: boolean) => {
    try {
      const params = new URLSearchParams({
        timestamp: timestamp.toString(),
        frame_idx: frameIdx.toString()
      });
      
      if (isPaused !== undefined) {
        params.append('is_paused', isPaused.toString());
      }
      
      await fetch(`http://localhost:8000/session/update-position?${params}`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error updating session position:', error);
    }
  }, []);

  // Check for active session on component mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('Checking for active session...');
        const response = await fetch('http://localhost:8000/session/current');
        
        if (response.ok) {
          const session = await response.json();
          console.log('Active session found:', session);
          setHasActiveSession(true);
          setSessionData(session);
          
          // Get frame_count from backend metadata
          if (session.metadata?.frame_count) {
            setBackendFrameCount(session.metadata.frame_count);
          }
          
          // If we have a session, we can load the video from the backend
          if (session.video_path) {
            console.log('Setting up video stream URL...');
            const videoStreamUrl = `http://localhost:8000/session/video-file`;
            setVideoUrl(videoStreamUrl);
            
            // Store position to restore later when video loads - but don't override resume state
            if (session.current_timestamp !== undefined && resumeAtTimestamp === undefined) {
              console.log(`Will restore session position: ${session.current_timestamp}s, frame ${session.current_frame_idx}`);
              setCurrentTime(session.current_timestamp);
              setCurrentFrameIdx(session.current_frame_idx);
              
              // Add a flag to indicate we need to restore session position
              sessionStorage.setItem('pendingVideoPosition', JSON.stringify({
                timestamp: session.current_timestamp,
                frameIdx: session.current_frame_idx
              }));
            }
          }
        } else {
          console.log('No active session found, response status:', response.status);
          const errorText = await response.text();
          console.log('Session check error:', errorText);
          
          if (uploadedFile) {
            console.warn('No active session found but file provided');
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
        if (!uploadedFile) {
          setHasActiveSession(false);
        }
      }
    };

    checkSession();
  }, [uploadedFile]);

  useEffect(() => {
  const loadMeasuredFrames = async () => {
    if (!hasActiveSession) return;
    
    try {
      console.log('Loading measured frames from backend...');
      const response = await fetch('http://localhost:8000/session/measured-frames');
      
      if (response.ok) {
        const data = await response.json();
        console.log('Measured frames loaded:', data);
        
        // Convert backend frame data to frontend format with proper measurement mapping
        const convertedFrames = data.measured_frames.map((frame: any) => {
          console.log('Processing frame measurements:', frame.measurements);
          
          // Extract measurements correctly from the backend format
          const measurements = {
            // For angles, we need to access the angle property
            glottic_angle: frame.measurements?.glottic?.angle !== undefined 
              ? frame.measurements.glottic.angle 
              : null,
            supraglottic_angle: frame.measurements?.supraglottic?.angle !== undefined 
              ? frame.measurements.supraglottic.angle 
              : null,
            
            // For areas, we need to access the area_pixels property
            glottic_area: frame.measurements?.glottic_area?.area_pixels !== undefined 
              ? frame.measurements.glottic_area.area_pixels 
              : null,
            supraglottic_area: frame.measurements?.supraglottic_area?.area_pixels !== undefined 
              ? frame.measurements.supraglottic_area.area_pixels 
              : null,
            
            // Add distance ratio - keep the full object structure
            distance_ratio: frame.measurements?.distance_ratio ? {
              horizontal_distance: frame.measurements.distance_ratio.horizontal_distance,
              vertical_distance: frame.measurements.distance_ratio.vertical_distance,
              ratio_percentage: frame.measurements.distance_ratio.ratio_percentage,
              horizontal_points: frame.measurements.distance_ratio.horizontal_points,
              vertical_points: frame.measurements.distance_ratio.vertical_points
            } : null
          };
          
          console.log('Converted measurements:', measurements);
          
          return {
            id: frame.frame_id,
            name: `Frame ${frame.frame_idx}`,
            customName: frame.custom_name,
            timestamp: frame.timestamp,
            frameIdx: frame.frame_idx,
            thumbnailUrl: `http://localhost:8000/session/frame-thumbnail/${frame.frame_id}`,
            isBaseline: frame.frame_id === data.baseline_frame_id,
            measurements: measurements
          };
        });
        
        setSavedFrames(convertedFrames);
        console.log('Converted frames:', convertedFrames);
      } else {
        console.log('No measured frames found or error loading frames');
      }
    } catch (error) {
      console.error('Error loading measured frames:', error);
    }
  };

  // Load frames when component mounts or when returning from manual measurement
  loadMeasuredFrames();
}, [hasActiveSession, location.state?.frameSaved]);

  // Set up video source when we have a video URL (from session)
  useEffect(() => {
    if (videoUrl && videoRef.current) {
      // Instead of streaming, load the video directly
      videoRef.current.src = videoUrl;
      videoRef.current.load();
      
      // Optionally preload the entire video for instant scrubbing
      videoRef.current.preload = "auto"; // or "metadata" for faster initial load
    } else if (uploadedFile && videoRef.current && !hasActiveSession) {
      // Fallback: use uploaded file if no session (shouldn't normally happen)
      const url = URL.createObjectURL(uploadedFile);
      videoRef.current.src = url;
      // ✅ ADD THIS LINE: Set crossOrigin for local files too
      videoRef.current.crossOrigin = "anonymous";
      videoRef.current.load();
      return () => URL.revokeObjectURL(url);
    }
  }, [videoUrl, uploadedFile, hasActiveSession, sessionData]);

  // Resume to specific frame when coming back from manual measurement
  useEffect(() => {
    if (resumeAtFrame !== undefined && resumeAtTimestamp !== undefined && videoRef.current) {
      console.log(`🎯 Attempting to resume to frame ${resumeAtFrame} at ${resumeAtTimestamp}s`);
      
      const attemptResume = () => {
        if (videoRef.current && videoRef.current.duration > 0) {
          console.log(`✅ Resuming to frame ${resumeAtFrame} at ${resumeAtTimestamp}s`);
          videoRef.current.currentTime = resumeAtTimestamp;
          setCurrentTime(resumeAtTimestamp);
          setCurrentFrameIdx(resumeAtFrame);
          return true;
        }
        return false;
      };

      // Try immediate resume if video is already loaded
      if (attemptResume()) {
        return;
      }

      // If not loaded, wait for various loading events
      const handleLoadedData = () => {
        console.log('📹 Video loadeddata event fired, attempting resume...');
        attemptResume();
      };

      const handleLoadedMetadata = () => {
        console.log('📹 Video loadedmetadata event fired, attempting resume...');
        attemptResume();
      };

      const handleCanPlay = () => {
        console.log('📹 Video canplay event fired, attempting resume...');
        if (attemptResume()) {
          // Clean up listeners after successful resume
          cleanup();
        }
      };

      const cleanup = () => {
        videoRef.current?.removeEventListener('loadeddata', handleLoadedData);
        videoRef.current?.removeEventListener('loadedmetadata', handleLoadedMetadata);
        videoRef.current?.removeEventListener('canplay', handleCanPlay);
      };

      // Add multiple event listeners to catch different loading stages
      videoRef.current.addEventListener('loadeddata', handleLoadedData);
      videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      videoRef.current.addEventListener('canplay', handleCanPlay);

      // Cleanup function
      return cleanup;
    }
  }, [resumeAtFrame, resumeAtTimestamp, videoUrl]); // Add videoUrl as dependency

  // Restore session position when video loads (but not when resuming from manual measurement)
  useEffect(() => {
    if (videoRef.current && videoUrl && resumeAtFrame === undefined && resumeAtTimestamp === undefined) {
      const pendingPosition = sessionStorage.getItem('pendingVideoPosition');
      
      if (pendingPosition) {
        const { timestamp, frameIdx } = JSON.parse(pendingPosition);
        console.log(`🔄 Restoring session position: ${timestamp}s, frame ${frameIdx}`);
        
        const handleCanPlay = () => {
          if (videoRef.current && videoRef.current.duration > 0) {
            videoRef.current.currentTime = timestamp;
            setCurrentTime(timestamp);
            setCurrentFrameIdx(frameIdx);
            sessionStorage.removeItem('pendingVideoPosition');
            videoRef.current.removeEventListener('canplay', handleCanPlay);
          }
        };

        if (videoRef.current.readyState >= 3) {
          // Video is already loaded enough
          handleCanPlay();
        } else {
          videoRef.current.addEventListener('canplay', handleCanPlay);
        }
      }
    }
  }, [videoUrl, resumeAtFrame, resumeAtTimestamp]);

  // Helper functions remain the same...
  const frameToTime = useCallback((frameIndex: number): number => {
    const clampedFrame = Math.max(0, Math.min(totalFrames - 1, frameIndex));
    return clampedFrame / fps;
  }, [fps, totalFrames]);

  const timeToFrame = useCallback((time: number): number => {
    const frameIdx = Math.round(time * fps);
    return Math.max(0, Math.min(totalFrames - 1, frameIdx));
  }, [fps, totalFrames]);

  const seekToFrame = useCallback((frameIndex: number) => {
    if (!videoRef.current) return;
    const clampedFrame = Math.max(0, Math.min(totalFrames - 1, frameIndex));
    const exactTime = frameToTime(clampedFrame);
    videoRef.current.currentTime = exactTime;
    setCurrentTime(exactTime);
    setCurrentFrameIdx(clampedFrame);
  }, [frameToTime, totalFrames]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current && !isDragging) {
      const newTime = videoRef.current.currentTime;
      const newFrameIdx = timeToFrame(newTime);
      setCurrentTime(newTime);
      setCurrentFrameIdx(newFrameIdx);
      
      // ✅ Only update session every 5 seconds during normal playback
      const now = Date.now();
      if (now - lastPositionUpdate > 5000) {
        updateSessionPosition(newTime, newFrameIdx);
        setLastPositionUpdate(now);
      }
    }
  }, [isDragging, timeToFrame, updateSessionPosition, lastPositionUpdate]);

  const detectVideoFrameRate = useCallback(async (videoElement: HTMLVideoElement): Promise<number> => {
    return new Promise((resolve) => {
      try {
        // Try modern browser API first
        if ('requestVideoFrameCallback' in videoElement) {
          let frameCount = 0;
          let lastTimestamp = 0;
          let frameTimes: number[] = [];
          
          const sampleFrameRate = (timestamp: number) => {
            if (lastTimestamp > 0) {
              frameTimes.push(timestamp - lastTimestamp);
            }
            lastTimestamp = timestamp;
            frameCount++;
            
            if (frameCount < 30) { // Sample 30 frames
              videoElement.requestVideoFrameCallback(sampleFrameRate);
            } else {
              // Calculate average frame time
              const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
              const fps = 1000000 / avgFrameTime; // Convert microseconds to FPS
              resolve(Math.round(fps * 100) / 100); // Round to 2 decimal places
            }
          };
          
          videoElement.requestVideoFrameCallback(sampleFrameRate);
        } else {
          // Fallback for older browsers
          console.warn('requestVideoFrameCallback not supported, using 30 FPS fallback');
          resolve(30);
        }
      } catch (error) {
        console.warn('Error detecting frame rate:', error);
        resolve(30); // Fallback
      }
    });
  }, []);

  // Add this simpler approach that gets FPS from the backend

const getBackendVideoInfo = useCallback(async (): Promise<number> => {
  try {
    const response = await fetch('http://localhost:8000/session/video-info');
    if (response.ok) {
      const data = await response.json();
      console.log(`🎬 Backend detected FPS: ${data.video_info.fps}`);
      return data.video_info.fps;
    }
  } catch (error) {
    console.warn('Could not get backend video info:', error);
  }
  return 30; // Fallback
}, []);

// Update handleLoadedMetadata to try backend first
const handleLoadedMetadata = useCallback(async () => {
  if (videoRef.current) {
    const videoDuration = videoRef.current.duration;
    setDuration(videoDuration);
    
    console.log('🎬 Detecting video frame rate...');
    
    let actualFps = 30; // Default fallback
    
    // Try backend first (most accurate)
    try {
      actualFps = await getBackendVideoInfo();
      console.log(`✅ Backend detected frame rate: ${actualFps} FPS`);
    } catch (backendError) {
      console.warn('Backend frame rate detection failed, trying frontend...');
      
      // Fallback to frontend detection
      try {
        actualFps = await detectVideoFrameRate(videoRef.current);
        console.log(`✅ Frontend detected frame rate: ${actualFps} FPS`);
      } catch (frontendError) {
        console.warn('⚠️ All frame rate detection failed, using 30 FPS fallback');
        actualFps = 30;
      }
    }
    
    setFps(actualFps);
    
    // Add event listeners for play/pause events
    const video = videoRef.current;
    
    const handlePlay = () => {
      setIsPlaying(true);
      updateSessionPosition(currentTime, currentFrameIdx, false);
    };
    
    const handlePause = () => {
      setIsPlaying(false);
      updateSessionPosition(currentTime, currentFrameIdx, true);
    };
    
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    
    // Cleanup function to remove event listeners
    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }
}, [detectVideoFrameRate, getBackendVideoInfo, updateSessionPosition, currentTime, currentFrameIdx]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        // Update session: video is now paused
        updateSessionPosition(currentTime, currentFrameIdx, true);
      } else {
        videoRef.current.play();
        // Update session: video is now playing
        updateSessionPosition(currentTime, currentFrameIdx, false);
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Make frame skipping instant:
  const skipFrames = useCallback((frameCount: number) => {
    if (!videoRef.current) return;
    const currentVideoTime = videoRef.current.currentTime;
    const currentVideoFrame = timeToFrame(currentVideoTime);
    const newFrameIdx = Math.max(0, Math.min(totalFrames - 1, currentVideoFrame + frameCount));
    const newTime = frameToTime(newFrameIdx);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    setCurrentFrameIdx(newFrameIdx);
    updateSessionPosition(newTime, newFrameIdx, !isPlaying);
    setLastPositionUpdate(Date.now());
  }, [frameToTime, timeToFrame, totalFrames, updateSessionPosition, isPlaying]);

  // Timeline handling remains the same...
  const handleTimelineMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !duration) return;
    
    setIsDragging(true);
    updateTimelinePosition(e);
    
    // Pause video during dragging
    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
    }
  };

  const handleTimelineMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    updateTimelinePosition(e as any);
  }, [isDragging]);

  const handleTimelineMouseUp = useCallback(() => {
    setIsDragging(false);
    
    // Save position when dragging stops
    if (videoRef.current) {
      const finalTime = videoRef.current.currentTime;
      const finalFrameIdx = timeToFrame(finalTime);
      updateSessionPosition(finalTime, finalFrameIdx, !isPlaying);
      setLastPositionUpdate(Date.now());
    }
    
    // Resume playing if it was playing before drag - with delay to avoid race condition
    if (videoRef.current && isPlaying) {
      setTimeout(() => {
        if (videoRef.current && !videoRef.current.seeking) {
          videoRef.current.play().catch(error => {
            console.warn('Play interrupted:', error);
          });
        }
      }, 100);
    }
  }, [isPlaying, timeToFrame, updateSessionPosition]);

  // Remove the debouncing and make video seeking immediate:
  const updateTimelinePosition = useCallback((e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
    if (!timelineRef.current || !duration) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * duration;
    const newFrameIdx = timeToFrame(newTime);
    
    // ✅ FIXED: Always use exact frame time to prevent drift
    const exactFrameTime = frameToTime(newFrameIdx);
    
    // Update state with exact frame time
    setCurrentTime(exactFrameTime);
    setCurrentFrameIdx(newFrameIdx);
    
    // Seek video to exact frame time
    if (videoRef.current) {
      videoRef.current.currentTime = exactFrameTime;
    }
  }, [duration, timeToFrame, frameToTime]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleTimelineMouseMove);
      document.addEventListener('mouseup', handleTimelineMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleTimelineMouseMove);
        document.removeEventListener('mouseup', handleTimelineMouseUp);
      };
    }
  }, [isDragging, handleTimelineMouseMove, handleTimelineMouseUp]);

  const generateTimelineMarkers = () => {
    const markers = [];
    const markerInterval = Math.max(1, Math.floor(duration / 20));
    
    for (let i = 0; i <= duration; i += markerInterval) {
      const percentage = (i / duration) * 100;
      const isMajor = i % (markerInterval * 5) === 0;
      
      markers.push(
        <div
          key={i}
          className={`absolute w-0.5 bg-white bg-opacity-30 ${isMajor ? 'h-2 bg-opacity-50 w-0.5' : 'h-1.5'}`}
          style={{ left: `${percentage}%` }}
        />
      );
    }
    
    return markers;
  };

  // ✅ NEW: Canvas-based frame capture function
  const captureVideoFrame = useCallback((): Promise<{ blob: Blob; actualTime: number; actualFrameIdx: number }> => {
    return new Promise((resolve, reject) => {
      if (!videoRef.current) {
        reject(new Error('Video not available'));
        return;
      }

      // Get the EXACT video position at capture time
      const actualTime = videoRef.current.currentTime;
      const actualFrameIdx = timeToFrame(actualTime);

      // Create a temporary canvas to capture the current video frame
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // Set canvas size to match video
      canvas.width = videoRef.current.videoWidth || 800;
      canvas.height = videoRef.current.videoHeight || 600;
      
      // Draw the current video frame to canvas
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          resolve({ 
            blob, 
            actualTime, 
            actualFrameIdx 
          });
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      }, 'image/png', 0.95);
    });
  }, [timeToFrame]);

  // Update handleMeasureFrame to use canvas capture
  const handleMeasureFrame = async () => {
    if (!videoRef.current || !videoRef.current.src) {
      console.warn('⚠️ Video not ready for frame capture');
      return;
    }
    
    const video = videoRef.current;
    
    // Ensure video is in a stable state
    if (video.seeking || video.readyState < 2) {
      console.log('⏳ Waiting for video to be ready...');
      await new Promise(resolve => {
        const checkReady = () => {
          if (!video.seeking && video.readyState >= 2) {
            resolve(true);
          } else {
            setTimeout(checkReady, 50);
          }
        };
        checkReady();
      });
    }
    
    try {
      // ✅ FIXED: Capture frame using canvas for perfect accuracy
      console.log('🎨 Capturing frame using canvas...');
      const { blob, actualTime, actualFrameIdx } = await captureVideoFrame();
      
      console.log(`🎯 Canvas frame captured at EXACT time: ${actualTime}s, frame: ${actualFrameIdx}`);
      
      // Check if frame already exists using the exact frame index
      const checkResponse = await fetch(`http://localhost:8000/session/check-frame/${actualFrameIdx}`);
      
      if (checkResponse.ok) {
        const checkResult = await checkResponse.json();
        
        if (checkResult.exists) {
          setDuplicateFrameData({
            frameIdx: actualFrameIdx,
            timestamp: actualTime,
            existingFrame: checkResult.frame_data,
            canvasBlob: blob  // Store the canvas blob for later use
          });
          setShowDuplicateFrameConfirmation(true);
          return;
        }
      }
      
      // Proceed with frame capture using canvas blob
      await proceedWithFrameCapture(false, actualTime, actualFrameIdx, blob);
      
    } catch (error) {
      console.error('Error capturing frame:', error);
    }
  };

  // ✅ UPDATED: Enhanced proceedWithFrameCapture to handle both canvas and backend
  const proceedWithFrameCapture = async (
    overrideExisting: boolean = false, 
    captureTime?: number, 
    captureFrameIdx?: number, 
    canvasBlob?: Blob
  ) => {
    try {
      // Use provided values or fall back to current state
      const timeToUse = captureTime ?? currentTime;
      const frameIdxToUse = captureFrameIdx ?? currentFrameIdx;
      
      console.log(`🚀 Proceeding with frame capture: time=${timeToUse}, frame=${frameIdxToUse}, hasCanvasBlob=${!!canvasBlob}`);
      
      // Save current position before navigating away
      await updateSessionPosition(timeToUse, frameIdxToUse, true);
      
      let imageBlob: Blob;
      
      if (canvasBlob) {
        // Use the canvas-captured frame for accuracy
        imageBlob = canvasBlob;
        console.log('✅ Using canvas-captured frame for perfect accuracy');
      } else {
        // Fallback to backend capture (for backwards compatibility)
        console.log('📡 Falling back to backend frame capture');
        const response = await fetch(`http://localhost:8000/frame-capture/?timestamp=${timeToUse}&frame_idx=${frameIdxToUse}`, {
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error('Failed to capture frame from backend');
        }

        imageBlob = await response.blob();
      }
      
      // Navigate with the frame data
      navigate('/manual-measurement', {
        state: {
          frameData: {
            timestamp: timeToUse,
            frameIdx: frameIdxToUse,
            imageBlob: imageBlob,
            overrideExisting: overrideExisting,
            captureMethod: canvasBlob ? 'canvas' : 'backend'  // Track capture method for debugging
          }
        }
      });
      
    } catch (error) {
      console.error('Error in frame capture process:', error);
    }
  };

  // ✅ UPDATED: Handle duplicate frame confirmation with canvas blob
  const handleConfirmOverride = () => {
    setShowDuplicateFrameConfirmation(false);
    
    // Use the stored canvas blob from the duplicate frame data
    const canvasBlob = duplicateFrameData?.canvasBlob;
    const timestamp = duplicateFrameData?.timestamp;
    const frameIdx = duplicateFrameData?.frameIdx;
    
    proceedWithFrameCapture(true, timestamp, frameIdx, canvasBlob);
  };

  const handleCancelOverride = () => {
    setShowDuplicateFrameConfirmation(false);
    setDuplicateFrameData(null);
  };

  const handleRenameFrame = async (frameId: string, newName: string) => {
    try {
      const response = await fetch('http://localhost:8000/session/update-frame-name', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          frame_id: frameId,
          custom_name: newName
        })
      });

      if (response.ok) {
        // Update local state
        setSavedFrames(frames =>
          frames.map(frame =>
            frame.id === frameId ? { ...frame, customName: newName } : frame
          )
        );
      } else {
        console.error('Failed to update frame name');
      }
    } catch (error) {
      console.error('Error updating frame name:', error);
    }
  };

  const handleDeleteFrame = async (frameId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/session/remove-frame/${frameId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Update local state to remove the deleted frame
        setSavedFrames(frames => frames.filter(frame => frame.id !== frameId));
        console.log(`Frame ${frameId} deleted successfully`);
      } else {
        console.error('Failed to delete frame');
        alert('Failed to delete frame. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting frame:', error);
      alert('Failed to delete frame. Please try again.');
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time % 1) * 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };

  const formatFrameCount = (frameIdx: number, total: number) => {
    return `${frameIdx.toString().padStart(6, '0')} / ${total.toString().padStart(6, '0')}`;
  };

  
  // Add a function to handle setting a frame as the baseline
  const handleSetBaseline = async (frameId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/session/set-baseline/${frameId}`, {
        method: 'POST',
      });

      if (response.ok) {
        // Update local state to reflect the new baseline
        setSavedFrames(prevFrames => 
          prevFrames.map(frame => ({
            ...frame,
            isBaseline: frame.id === frameId
          }))
        );
        
        // Remove the workaround code - the popup will update automatically now
        console.log(`Frame ${frameId} set as baseline`);
      } else {
        console.error('Failed to set baseline frame');
      }
    } catch (error) {
      console.error('Error setting baseline frame:', error);
    }
  };

  // Updated back handler to show confirmation popup
  const handleBack = () => {
    setShowBackConfirmation(true);
  };

  // Enhanced cleanup function for video element
  const cleanupVideoElement = useCallback(() => {
    if (videoRef.current) {
      console.log('🧹 Cleaning up video element...');
      
      const video = videoRef.current;
      
      // Remove ALL possible event listeners
      const events = ['timeupdate', 'loadedmetadata', 'play', 'pause', 'loadeddata', 'canplay', 'seeked', 'ended', 'error'];
      events.forEach(event => {
        video.removeEventListener(event, () => {});
      });
      
      // Pause and reset video completely
      video.pause();
      video.currentTime = 0;
      video.src = '';
      video.removeAttribute('src');
      video.load(); // Force reload to clear buffer and release resources
      
      console.log('✅ Video element cleaned up');
    }
    
    // Reset ALL video-related state
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setCurrentFrameIdx(0);
    setIsDragging(false);
    setVideoUrl(null);
    setFps(30);
    setLastPositionUpdate(0);
    
    // Clear session storage
    sessionStorage.removeItem('pendingVideoPosition');
    
    // Reset session state
    setHasActiveSession(false);
    setSessionData(null);
    setSavedFrames([]);
    
    console.log('✅ All state cleaned up');
  }, []); // Empty dependency array since we only want this created once

  // Enhanced video setup effect that properly handles cleanup
  useEffect(() => {
    if (videoUrl && videoRef.current) {
      console.log('🎬 Setting up new video:', videoUrl);
      
      const video = videoRef.current;
      
      // Always clean up existing setup first
      video.pause();
      video.currentTime = 0;
      video.removeAttribute('src');
      video.load(); // Clear any cached data
      
      // Set new source
      video.src = videoUrl;
      video.crossOrigin = "anonymous";
      video.preload = "auto";
      video.load();
      
      // Add essential event listeners
      const handleLoadedMetadataLocal = () => {
        console.log('📹 Video metadata loaded, duration:', video.duration);
        setDuration(video.duration || 0);
      };
      
      const handleTimeUpdateLocal = () => {
        if (!isDragging) {
          const newTime = video.currentTime;
          const newFrameIdx = timeToFrame(newTime);
          setCurrentTime(newTime);
          setCurrentFrameIdx(newFrameIdx);
        }
      };
      
      video.addEventListener('loadedmetadata', handleLoadedMetadataLocal);
      video.addEventListener('timeupdate', handleTimeUpdateLocal);
      
      // Cleanup function for this effect
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadataLocal);
        video.removeEventListener('timeupdate', handleTimeUpdateLocal);
      };
      
    } else if (uploadedFile && videoRef.current && !hasActiveSession) {
      // Fallback for uploaded file
      const video = videoRef.current;
      
      // Clean up first
      video.pause();
      video.currentTime = 0;
      video.removeAttribute('src');
      video.load();
      
      const url = URL.createObjectURL(uploadedFile);
      video.src = url;
      video.crossOrigin = "anonymous";
      video.load();
      
      return () => URL.revokeObjectURL(url);
    }
  }, [videoUrl, uploadedFile, hasActiveSession]); // Remove isDragging and timeToFrame from dependencies

  // // Keep the timeline handling separate and don't reset during dragging
  // const updateTimelinePosition = useCallback((e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
  //   if (!timelineRef.current || !duration || !videoRef.current) return;
    
  //   const rect = timelineRef.current.getBoundingClientRect();
  //   const x = e.clientX - rect.left;
  //   const percentage = Math.max(0, Math.min(1, x / rect.width));
  //   const newTime = percentage * duration;
  //   const newFrameIdx = timeToFrame(newTime);
    
  //   // Update everything immediately - no debouncing
  //   setCurrentTime(newTime);
  //   setCurrentFrameIdx(newFrameIdx);
    
  //   // Ensure video seeks to the exact frame time
  //   const exactFrameTime = frameToTime(newFrameIdx);
  //   videoRef.current.currentTime = exactFrameTime;
  // }, [duration, timeToFrame, frameToTime]);

  const handleConfirmBack = async () => {
    try {
      // Clean up video element BEFORE clearing session
      cleanupVideoElement();
      
      // Clear the session when going back to upload
      await fetch('http://localhost:8000/session/clear', { method: 'POST' });
    } catch (error) {
      console.error('Error clearing session:', error);
    }
    
    if (onBack) {
      onBack();
    } else {
      navigate('/video-upload');
    }
  };

  const handleCancelBack = () => {
    setShowBackConfirmation(false);
  };

  // Use the export hook to manage export state and errors
  const { exportResults, exportError, clearExportError, isExporting } = useExport();

  // Updated export handler
  const handleExport = async () => {
    try {
      console.log('Starting export...', savedFrames);

      // Find baseline frame ID
      const baselineFrame = savedFrames.find(frame => frame.isBaseline);
      const baselineFrameId = baselineFrame?.id;

      // Attempt to export
      const success = await exportResults(savedFrames, baselineFrameId);

      if (success) {
        // Clean up video element BEFORE clearing session
        cleanupVideoElement();
        
        // Clear session after successful export
        await fetch('http://localhost:8000/session/clear', { method: 'POST' });

        // Navigate back to upload after export
        navigate('/video-upload');
      }

    } catch (error) {
      console.error('Error during export:', error);
    }
  };

  // Add error display if needed
  const renderExportError = () => {
    if (!exportError) return null;

    return (
      <div className="fixed top-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg z-50">
        <div className="flex items-center gap-2">
          <span>Export failed: {exportError}</span>
          <button 
            onClick={clearExportError}
            className="ml-2 text-white hover:text-gray-200"
          >
            ×
          </button>
        </div>
      </div>
    );
  };

  // Check if we have either a session or uploaded file
  if (!hasActiveSession && !uploadedFile) {
    return (
      <div className="w-screen h-screen min-h-screen bg-black text-white flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <p className="text-xl mb-6">No video session available</p>
          <button 
            onClick={handleBack} 
            className="bg-gray-700 hover:bg-gray-600 text-white border-none rounded-lg px-6 py-3 text-base cursor-pointer transition-colors duration-200 flex items-center gap-2"
          >
            <GoArrowLeft />
            Back to Upload
          </button>
        </div>
      </div>
    );
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-screen h-screen min-h-screen bg-black text-white flex flex-col p-4 box-border overflow-hidden">
      {renderExportError()}
      
      <div className="flex-1 flex flex-col max-w-full h-screen overflow-hidden relative">
        {/* Main Layout - Two Column Flexbox */}
        <div className="flex flex-1 gap-4 min-h-0 overflow-hidden mt-4">
          
          {/* Left Column - Saved Frames List */}
          <SavedFrames
            savedFrames={savedFrames}
            onBack={handleBack}
            onExport={handleExport}
            isExporting={isExporting} // Add this prop
            formatTime={formatTime}
            onRenameFrame={handleRenameFrame}
            onSetBaseline={handleSetBaseline}
            onDeleteFrame={handleDeleteFrame} // Add this back
            currentFrameIdx={currentFrameIdx}
            totalFrames={totalFrames}
            fps={fps}
          />

          {/* Right Column - Video Player and Controls */}
          <div className="flex-1 flex flex-col gap-3 min-w-0 min-h-0 overflow-hidden">
            
            {/* Video Player */}
            <VideoPlayer
              ref={videoRef}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
            />

            {/* Timeline Scrubber and Controls */}
            <TimelineScrubber
              ref={timelineRef}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              currentFrameIdx={currentFrameIdx}
              totalFrames={totalFrames}
              progressPercentage={progressPercentage}
              onPlayPause={handlePlayPause}
              onMeasureFrame={handleMeasureFrame}
              onTimelineMouseDown={handleTimelineMouseDown}
              onSkipFrames={skipFrames}
              formatTime={formatTime}
              formatFrameCount={formatFrameCount}
              generateTimelineMarkers={generateTimelineMarkers}
            />

            {/* Frame Info Display */}
            <FrameInfoDisplay
              currentTime={currentTime}
              currentFrameIdx={currentFrameIdx}
              totalFrames={totalFrames}
              fps={fps}
              formatTime={formatTime}
            />

          </div>
        </div>
      </div>

      {/* Confirmation Popups */}
      <ConfirmationPopup
        isOpen={showBackConfirmation}
        title="Unsaved Changes"
        message="Your entire session and all saved frames will be lost. Progress will not be saved until results are exported. Are you sure you want to go back to the upload page?"
        confirmButtonText="Confirm"
        cancelButtonText="Cancel"
        onConfirm={handleConfirmBack}
        onCancel={handleCancelBack}
      />

      <ConfirmationPopup
        isOpen={showDuplicateFrameConfirmation}
        title="Frame Already Measured"
        message={`Frame ${duplicateFrameData?.frameIdx} has already been measured${duplicateFrameData?.existingFrame?.custom_name ? ` (${duplicateFrameData.existingFrame.custom_name})` : ''}. Do you want to override the existing measurements for this frame?`}
        confirmButtonText="Override"
        cancelButtonText="Cancel"
        onConfirm={handleConfirmOverride}
        onCancel={handleCancelOverride}
      />
    </div>
  );
}

export default VideoAnalysis;
