import React from 'react';

interface FrameViewerProps {
  frameImageUrl: string | null;
  frameIdx: number;
  timestamp: number;
  className?: string;
}

const FrameViewer: React.FC<FrameViewerProps> = ({
  frameImageUrl,
  frameIdx,
  timestamp,
  className = ""
}) => {
  return (
    <div className={`flex-1 flex items-center justify-center bg-zinc-900 rounded-xl border border-gray-700 p-4 overflow-hidden relative ${className}`}>
      {frameImageUrl ? (
        <img 
          src={frameImageUrl} 
          alt={`Frame ${frameIdx} at ${timestamp.toFixed(3)}s`}
          className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
          style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' }}
        />
      ) : (
        <div className="text-center text-gray-400">
          <div className="text-lg mb-2">Loading frame...</div>
          <div className="text-sm">Frame {frameIdx} • {timestamp.toFixed(3)}s</div>
        </div>
      )}
    </div>
  );
};

export default FrameViewer;