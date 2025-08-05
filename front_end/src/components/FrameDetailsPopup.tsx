import React, { useState, useEffect } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import ConfirmationPopup from './ConfirmationPopup';
import { calculateAllBaselineComparisons, type FullFrameData, type BaselineComparison } from '../utils/baselineCalculations';

interface FrameDetailsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  frameId: string;
  baselineFrameId: string | null;
  formatTime: (time: number) => string;
  onSetBaseline?: (frameId: string) => void;
  onDeleteFrame?: (frameId: string) => void;
  onRenameFrame?: (frameId: string, newName: string) => void;
}

const FrameDetailsPopup: React.FC<FrameDetailsPopupProps> = ({
  isOpen,
  onClose,
  frameId,
  baselineFrameId,
  formatTime,
  onSetBaseline,
  onDeleteFrame,
  onRenameFrame
}) => {
  const [currentFrameData, setCurrentFrameData] = useState<FullFrameData | null>(null);
  const [baselineFrameData, setBaselineFrameData] = useState<FullFrameData | null>(null);
  const [baselineComparisons, setBaselineComparisons] = useState<Record<string, BaselineComparison | null> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Fetch frame data when popup opens
  useEffect(() => {
    if (!isOpen || !frameId) return;
    
    const fetchFrameData = async () => {
      setIsLoading(true);
      try {
        // Fetch current frame data
        const currentResponse = await fetch(`http://localhost:8000/session/frame-details/${frameId}`);
        if (!currentResponse.ok) throw new Error('Failed to fetch frame details');
        const currentData = await currentResponse.json();
        setCurrentFrameData(currentData);
        
        // Fetch baseline data if needed and different from current
        if (baselineFrameId && baselineFrameId !== frameId) {
          const baselineResponse = await fetch(`http://localhost:8000/session/frame-details/${baselineFrameId}`);
          if (baselineResponse.ok) {
            const baselineData = await baselineResponse.json();
            setBaselineFrameData(baselineData);
            
            // Calculate comparisons
            const comparisons = calculateAllBaselineComparisons(currentData, baselineData);
            setBaselineComparisons(comparisons);
          }
        } else {
          setBaselineFrameData(null);
          setBaselineComparisons(null);
        }
      } catch (error) {
        console.error('Error fetching frame data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFrameData();
  }, [isOpen, frameId, baselineFrameId]);

  // Clear data when popup closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentFrameData(null);
      setBaselineFrameData(null);
      setBaselineComparisons(null);
    }
  }, [isOpen]);

  if (!isOpen || !currentFrameData) return null;

  // Handle setting this frame as baseline
  const handleSetBaseline = async () => {
    if (onSetBaseline && currentFrameData) {
      await onSetBaseline(currentFrameData.frame_id);
    }
  };

  // Add delete handlers
  const handleDeleteClick = () => {
    setShowDeleteConfirmation(true);
  };

  const handleConfirmDelete = () => {
    if (onDeleteFrame && currentFrameData) {
      onDeleteFrame(currentFrameData.frame_id);
    }
    setShowDeleteConfirmation(false);
    onClose();
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false);
  };

  const isBaseline = baselineFrameId === currentFrameData.frame_id;

  // Helper function to render value with baseline comparison
  const renderValueWithBaseline = (
    value: number | null | undefined,
    unit: string,
    comparisonKey: string
  ) => {
    const comparison = baselineComparisons?.[comparisonKey];
    
    return (
      <div>
        <div className="text-sm text-white">
          {value != null ? `${value.toFixed(3)}${unit}` : 'Not calculated'}
        </div>
        
        {/* Baseline comparison */}
        {!isBaseline && comparison && (
          <div className="text-xs mt-1 space-y-0.5">
            <div className="text-blue-300">
              % of Baseline: {comparison.percentOfBaseline.toFixed(1)}%
            </div>
            <div className={`${comparison.percentChangeFromBaseline >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              % Change: {comparison.percentChangeFromBaseline >= 0 ? '+' : ''}{comparison.percentChangeFromBaseline.toFixed(1)}%
            </div>
          </div>
        )}
        
        {isBaseline && (
          <div className="text-xs text-blue-400 mt-1">
            This is the baseline frame
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        onClick={onClose}
      >
        <div 
          className="bg-[#232a36]/90 backdrop-blur rounded-2xl p-6 shadow-lg border border-gray-500/30 max-w-lg w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">
              {currentFrameData.custom_name || `Frame ${currentFrameData.frame_idx}`}
              {isBaseline && (
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
            <div className="flex-shrink-0">
              <img 
                src={`http://localhost:8000/session/frame-thumbnail/${currentFrameData.frame_id}`}
                alt={currentFrameData.custom_name || `Frame ${currentFrameData.frame_idx}`}
                className="w-24 h-18 rounded object-cover border border-gray-600"
              />
            </div>
            
            {/* Frame info */}
            <div className="flex flex-col justify-center text-sm text-gray-300">
              <div>Frame: {currentFrameData.frame_idx}</div>
              <div>Time: {formatTime(currentFrameData.timestamp)}</div>
            </div>
          </div>

          <div className="space-y-4">
            {/* 1. Distance Ratios Section */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Distance Ratios</h3>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-400">Distance Ratio 1</div>
                    {renderValueWithBaseline(currentFrameData.formulas?.distance_ratio_1, '', 'distance_ratio_1')}
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Distance Ratio 2</div>
                    {renderValueWithBaseline(currentFrameData.formulas?.distance_ratio_2, '', 'distance_ratio_2')}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <div className="text-xs text-gray-400">Distance Ratio 3</div>
                    {renderValueWithBaseline(currentFrameData.formulas?.distance_ratio_3, '', 'distance_ratio_3')}
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Distance Ratio 4</div>
                    {renderValueWithBaseline(currentFrameData.formulas?.distance_ratio_4, '', 'distance_ratio_4')}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. P-Factor Section */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">P-Factor</h3>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">Area A / Distance A</div>
                {renderValueWithBaseline(currentFrameData.formulas?.p_factor, '', 'p_factor')}
              </div>
            </div>

            {/* 3. C-Factor Section */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">C-Factor</h3>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">Area BV / (Area AV + Area BV)</div>
                {renderValueWithBaseline(currentFrameData.formulas?.c_factor, '', 'c_factor')}
              </div>
            </div>

            {/* 4. Supraglottic Area Ratios Section - NEW */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Supraglottic Area Ratios</h3>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Supraglottic Area Ratio 1</div>
                    <div className="text-xs text-gray-500 mb-1">Area B / Distance A</div>
                    {renderValueWithBaseline(currentFrameData.formulas?.supraglottic_area_ratio_1, '', 'supraglottic_area_ratio_1')}
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Supraglottic Area Ratio 2</div>
                    <div className="text-xs text-gray-500 mb-1">Area B / (Distance A + Distance C)</div>
                    {renderValueWithBaseline(currentFrameData.formulas?.supraglottic_area_ratio_2, '', 'supraglottic_area_ratio_2')}
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Angle Measurements Section - update the number */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Angle Measurements</h3>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-400">Angle A</div>
                    {renderValueWithBaseline(currentFrameData.measurements?.angle_a, '°', 'angle_a')}
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Angle B</div>
                    {renderValueWithBaseline(currentFrameData.measurements?.angle_b, '°', 'angle_b')}
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
                disabled={isBaseline}
                className={`text-sm cursor-pointer transition-colors duration-200 px-3 py-2 rounded-lg border-none ${
                  isBaseline
                    ? 'bg-yellow-500/20 text-yellow-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isBaseline ? 'Current Baseline' : 'Set as Baseline'}
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

      {/* Delete Confirmation */}
      <ConfirmationPopup
        isOpen={showDeleteConfirmation}
        title="Delete Frame"
        message={`Are you sure you want to delete "${currentFrameData?.custom_name || `Frame ${currentFrameData?.frame_idx}`}"? This action cannot be undone.`}
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
};

export default FrameDetailsPopup;
