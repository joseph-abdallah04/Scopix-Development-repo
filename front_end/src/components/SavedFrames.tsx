import React, { useState } from 'react';
import { GoArrowLeft } from 'react-icons/go';
import { FiDownload } from 'react-icons/fi';
import FrameDetailsPopup from './FrameDetailsPopup';

// Update the SavedFrame interface to include all measurement types
interface SavedFrame {
  id: string;
  name: string;
  customName?: string;
  timestamp: number;
  frameIdx?: number;
  thumbnailUrl?: string;
  isBaseline: boolean;
  measurements: {
    glottic_angle?: number | null;
    supraglottic_angle?: number | null;
    glottic_area?: number | null;
    supraglottic_area?: number | null;
    distance_ratio?: {
      horizontal_distance: number;
      vertical_distance: number;
      ratio_percentage: number;
      horizontal_points: number[][];
      vertical_points: number[][];
    } | null;
  };
}

interface SavedFramesProps {
  savedFrames: SavedFrame[];
  showBackButton?: boolean;
  backButtonText?: string;
  onBack?: () => void;
  onExport?: () => void;
  formatTime: (time: number) => string;
  showExportButton?: boolean;
  className?: string;
  onRenameFrame?: (frameId: string, newName: string) => void;
  onSetBaseline?: (frameId: string) => void;
  onDeleteFrame?: (frameId: string) => void;
  isExporting?: boolean;
  currentFrameIdx?: number;
  totalFrames?: number;
  fps?: number;
}

const SavedFrames: React.FC<SavedFramesProps> = ({
  savedFrames,
  showBackButton = true,
  backButtonText = "Back to Upload Page",
  onBack,
  onExport,
  formatTime,
  // showExportButton = true,
  className = "",
  onRenameFrame,
  onSetBaseline,
  onDeleteFrame,
  isExporting = false,
  // currentFrameIdx,
  // totalFrames,
  // fps,
}) => {
  const [renamingFrameId, setRenamingFrameId] = useState<string | null>(null);
  const [newFrameName, setNewFrameName] = useState<string>("");
  
  // Add state for frame details popup
  const [showFrameDetails, setShowFrameDetails] = useState(false);
  const [selectedFrame, setSelectedFrame] = useState<SavedFrame | null>(null);

  const handleRename = (frame: SavedFrame) => {
    setRenamingFrameId(frame.id);
    setNewFrameName(frame.customName || `Frame ${frame.frameIdx}`);
  };

  const handleSaveRename = (frameId: string) => {
    if (onRenameFrame && newFrameName.trim()) {
      onRenameFrame(frameId, newFrameName.trim());
    }
    setRenamingFrameId(null);
    setNewFrameName("");
  };

  const handleKeyPress = (e: React.KeyboardEvent, frameId: string) => {
    if (e.key === 'Enter') {
      handleSaveRename(frameId);
    } else if (e.key === 'Escape') {
      setRenamingFrameId(null);
      setNewFrameName("");
    }
  };
  
  // Add handler for double-click on frame
  const handleFrameDoubleClick = (frame: SavedFrame) => {
    setSelectedFrame(frame);
    setShowFrameDetails(true);
  };
  
  // Find baseline frame
  const baselineFrame = savedFrames.find(frame => frame.isBaseline) || null;

  return (
    <div className={`w-80 flex flex-col gap-4 flex-shrink-0 ${className}`}>
      {/* Back Button */}
      {showBackButton && onBack && (
        <button 
          onClick={onBack} 
          className="bg-[#232a36] rounded-2xl px-6 py-3 text-white cursor-pointer transition-colors duration-200 flex items-center justify-center gap-2 w-full"
        >
          <GoArrowLeft className="flex-shrink-0" />
          <span className="text-center">{backButtonText}</span>
        </button>
      )}
      
      {/* Frames Container */}
      <div className="bg-zinc-900 rounded-xl border border-gray-700 p-4 flex flex-col flex-1 min-h-0">
        <div className="flex flex-col flex-1 min-h-0">
          <h3 className="text-xl text-white mb-4 text-center border-b border-gray-700 pb-2 m-0">
            Saved Frames
          </h3>
          
          <div className="flex flex-col gap-3 overflow-y-auto flex-1 min-h-0 pr-2">
            {savedFrames.map((frame) => (
              <div 
                key={frame.id} 
                className="bg-gray-700 rounded-lg border border-gray-600 p-3 flex gap-3 flex-shrink-0 group cursor-pointer transition-all duration-200 hover:bg-gray-600 hover:border-blue-500 hover:shadow-md hover:shadow-blue-500/20 hover:translate-x-1 relative"
                onDoubleClick={() => handleFrameDoubleClick(frame)}
                title="Double-click to view details"
              >
                {frame.thumbnailUrl && (
                  <img 
                    src={frame.thumbnailUrl} 
                    alt={frame.customName || frame.name}
                    className="w-15 h-11 rounded object-cover flex-shrink-0 group-hover:ring-2 group-hover:ring-blue-400 transition-all duration-200"
                  />
                )}
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex items-center gap-2">
                    {frame.isBaseline && (
                      <div className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0 group-hover:scale-125 transition-transform duration-200"></div>
                    )}
                    
                    {/* Frame Name - Editable or Display */}
                    {renamingFrameId === frame.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={newFrameName}
                          onChange={(e) => setNewFrameName(e.target.value)}
                          onKeyDown={(e) => handleKeyPress(e, frame.id)}
                          onBlur={() => handleSaveRename(frame.id)}
                          className="flex-1 bg-gray-600 text-white text-sm px-2 py-1 rounded border border-blue-500 focus:outline-none focus:border-blue-400 w-full"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-between">
                        <span className="font-medium text-white text-sm truncate max-w-[70%]">
                          {frame.customName || frame.name}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          {/* Rename Button */}
                          {onRenameFrame && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRename(frame);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded"
                            >
                              Rename
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatTime(frame.timestamp)}
                  </div>
                  <div className="text-xs text-gray-400">
                    Frame: {frame.frameIdx}
                  </div>
                </div>

                {/* Double-click indicator that appears on hover */}
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-70 transition-opacity duration-200 text-xs text-blue-300 bg-gray-800/70 px-2 py-1 rounded-full">
                  Double-click
                </div>
              </div>
            ))}
            {savedFrames.length === 0 && (
              <div className="text-center text-gray-500 italic py-8">
                No frames captured yet
              </div>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="p-4 border-t border-gray-700 space-y-3">
          <button 
            onClick={onBack} 
            className="w-full bg-gray-700 hover:bg-gray-600 text-white border-none rounded-lg px-4 py-3 text-sm cursor-pointer transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <GoArrowLeft />
            Back to Upload
          </button>
          
          <button 
            onClick={onExport}
            disabled={isExporting || savedFrames.length === 0}
            className={`w-full border-none rounded-lg px-4 py-3 text-sm cursor-pointer transition-colors duration-200 flex items-center justify-center gap-2 ${
              isExporting || savedFrames.length === 0
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {isExporting ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                Exporting...
              </>
            ) : (
              <>
                <FiDownload />
                Export Results
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Frame Details Popup */}
      <FrameDetailsPopup
        isOpen={showFrameDetails}
        onClose={() => setShowFrameDetails(false)}
        frame={selectedFrame}
        baselineFrame={baselineFrame}
        formatTime={formatTime}
        onSetBaseline={onSetBaseline}
        onDeleteFrame={onDeleteFrame} // Pass the delete handler to the popup
      />
    </div>
  );
};

export default SavedFrames;
