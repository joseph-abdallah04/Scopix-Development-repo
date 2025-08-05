import React from 'react';
import { useTheme } from '../contexts/theme-context';

interface FrameInfoDisplayProps {
  currentTime: number;
  currentFrameIdx: number;
  totalFrames: number;
  fps: number;
  formatTime: (time: number) => string;
}

const FrameInfoDisplay: React.FC<FrameInfoDisplayProps> = ({
  currentTime,
  currentFrameIdx,
  totalFrames,
  fps,
  formatTime
}) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`rounded-lg border p-3 flex-shrink-0 transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-zinc-900 border-gray-700' 
        : 'bg-gray-300 border-gray-500'
    }`}>
      <div className={`text-sm text-center font-mono transition-colors duration-300 ${
        isDarkMode ? 'text-gray-300' : 'text-gray-700'
      }`}>
        <span>Current Time: {formatTime(currentTime)} | </span>
        <span>Frame: {currentFrameIdx} / {totalFrames} | </span>
        <span>FPS: {fps}</span>
      </div>
    </div>
  );
};

export default FrameInfoDisplay;