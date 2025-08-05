import React, { useState } from 'react';
import { GoArrowLeft } from 'react-icons/go';
import { FiDownload, FiEdit2 } from 'react-icons/fi'; // Add FiEdit2 import
import FrameDetailsPopup from './FrameDetailsPopup';
import ConfirmationPopup from './ConfirmationPopup';

// Keep the metadata-only interface but rename props to match original
interface FrameMetadata {
  frame_id: string;
  frame_idx: number;
  timestamp: number;
  custom_name?: string;
  created_at: string;
  thumbnail_url: string;
  isBaseline: boolean;
}

interface SavedFramesProps {
  frameMetadata: FrameMetadata[]; // New data structure
  baselineFrameId: string | null;
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

// Add character limit constant at the top of the file
const MAX_FRAME_NAME_LENGTH = 20;

const SavedFrames: React.FC<SavedFramesProps> = ({
  frameMetadata, // Use new data structure
  baselineFrameId,
  showBackButton = true,
  backButtonText = "Back to Video Upload", // Updated default text
  onBack,
  onExport,
  formatTime,
  className = "",
  onRenameFrame,
  onSetBaseline,
  onDeleteFrame,
  isExporting = false,
}) => {
  const [renamingFrameId, setRenamingFrameId] = useState<string | null>(null);
  const [newFrameName, setNewFrameName] = useState<string>("");
  
  // Add state for frame details popup
  const [showFrameDetails, setShowFrameDetails] = useState(false);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  
  // Add state for back confirmation
  const [showBackConfirmation, setShowBackConfirmation] = useState(false);

  const handleRename = (frame: FrameMetadata) => {
    setRenamingFrameId(frame.frame_id);
    setNewFrameName(frame.custom_name || `Frame ${frame.frame_idx}`);
  };

  const handleSaveRename = (frameId: string) => {
    // Trim whitespace and validate length
    const trimmedName = newFrameName.trim();
    
    if (trimmedName.length === 0) {
      // Don't save empty names, revert to original
      setRenamingFrameId(null);
      setNewFrameName("");
      return;
    }
    
    if (trimmedName.length > MAX_FRAME_NAME_LENGTH) {
      alert(`Frame name cannot exceed ${MAX_FRAME_NAME_LENGTH} characters`);
      return;
    }
    
    if (onRenameFrame && trimmedName) {
      onRenameFrame(frameId, trimmedName);
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
  
  // Add handler for double-click on frame - now uses frameId for on-demand fetching
  const handleFrameDoubleClick = (frame: FrameMetadata) => {
    setSelectedFrameId(frame.frame_id);
    setShowFrameDetails(true);
  };

  // Handle back button click with confirmation
  const handleBackClick = () => {
    setShowBackConfirmation(true);
  };

  // Handle confirmed back navigation
  const handleConfirmBack = async () => {
    try {
      // Clear the session when going back to upload
      await fetch('http://localhost:8000/session/clear', { method: 'POST' });
    } catch (error) {
      console.error('Error clearing session:', error);
    }
    
    setShowBackConfirmation(false);
    if (onBack) {
      onBack();
    }
  };

  const handleCancelBack = () => {
    setShowBackConfirmation(false);
  };

  return (
    <div className={`w-80 flex flex-col gap-4 flex-shrink-0 ${className}`}>
      {/* Back Button */}
      {showBackButton && (
        <button 
          onClick={handleBackClick}
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
            {frameMetadata.map((frame) => (
              <div 
                key={frame.frame_id} 
                className="bg-gray-700 rounded-lg border border-gray-600 p-3 flex gap-3 flex-shrink-0 group cursor-pointer transition-all duration-200 hover:bg-gray-600 hover:border-blue-500 hover:shadow-md hover:shadow-blue-500/20 hover:translate-x-1 relative"
                onDoubleClick={() => handleFrameDoubleClick(frame)}
                title="Double-click to view details"
              >
                {/* Edit button in top-right corner - only show when NOT renaming */}
                {onRenameFrame && renamingFrameId !== frame.frame_id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRename(frame);
                    }}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-400 hover:text-blue-400 p-1 rounded-full hover:bg-gray-600/50 z-10"
                    title="Rename frame"
                  >
                    <FiEdit2 size={12} />
                  </button>
                )}

                {frame.thumbnail_url && (
                  <img 
                    src={frame.thumbnail_url} 
                    alt={frame.custom_name || `Frame ${frame.frame_idx}`}
                    className="w-15 h-11 rounded object-cover flex-shrink-0 group-hover:ring-2 group-hover:ring-blue-400 transition-all duration-200"
                  />
                )}
                
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex items-center gap-2">
                    {frame.isBaseline && (
                      <div className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0 group-hover:scale-125 transition-transform duration-200"></div>
                    )}
                    
                    {/* Frame Name - Simplified layout */}
                    {renamingFrameId === frame.frame_id ? (
                      <div className="flex-1 flex flex-col gap-1">
                        <input
                          type="text"
                          value={newFrameName}
                          onChange={(e) => {
                            // Limit input to maximum length
                            if (e.target.value.length <= MAX_FRAME_NAME_LENGTH) {
                              setNewFrameName(e.target.value);
                            }
                          }}
                          onKeyDown={(e) => handleKeyPress(e, frame.frame_id)}
                          onBlur={() => handleSaveRename(frame.frame_id)}
                          className="w-full bg-gray-600 text-white text-sm px-2 py-1 rounded border border-blue-500 focus:outline-none focus:border-blue-400"
                          placeholder={`Max ${MAX_FRAME_NAME_LENGTH} characters`}
                          maxLength={MAX_FRAME_NAME_LENGTH}
                          autoFocus
                        />
                        <div className="text-xs text-gray-400 text-right">
                          {newFrameName.length}/{MAX_FRAME_NAME_LENGTH}
                        </div>
                      </div>
                    ) : (
                      <span className="font-medium text-white text-sm truncate flex-1 min-w-0">
                        {frame.custom_name || `Frame ${frame.frame_idx}`}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatTime(frame.timestamp)}
                  </div>
                  <div className="text-xs text-gray-400">
                    Frame: {frame.frame_idx}
                  </div>
                </div>

                {/* Double-click indicator that appears on hover */}
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-70 transition-opacity duration-200 text-xs text-blue-300 bg-gray-800/70 px-2 py-1 rounded-full">
                  Double-click
                </div>
              </div>
            ))}
            {frameMetadata.length === 0 && (
              <div className="text-center text-gray-500 italic py-8">
                No frames captured yet
              </div>
            )}
          </div>
        </div>
        
        {/* Action Buttons - Remove the "Back to Upload" button, keep only Export */}
        <div className="p-4 border-t border-gray-700">
          <button 
            onClick={onExport}
            disabled={isExporting || frameMetadata.length === 0}
            className={`w-full border-none rounded-lg px-4 py-3 text-sm cursor-pointer transition-colors duration-200 flex items-center justify-center gap-2 ${
              isExporting || frameMetadata.length === 0
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
      
      {/* Frame Details Popup - Updated to use new data fetching system */}
      {selectedFrameId && (
        <FrameDetailsPopup
          isOpen={showFrameDetails}
          onClose={() => setShowFrameDetails(false)}
          frameId={selectedFrameId} // Pass frameId for on-demand fetching
          baselineFrameId={baselineFrameId}
          formatTime={formatTime}
          onSetBaseline={onSetBaseline}
          onDeleteFrame={onDeleteFrame}
          onRenameFrame={onRenameFrame}
        />
      )}

      {/* Back Confirmation Popup */}
      <ConfirmationPopup
        isOpen={showBackConfirmation}
        title="Return to Upload"
        message="Your entire session and all saved frames will be lost. Progress will not be saved until results are exported. Are you sure you want to return to the upload page?"
        confirmButtonText="Return to Upload"
        cancelButtonText="Cancel"
        onConfirm={handleConfirmBack}
        onCancel={handleCancelBack}
      />
    </div>
  );
};

export default SavedFrames;
