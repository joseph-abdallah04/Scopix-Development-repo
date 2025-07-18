import React from 'react';

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
  return (
    <div className="bg-zinc-900 rounded-lg border border-gray-700 p-3 flex-shrink-0">
      <div className="text-sm text-gray-300 text-center font-mono">
        <span>Current Time: {formatTime(currentTime)} | </span>
        <span>Frame: {currentFrameIdx} / {totalFrames} | </span>
        <span>FPS: {fps}</span>
      </div>
    </div>
  );
};

export default FrameInfoDisplay;