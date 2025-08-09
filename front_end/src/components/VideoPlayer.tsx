import { forwardRef } from 'react';
import { useTheme } from '../contexts/theme-context';

interface VideoPlayerProps {
  onTimeUpdate: () => void;
  onLoadedMetadata: () => void;
}

const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ onTimeUpdate, onLoadedMetadata }, ref) => {
    const { isDarkMode } = useTheme();
    
    return (
      <div className={`flex-1 flex items-center justify-center rounded-xl border p-1 overflow-hidden transition-colors duration-200 ${
        isDarkMode 
          ? 'bg-zinc-900 border-gray-700' 
          : 'bg-gray-300 border-gray-500'
      }`}>
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