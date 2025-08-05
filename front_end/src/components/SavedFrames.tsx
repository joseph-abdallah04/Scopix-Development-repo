import React, { useState } from 'react';
import { GoArrowLeft } from 'react-icons/go';
import { FiDownload, FiEdit2 } from 'react-icons/fi';
import FrameDetailsPopup from './FrameDetailsPopup';
import ConfirmationPopup from './ConfirmationPopup';
import { useTheme } from '../contexts/theme-context';

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
  frameMetadata,
  baselineFrameId,
  showBackButton = true,
  backButtonText = "Back to Video Upload",
  onBack,
  onExport,
  formatTime,
  className = "",
  onRenameFrame,
  onSetBaseline,
  onDeleteFrame,
  isExporting = false,
}) => {
  const { isDarkMode } = useTheme();
  
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
          className={`rounded-2xl px-6 py-3 cursor-pointer transition-colors duration-200 flex items-center justify-center gap-2 w-full ${
            isDarkMode 
              ? 'bg-[#232a36] text-white hover:bg-gray-700' 
              : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
        >
          <GoArrowLeft className="flex-shrink-0" />
          <span className="text-center">{backButtonText}</span>
        </button>
      )}
      
      {/* Frames Container - Fixed size */}
      <div className={`flex flex-col rounded-xl border shadow-lg transition-colors duration-300 h-[800px] ${
        isDarkMode 
          ? 'bg-zinc-900 border-gray-700' 
          : 'bg-gray-300 border-gray-600'
      }`}>
        {/* Header - CENTERED text */}
        <div className={`p-4 border-b flex items-center justify-center transition-colors duration-300 mx-4 ${
          isDarkMode 
            ? 'border-gray-700' 
            : 'border-gray-500'
        }`}>
          <h2 className={`text-lg font-medium transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Saved Frames
          </h2>
        </div>
        
        {/* Content area - FIXED HEIGHT with scroll */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-3">
            {frameMetadata.map((frame) => (
              <div
                key={frame.frame_id}
                className={`group relative rounded-lg border p-3 cursor-pointer transition-all duration-200 hover:shadow-md flex items-center gap-3 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 hover:bg-gray-650' 
                    : 'bg-gray-200 border-gray-400 hover:bg-gray-100'
                } ${frame.isBaseline ? (isDarkMode ? 'ring-2 ring-yellow-500' : 'ring-2 ring-yellow-600') : ''}`}
                onDoubleClick={() => handleFrameDoubleClick(frame)}
              >
                {/* Edit button */}
                {onRenameFrame && renamingFrameId !== frame.frame_id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRename(frame);
                    }}
                    className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-full z-10 ${
                      isDarkMode 
                        ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-600/50' 
                        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-300/50'
                    }`}
                    title="Rename frame"
                  >
                    <FiEdit2 size={12} />
                  </button>
                )}

                {/* Thumbnail */}
                {frame.thumbnail_url && (
                  <img 
                    src={frame.thumbnail_url} 
                    alt={frame.custom_name || `Frame ${frame.frame_idx}`}
                    className="w-15 h-11 rounded object-cover flex-shrink-0 group-hover:ring-2 group-hover:ring-blue-400 transition-all duration-200"
                  />
                )}
                
                {/* Frame content - HORIZONTAL layout next to thumbnail */}
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {frame.isBaseline && (
                      <div className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0 group-hover:scale-125 transition-transform duration-200"></div>
                    )}
                    
                    {/* Frame Name */}
                    {renamingFrameId === frame.frame_id ? (
                      <div className="flex-1 flex flex-col gap-1">
                        <input
                          type="text"
                          value={newFrameName}
                          onChange={(e) => {
                            if (e.target.value.length <= MAX_FRAME_NAME_LENGTH) {
                              setNewFrameName(e.target.value);
                            }
                          }}
                          onKeyDown={(e) => handleKeyPress(e, frame.frame_id)}
                          onBlur={() => handleSaveRename(frame.frame_id)}
                          className={`w-full text-sm px-2 py-1 rounded border focus:outline-none ${
                            isDarkMode 
                              ? 'bg-gray-600 text-white border-blue-500 focus:border-blue-400' 
                              : 'bg-white text-gray-800 border-gray-400 focus:border-blue-400'
                          }`}
                          placeholder={`Max ${MAX_FRAME_NAME_LENGTH} characters`}
                          maxLength={MAX_FRAME_NAME_LENGTH}
                          autoFocus
                        />
                        <div className={`text-xs text-right ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {newFrameName.length}/{MAX_FRAME_NAME_LENGTH}
                        </div>
                      </div>
                    ) : (
                      <span className={`font-medium text-sm truncate flex-1 min-w-0 ${
                        isDarkMode ? 'text-white' : 'text-gray-800'
                      }`}>
                        {frame.custom_name || `Frame ${frame.frame_idx}`}
                      </span>
                    )}
                  </div>
                  <div className={`text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {formatTime(frame.timestamp)}
                  </div>
                  <div className={`text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Frame: {frame.frame_idx}
                  </div>
                </div>

                {/* Double-click indicator */}
                <div className={`absolute bottom-2 right-2 opacity-0 group-hover:opacity-70 transition-opacity duration-200 text-xs px-2 py-1 rounded-full ${
                  isDarkMode 
                    ? 'text-blue-300 bg-gray-800/70' 
                    : 'text-blue-600 bg-gray-300/80'
                }`}>
                  Double-click
                </div>
              </div>
            ))}
            {frameMetadata.length === 0 && (
              <div className={`text-center italic py-8 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-500'
              }`}>
                No frames captured yet
              </div>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className={`p-4 border-t transition-colors duration-300 mx-4 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-500'
        }`}>
          <button 
            onClick={onExport}
            disabled={isExporting || frameMetadata.length === 0}
            className={`w-full border-none rounded-lg px-4 py-3 text-sm cursor-pointer transition-colors duration-200 flex items-center justify-center gap-2 ${
              isExporting || frameMetadata.length === 0
                ? (isDarkMode ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gray-400 text-gray-600 cursor-not-allowed')
                : (isDarkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white')
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
      
      {/* Popups remain unchanged */}
      {selectedFrameId && (
        <FrameDetailsPopup
          isOpen={showFrameDetails}
          onClose={() => setShowFrameDetails(false)}
          frameId={selectedFrameId}
          baselineFrameId={baselineFrameId}
          formatTime={formatTime}
          onSetBaseline={onSetBaseline}
          onDeleteFrame={onDeleteFrame}
          onRenameFrame={onRenameFrame}
        />
      )}

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
