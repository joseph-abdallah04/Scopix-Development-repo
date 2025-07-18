import React, { useState, useEffect } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import ConfirmationPopup from './ConfirmationPopup'; // Add this import

// interface MeasurementValue {
//   value: number | null;
//   percentageClosure: number | null;
// }

interface FrameDetailsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  frame: {
    id: string;
    name: string;
    customName?: string;
    timestamp: number;
    frameIdx?: number;
    isBaseline: boolean;
    thumbnailUrl?: string;
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
  } | null;
  baselineFrame: {
    id: string;
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
  } | null;
  formatTime: (time: number) => string;
  onSetBaseline?: (frameId: string) => void;
  onDeleteFrame?: (frameId: string) => void; // Add this prop
}

const FrameDetailsPopup: React.FC<FrameDetailsPopupProps> = ({
  isOpen,
  onClose,
  frame,
  baselineFrame,
  formatTime,
  onSetBaseline,
  onDeleteFrame
}) => {
  // Local state to track the current frame with updated baseline status
  const [currentFrame, setCurrentFrame] = useState(frame);
  
  // Add state for delete confirmation
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Update local frame state when baseline changes
  useEffect(() => {
    if (frame && baselineFrame) {
      // Check if this frame is now the baseline by comparing with baselineFrame
      const isNowBaseline = frame.id === baselineFrame.id;
      
      // Update the frame's isBaseline property if it changed
      if (frame.isBaseline !== isNowBaseline) {
        setCurrentFrame({
          ...frame,
          isBaseline: isNowBaseline
        });
      } else {
        setCurrentFrame(frame);
      }
    } else {
      setCurrentFrame(frame);
    }
  }, [frame, baselineFrame]);

  if (!isOpen || !currentFrame) return null;

  // Calculate percentage closure on-demand
  const calculatePercentageClosure = (current: number | null | undefined, baseline: number | null | undefined): number | null => {
    if (current === null || current === undefined || baseline === null || baseline === undefined || baseline === 0) {
      return null;
    }
    return ((baseline - current) / baseline) * 100;
  };

  // Calculate percentage change for distance ratio
  const calculatePercentageChange = (current: number | null | undefined, baseline: number | null | undefined): number | null => {
    if (current === null || current === undefined || baseline === null || baseline === undefined || baseline === 0) {
      return null;
    }
    return ((current - baseline) / baseline) * 100;
  };

  // Format measurement value with units
  const formatMeasurement = (value: number | null | undefined, isAngle: boolean, unit: string = ''): string => {
    if (value === null || value === undefined) return 'Not measured';
    return isAngle ? `${value.toFixed(1)}°` : `${value.toFixed(1)} ${unit}`;
  };

  // Format percentage closure
  const formatPercentage = (value: number | null): string => {
    if (value === null) return 'N/A';
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Format percentage change
  const formatPercentageChange = (value: number | null): string => {
    if (value === null) return 'N/A';
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Handle setting this frame as baseline
  const handleSetBaseline = async () => {
    if (onSetBaseline && currentFrame) {
      await onSetBaseline(currentFrame.id);
      
      // Immediately update local state to show the button change
      setCurrentFrame({
        ...currentFrame,
        isBaseline: true
      });
    }
  };

  // Add delete handlers
  const handleDeleteClick = () => {
    setShowDeleteConfirmation(true);
  };

  const handleConfirmDelete = () => {
    if (onDeleteFrame && currentFrame) {
      onDeleteFrame(currentFrame.id);
    }
    setShowDeleteConfirmation(false);
    onClose(); // Close the popup after deletion
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false);
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        onClick={onClose}
      >
        <div 
          className="bg-[#232a36]/90 backdrop-blur rounded-2xl p-6 shadow-lg border border-gray-500/30 max-w-lg w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">
              {currentFrame.customName || currentFrame.name}
              {currentFrame.isBaseline && (
                <span className="ml-2 text-xs bg-yellow-500 text-black px-2 py-1 rounded-full font-medium">
                  Baseline
                </span>
              )}
            </h2>
            <div className="flex items-center gap-2">
              {/* Delete Button with Bin Icon */}
              {onDeleteFrame && (
                <button
                  onClick={handleDeleteClick}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-lg transition-colors duration-200"
                  title="Delete Frame"
                >
                  <FiTrash2 size={18} />
                </button>
              )}
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Frame thumbnail and basic info */}
          <div className="flex gap-4 mb-4">
            {/* Thumbnail */}
            {currentFrame.thumbnailUrl && (
              <div className="flex-shrink-0">
                <img 
                  src={currentFrame.thumbnailUrl} 
                  alt={currentFrame.customName || currentFrame.name}
                  className="w-24 h-18 rounded object-cover border border-gray-600"
                />
              </div>
            )}
            
            {/* Frame info */}
            <div className="flex flex-col justify-center text-sm text-gray-300">
              <div>Frame: {currentFrame.frameIdx}</div>
              <div>Time: {formatTime(currentFrame.timestamp)}</div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Angle Measurements</h3>
              <div className="grid grid-cols-2 gap-3 bg-gray-800/50 rounded-lg p-3">
                <div>
                  <div className="text-xs text-gray-400">Glottic Angle</div>
                  <div className="text-sm text-white">
                    {formatMeasurement(currentFrame.measurements.glottic_angle, true)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Percentage Closure</div>
                  <div className={`text-sm ${baselineFrame ? 'text-green-400' : 'text-gray-500'}`}>
                    {baselineFrame 
                      ? formatPercentage(calculatePercentageClosure(currentFrame.measurements.glottic_angle, baselineFrame.measurements.glottic_angle))
                      : 'No baseline set'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Supraglottic Angle</div>
                  <div className="text-sm text-white">
                    {formatMeasurement(currentFrame.measurements.supraglottic_angle, true)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Percentage Closure</div>
                  <div className={`text-sm ${baselineFrame ? 'text-green-400' : 'text-gray-500'}`}>
                    {baselineFrame 
                      ? formatPercentage(calculatePercentageClosure(currentFrame.measurements.supraglottic_angle, baselineFrame.measurements.supraglottic_angle))
                      : 'No baseline set'}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Area Measurements</h3>
              <div className="grid grid-cols-2 gap-3 bg-gray-800/50 rounded-lg p-3">
                <div>
                  <div className="text-xs text-gray-400">Glottic Area</div>
                  <div className="text-sm text-white">
                    {formatMeasurement(currentFrame.measurements.glottic_area, false)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Percentage Closure</div>
                  <div className={`text-sm ${baselineFrame ? 'text-green-400' : 'text-gray-500'}`}>
                    {baselineFrame 
                      ? formatPercentage(calculatePercentageClosure(currentFrame.measurements.glottic_area, baselineFrame.measurements.glottic_area))
                      : 'No baseline set'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Supraglottic Area</div>
                  <div className="text-sm text-white">
                    {formatMeasurement(currentFrame.measurements.supraglottic_area, false)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Percentage Closure</div>
                  <div className={`text-sm ${baselineFrame ? 'text-green-400' : 'text-gray-500'}`}>
                    {baselineFrame 
                      ? formatPercentage(calculatePercentageClosure(currentFrame.measurements.supraglottic_area, baselineFrame.measurements.supraglottic_area))
                      : 'No baseline set'}
                  </div>
                </div>
              </div>
            </div>

            {/* Distance Ratio Measurements - New Section */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Distance Ratio Measurements</h3>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div>
                  <div className="text-xs text-gray-400">Distance Ratio (X/Y)</div>
                  <div className="text-sm text-white">
                    {currentFrame.measurements.distance_ratio ? 
                      formatMeasurement(currentFrame.measurements.distance_ratio.ratio_percentage, false, '%') : 
                      'Not measured'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Percentage Change</div>
                  <div className={`text-sm ${baselineFrame ? 'text-green-400' : 'text-gray-500'}`}>
                    {currentFrame.measurements.distance_ratio ? (
                      baselineFrame && baselineFrame.measurements.distance_ratio ? 
                        formatPercentageChange(calculatePercentageChange(
                          currentFrame.measurements.distance_ratio.ratio_percentage, 
                          baselineFrame.measurements.distance_ratio.ratio_percentage
                        )) : 
                        (currentFrame.isBaseline ? '0.0%' : 'No baseline set')
                    ) : 'Not measured'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-between items-center">
            {/* Set as Baseline button - Bottom left */}
            {onSetBaseline && (
              <button
                onClick={handleSetBaseline}
                disabled={currentFrame.isBaseline}
                className={`text-sm cursor-pointer transition-colors duration-200 px-3 py-2 rounded-lg border-none ${
                  currentFrame.isBaseline
                    ? 'bg-yellow-500/20 text-yellow-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {currentFrame.isBaseline ? 'Current Baseline' : 'Set as Baseline'}
              </button>
            )}
            
            {/* Close button - Bottom right */}
            <button
              onClick={onClose}
              className="bg-gray-700 hover:bg-gray-600 text-white border-none rounded-lg px-4 py-2 text-sm cursor-pointer transition-colors duration-200 ml-auto"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Use the ConfirmationPopup component instead of custom delete confirmation */}
      <ConfirmationPopup
        isOpen={showDeleteConfirmation}
        title="Delete Frame"
        message={`Are you sure you want to delete "${currentFrame?.customName || currentFrame?.name}"? This action cannot be undone.`}
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
};

export default FrameDetailsPopup;
