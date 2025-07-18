import { forwardRef } from 'react';

interface VideoPlayerProps {
  onTimeUpdate: () => void;
  onLoadedMetadata: () => void;
}

const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ onTimeUpdate, onLoadedMetadata }, ref) => {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-900 rounded-xl border border-gray-700 p-1 overflow-hidden">
        <video
          ref={ref}
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoadedMetadata}
          crossOrigin="anonymous"
          className="w-full h-full object-contain rounded-lg shadow-lg"
          style={{ 
            maxWidth: '100%', 
            maxHeight: '100%',
            minHeight: '400px',
            aspectRatio: 'auto'
          }}
          controls={false}
          preload="metadata"
        />
      </div>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;