import React, { forwardRef } from 'react';
import { FiPlay, FiPause, FiSkipBack, FiSkipForward, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';
import { useTheme } from '../contexts/theme-context';

interface TimelineScrubberProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentFrameIdx: number;
  totalFrames: number;
  progressPercentage: number;
  onPlayPause: () => void;
  onMeasureFrame: () => void;
  onTimelineMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  onSkipFrames: (frameCount: number) => void;
  formatTime: (time: number) => string;
  formatFrameCount: (frameIdx: number, total: number) => string;
  generateTimelineMarkers: () => React.ReactNode[];
}

const TimelineScrubber = forwardRef<HTMLDivElement, TimelineScrubberProps>(
  ({
    isPlaying,
    currentTime,
    duration,
    currentFrameIdx,
    totalFrames,
    progressPercentage,
    onPlayPause,
    onMeasureFrame,
    onTimelineMouseDown,
    onSkipFrames,
    formatTime,
    formatFrameCount,
    generateTimelineMarkers
  }, ref) => {
    const { isDarkMode } = useTheme();
    
    return (
      <div className={`flex flex-col gap-3 rounded-lg border p-4 flex-shrink-0 transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-zinc-900 border-gray-700' 
          : 'bg-gray-300 border-gray-500'
      }`}>
        {/* Compact Playback Controls - All in one row */}
        <div className="flex justify-center items-center gap-3 relative">
          {/* Left frame navigation buttons */}
          <div className="flex items-center gap-1">
            <button 
              onClick={() => onSkipFrames(-10)} 
              className={`border-none rounded-md px-2 py-1 cursor-pointer transition-all duration-200 text-xs min-w-12 flex items-center justify-center gap-1 hover:-translate-y-0.5 active:translate-y-0 ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-400 hover:bg-gray-500 text-gray-800'
              }`}
              title="Skip back 10 frames"
            >
              <FiChevronsLeft />
              -10
            </button>
            <button 
              onClick={() => onSkipFrames(-1)} 
              className={`border-none rounded-md px-2 py-1 cursor-pointer transition-all duration-200 text-xs min-w-10 flex items-center justify-center gap-1 hover:-translate-y-0.5 active:translate-y-0 ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-400 hover:bg-gray-500 text-gray-800'
              }`}
              title="Previous frame"
            >
              <FiSkipBack />
              -1
            </button>
          </div>
          
          {/* Central play/pause button */}
          <button 
            onClick={onPlayPause} 
            className="bg-blue-600 hover:bg-blue-700 text-white border-none rounded-full w-12 h-12 cursor-pointer transition-colors duration-200 font-medium flex items-center justify-center flex-shrink-0 text-lg"
          >
            {isPlaying ? <FiPause /> : <FiPlay />}
          </button>
          
          {/* Right frame navigation buttons */}
          <div className="flex items-center gap-1">
            <button 
              onClick={() => onSkipFrames(1)} 
              className={`border-none rounded-md px-2 py-1 cursor-pointer transition-all duration-200 text-xs min-w-10 flex items-center justify-center gap-1 hover:-translate-y-0.5 active:translate-y-0 ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-400 hover:bg-gray-500 text-gray-800'
              }`}
              title="Next frame"
            >
              +1
              <FiSkipForward />
            </button>
            <button 
              onClick={() => onSkipFrames(10)} 
              className={`border-none rounded-md px-2 py-1 cursor-pointer transition-all duration-200 text-xs min-w-12 flex items-center justify-center gap-1 hover:-translate-y-0.5 active:translate-y-0 ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-400 hover:bg-gray-500 text-gray-800'
              }`}
              title="Skip forward 10 frames"
            >
              +10
              <FiChevronsRight />
            </button>
          </div>
          
          {/* Measure Frame Button - Positioned on the right */}
          <button 
            onClick={onMeasureFrame} 
            disabled={isPlaying}
            className={`border-none rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 absolute right-0 ${
              isPlaying 
                ? (isDarkMode ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50' : 'bg-gray-500 text-gray-600 cursor-not-allowed opacity-50')
                : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
            }`}
          >
            Measure Frame
          </button>
        </div>

        {/* Timeline Scrubber */}
        <div className={`flex flex-col gap-2 rounded-lg border p-4 transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-zinc-900 border-gray-700' 
            : 'bg-gray-200 border-gray-500'
        }`}>
          <div className={`flex justify-between items-center text-xs mb-2 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            <div className={`min-w-12 text-center flex-shrink-0 font-mono px-3 py-1 rounded text-sm font-extrabold transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-white bg-opacity-5 text-black' 
                : 'bg-gray-400 text-gray-900'
            }`}>
              {formatTime(currentTime)}
            </div>
            <div className="text-center text-sm">
              Frame: {formatFrameCount(currentFrameIdx, totalFrames)}
            </div>
            <div className={`min-w-12 text-center flex-shrink-0 font-mono px-3 py-1 rounded text-sm font-extrabold transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-white bg-opacity-5 text-black' 
                : 'bg-gray-400 text-gray-900'
            }`}>
              {formatTime(duration)}
            </div>
          </div>
          
          <div 
            ref={ref}
            className={`relative h-5 rounded-lg border my-2 cursor-pointer transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600' 
                : 'bg-gray-500 border-gray-600'
            }`}
            onMouseDown={onTimelineMouseDown}
          >
            <div className={`absolute top-1/2 left-2 right-2 h-1 rounded transform -translate-y-1/2 transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-600' : 'bg-gray-600'
            }`}>
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded transition-all duration-100 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div 
              className="absolute top-1/2 w-4 h-4 bg-blue-600 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-grab shadow-lg transition-all duration-200 hover:bg-blue-500 hover:scale-110 active:cursor-grabbing active:scale-105"
              style={{ left: `${progressPercentage}%` }}
            />
            <div className="absolute top-full left-2 right-2 h-2 mt-1">
              {generateTimelineMarkers()}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

TimelineScrubber.displayName = 'TimelineScrubber';

export default TimelineScrubber;