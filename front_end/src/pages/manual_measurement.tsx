import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GoArrowLeft } from "react-icons/go";
import MeasurementHeader from '../components/MeasurementHeader';
import MeasurementToolsPanel from '../components/MeasurementToolsPanel';
import MeasurementLayout from '../components/MeasurementLayout';
import ConfirmationPopup from '../components/ConfirmationPopup';
import { useUndoRedo } from '../hooks/useUndoRedo';

interface AngleMeasurement {
  angle: number;
  points: number[][];
}

interface AreaMeasurement {
  area_pixels: number;
  perimeter_pixels: number;
  method: string;
  point_count: number;
  area_mm2?: number;
  perimeter_mm?: number;
  centroid?: number[];
  bbox?: number[];
  eccentricity?: number;
  solidity?: number;
}

interface DistanceMeasurement {
  horizontal_distance: number;
  vertical_distance: number;
  ratio_percentage: number; // (x/y) * 100
  horizontal_points: number[][];
  vertical_points: number[][];
}

interface Measurements {
  glottic?: AngleMeasurement;
  supraglottic?: AngleMeasurement;
  glottic_area?: AreaMeasurement;
  supraglottic_area?: AreaMeasurement;
  distance_ratio?: DistanceMeasurement; // Add the new measurement type
}

interface MeasurementState {
  measurements: Measurements;
  currentPoints: number[][];
  // Add context for better undo/redo
  activeToolType?: 'angle' | 'area' | 'distance';
  activeToolSubtype?: 'glottic' | 'supraglottic' | 'glottic_area' | 'supraglottic_area' | 'distance_ratio';
}

function ManualMeasurement() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const frameData = location.state?.frameData;
  const [frameImageUrl, setFrameImageUrl] = useState<string | null>(null);
  const [showBackConfirmation, setShowBackConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Simple state management - no memo, no complex optimization
  const [selectedAngleType, setSelectedAngleType] = useState<'glottic' | 'supraglottic' | null>(null);
  const [selectedAreaType, setSelectedAreaType] = useState<'glottic_area' | 'supraglottic_area' | null>(null);
  const [selectedDistanceType, setSelectedDistanceType] = useState<'distance_ratio' | null>(null);
  const [distanceMeasurementStep, setDistanceMeasurementStep] = useState<'horizontal' | 'vertical' | null>(null);
  const [horizontalPoints, setHorizontalPoints] = useState<number[][]>([]);

  const initialState: MeasurementState = {
    measurements: {},
    currentPoints: [],
    activeToolType: undefined,
    activeToolSubtype: undefined
  };

  const {
    state: measurementState,
    set: setMeasurementState,
    reset: resetMeasurementState,
    undo,
    redo,
    canUndo,
    canRedo
  } = useUndoRedo<MeasurementState>(initialState);

  const { measurements, currentPoints } = measurementState;

  console.log('🎯 PARENT RENDER - manual_measurement with state:', {
    selectedAngleType,
    selectedAreaType,
    currentPointsLength: currentPoints.length
  });

  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    
    console.log('🔄 Performing undo');
    undo();
  }, [undo, canUndo]);

  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    
    console.log('🔄 Performing redo');
    redo();
  }, [redo, canRedo]);

  // Add this useEffect to handle tool restoration automatically
  useEffect(() => {
    const { currentPoints, activeToolType, activeToolSubtype } = measurementState;
    
    console.log('🔄 State changed, checking tool restoration:', {
      currentPointsLength: currentPoints?.length || 0,
      activeToolType,
      activeToolSubtype
    });
    
    // Only restore tools if we have points and tool context
    if (currentPoints && currentPoints.length > 0 && activeToolType && activeToolSubtype) {
      console.log('🔄 Auto-restoring tool state:', { activeToolType, activeToolSubtype });
      
      if (activeToolType === 'angle') {
        // For angle tools: only reselect if we have less than 3 points
        if (currentPoints.length < 3) {
          setSelectedAngleType(activeToolSubtype as 'glottic' | 'supraglottic');
          setSelectedAreaType(null);
          setSelectedDistanceType(null);
        } else {
          console.log('🔄 Not reselecting angle tool - 3 points already exist');
          setSelectedAngleType(null);
          setSelectedAreaType(null);
          setSelectedDistanceType(null);
        }
      } else if (activeToolType === 'area') {
        setSelectedAreaType(activeToolSubtype as 'glottic_area' | 'supraglottic_area');
        setSelectedAngleType(null);
        setSelectedDistanceType(null);
      } else if (activeToolType === 'distance') {
        // Distance tools - only reselect if we have less than 4 points (incomplete measurement)
        if (currentPoints.length < 4) {
          setSelectedDistanceType(activeToolSubtype as 'distance_ratio');
          setSelectedAngleType(null);
          setSelectedAreaType(null);
          
          // Update measurement step based on current points
          if (currentPoints.length <= 2) {
            setDistanceMeasurementStep('horizontal');
          } else if (currentPoints.length <= 4) {
            setDistanceMeasurementStep('vertical');
          }
        } else {
          console.log('🔄 Not reselecting distance tool - 4 points already exist (measurement complete)');
          setSelectedDistanceType(null);
          setSelectedAngleType(null);
          setSelectedAreaType(null);
          setDistanceMeasurementStep(null);
        }
      }
    } else if (!currentPoints || currentPoints.length === 0) {
      // Only clear tools if no points AND no active tool context
      if (!activeToolType && !activeToolSubtype) {
        console.log('🔄 Clearing tools - no points and no active context');
        setSelectedAngleType(null);
        setSelectedAreaType(null);
        setSelectedDistanceType(null);
        setDistanceMeasurementStep(null);
      }
    }
  }, [measurementState]); // React to any measurementState changes

  // Handle angle type selection - SIMPLIFIED
  const handleAngleTypeSelect = (type: 'glottic' | 'supraglottic' | null) => {
    console.log('🎯 PARENT - Angle type selected:', type);
    setSelectedAngleType(type);
    setSelectedAreaType(null);
    setSelectedDistanceType(null);
    
    // Update state with tool context using set method
    setMeasurementState({
      ...measurementState,
      currentPoints: [],
      activeToolType: type ? 'angle' : undefined,
      activeToolSubtype: type || undefined
    });
  };

  // Handle area type selection - SIMPLIFIED
  const handleAreaTypeSelect = (type: 'glottic_area' | 'supraglottic_area' | null) => {
    console.log('🎯 PARENT - Area type selected:', type);
    setSelectedAreaType(type);
    setSelectedAngleType(null);
    setSelectedDistanceType(null);
    
    // Update state with tool context using set method
    setMeasurementState({
      ...measurementState,
      currentPoints: [],
      activeToolType: type ? 'area' : undefined,
      activeToolSubtype: type || undefined
    });
  };

  // Handle distance type selection
  const handleDistanceTypeSelect = (type: 'distance_ratio' | null) => {
    console.log('🎯 PARENT - Distance type selected:', type);
    setSelectedDistanceType(type);
    setSelectedAngleType(null);
    setSelectedAreaType(null);
    
    if (type) {
      setDistanceMeasurementStep('horizontal');
      setMeasurementState({
        ...measurementState,
        currentPoints: [],
        activeToolType: 'distance',
        activeToolSubtype: type
      });
    } else {
      setDistanceMeasurementStep(null);
      setMeasurementState({
        ...measurementState,
        currentPoints: [],
        activeToolType: undefined,
        activeToolSubtype: undefined
      });
    }
  };

  // Prevent context menu on right-click
  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
  };

  // Updated click handler to handle distance measurements with persistent points
  const handleImageClick = async (event: React.MouseEvent<HTMLImageElement>) => {
    console.log('🖱️ Image clicked!');
    
    if (event.button !== 0) return;
    
    if (!selectedAngleType && !selectedAreaType && !selectedDistanceType) {
      console.log('❌ No measurement type selected - returning early');
      return;
    }

    // Get click position
    const imgRect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - imgRect.left;
    const clickY = event.clientY - imgRect.top;
    const x = clickX;
    const y = clickY;
    
    // Bounds check
    if (x < 0 || x > imgRect.width || y < 0 || y > imgRect.height) {
      console.log('❌ Click outside image bounds');
      return;
    }
    
    const newPoints = [...currentPoints, [x, y]];
    console.log('📍 New points:', newPoints);
    
    // Handle distance measurements with persistent points
    if (selectedDistanceType) {
      // Update points immediately - all points stay visible
      setMeasurementState({
        ...measurementState,
        currentPoints: newPoints,
        activeToolType: 'distance',
        activeToolSubtype: selectedDistanceType
      });
      
      // Update the measurement step based on point count
      if (newPoints.length <= 2) {
        setDistanceMeasurementStep('horizontal');
      } else if (newPoints.length <= 4) {
        setDistanceMeasurementStep('vertical');
      }
      
      // Auto-calculate when we have all 4 points
      if (newPoints.length === 4) {
        const horizontalPts = [newPoints[0], newPoints[1]];
        const verticalPts = [newPoints[2], newPoints[3]];
        await handleCalculateDistanceRatio(horizontalPts, verticalPts);
      }
      
      return;
    }

    // Update current points WITH tool context preservation using the `set` method
    const newState = {
      ...measurementState,
      currentPoints: newPoints,
      // Preserve tool context for undo/redo
      activeToolType: selectedAngleType ? 'angle' as const : 'area' as const,
      activeToolSubtype: (selectedAngleType || selectedAreaType) as any
    };
    
    console.log('💾 Saving state for undo:', newState);
    setMeasurementState(newState);

    // Handle angle measurement (3 points)
    if (selectedAngleType && newPoints.length === 3) {
      console.log('📐 3 points reached, calculating angle...');
      try {
        setIsLoading(true);
        const response = await fetch('http://0.0.0.0:8000/measure/angle', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            points: newPoints
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to calculate angle');
        }

        const result = await response.json();
        console.log('📐 Angle calculation result:', result);
        
        // Update measurements using set method
        setMeasurementState({
          measurements: {
            ...measurements,
            [selectedAngleType]: {
              angle: result.angle,
              points: newPoints
            }
          },
          currentPoints: [],
          // Clear tool context when measurement is complete
          activeToolType: undefined,
          activeToolSubtype: undefined
        });
        
        // Clear tool selection
        setSelectedAngleType(null);
        
      } catch (error) {
        console.error('❌ Error calculating angle:', error);
        alert('Failed to calculate angle. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Wrap handleFinishAreaMeasurement in useCallback
  const handleFinishAreaMeasurement = useCallback(async () => {
    if (!selectedAreaType || currentPoints.length < 3) {
      return;
    }

    console.log('⌨️ Enter key pressed, calculating area...');
    try {
      setIsLoading(true);
      const response = await fetch('http://0.0.0.0:8000/measure/area', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          points: currentPoints,
          method: 'scikit'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate area');
      }

      const result = await response.json();
      console.log('📐 Area calculation result:', result);
      
      // Update measurements
      setMeasurementState({
        measurements: {
          ...measurements,
          [selectedAreaType]: result
        },
        currentPoints: [],
        // Clear tool context when measurement is complete
        activeToolType: undefined,
        activeToolSubtype: undefined
      });
      
      // Clear tool selection
      setSelectedAreaType(null);
      
    } catch (error) {
      console.error('❌ Error calculating area:', error);
      alert('Failed to calculate area. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedAreaType, currentPoints, measurements, setMeasurementState]);

  // Updated function to calculate distance ratio
  const handleCalculateDistanceRatio = async (horizontalPts: number[][], verticalPts: number[][]) => {
    try {
      setIsLoading(true);
      const response = await fetch('http://0.0.0.0:8000/measure/distance-ratio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          horizontal_points: horizontalPts,
          vertical_points: verticalPts
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate distance ratio');
      }

      const result = await response.json();
      console.log('📏 Distance ratio calculation result:', result);
      
      // Update measurements and clear points
      setMeasurementState({
        measurements: {
          ...measurements,
          distance_ratio: result
        },
        currentPoints: [],
        activeToolType: undefined,
        activeToolSubtype: undefined
      });
      
      // Clear tool selection and reset state
      setSelectedDistanceType(null);
      setDistanceMeasurementStep(null);
      
    } catch (error) {
      console.error('❌ Error calculating distance ratio:', error);
      alert('Failed to calculate distance ratio. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setShowBackConfirmation(true);
  };

  const handleConfirmBack = () => {
    navigate('/video-analysis', {
      state: {
        resumeAtFrame: frameData?.frameIdx,
        resumeAtTimestamp: frameData?.timestamp
      }
    });
  };

  const handleCancelBack = () => {
    setShowBackConfirmation(false);
  };

  // ✅ UPDATED: Enhanced saveMeasurements to handle canvas frames
  const saveMeasurements = async () => {
    // Validation check
    if (!measurements.glottic && !measurements.supraglottic && 
        !measurements.glottic_area && !measurements.supraglottic_area &&
        !measurements.distance_ratio) {
      alert('Please measure at least one angle, area, or distance ratio before saving.');
      return;
    }

    try {
      setIsLoading(true);
      console.log('💾 Saving measurements:', measurements);
      console.log('📄 Frame data:', frameData);
      
      // Check if this was a canvas-captured frame
      const isCanvasFrame = frameData?.captureMethod === 'canvas' && frameData?.imageBlob;
      
      if (isCanvasFrame) {
        console.log('🎨 Using canvas-captured frame endpoint');
        
        // Use FormData for canvas frames (includes image blob)
        const formData = new FormData();
        formData.append('timestamp', frameData.timestamp.toString());
        formData.append('frame_idx', frameData.frameIdx.toString());
        formData.append('measurements', JSON.stringify(measurements));
        formData.append('override_existing', (frameData.overrideExisting || false).toString());
        formData.append('canvas_image', frameData.imageBlob, `frame_${frameData.frameIdx}.png`);
        
        // Add custom name if provided
        if (frameData.customName) {
          formData.append('custom_name', frameData.customName);
        }
        
        const response = await fetch('http://0.0.0.0:8000/session/save-canvas-frame', {
          method: 'POST',
          body: formData  // Don't set Content-Type header - let browser set it with boundary
        });

        if (!response.ok) {
          throw new Error('Failed to save canvas-captured frame');
        }

        const result = await response.json();
        console.log('✅ Canvas frame saved successfully:', result);
        
      } else {
        console.log('📡 Using traditional backend frame endpoint');
        
        // Use traditional JSON endpoint for backend-captured frames
        const response = await fetch('http://0.0.0.0:8000/session/save-measured-frame', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            timestamp: frameData.timestamp,
            frame_idx: frameData.frameIdx,
            measurements: measurements,
            override_existing: frameData.overrideExisting || false
          })
        });

        if (!response.ok) {
          throw new Error('Failed to save measured frame');
        }

        const result = await response.json();
        console.log('✅ Frame saved successfully:', result);
      }
      
      // Navigate back to video analysis
      navigate('/video-analysis', {
        state: {
          resumeAtFrame: frameData?.frameIdx,
          resumeAtTimestamp: frameData?.timestamp,
          frameSaved: true
        }
      });
      
    } catch (error) {
      console.error('❌ Error saving measurements:', error);
      alert('Failed to save measurements. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAll = () => {
    resetMeasurementState(initialState);
    setSelectedAngleType(null);
    setSelectedAreaType(null);
    setSelectedDistanceType(null);
  };

  useEffect(() => {
    if (frameData?.imageBlob) {
      const url = URL.createObjectURL(frameData.imageBlob);
      setFrameImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [frameData]);

  // Keyboard shortcuts - NOW THIS CAN ACCESS THE FUNCTIONS ABOVE
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
      }
      else if (
        ((event.metaKey || event.ctrlKey) && event.key === 'y') ||
        ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'z')
      ) {
        event.preventDefault();
        handleRedo();
      }
      // Handle Enter key for area measurements
      else if (event.key === 'Enter' && selectedAreaType && currentPoints.length >= 3) {
        event.preventDefault();
        handleFinishAreaMeasurement();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAreaType, currentPoints, handleUndo, handleRedo, handleFinishAreaMeasurement]);

  const getStatusText = () => {
    if (selectedAngleType) {
      return `${selectedAngleType}: ${currentPoints.length}/3 points`;
    }
    if (selectedAreaType) {
      return `${selectedAreaType.replace('_', ' ')}: ${currentPoints.length} points${currentPoints.length >= 3 ? ' (press Enter to finish)' : ''}`;
    }
    if (selectedDistanceType) {
      if (currentPoints.length === 0) {
        return `Distance Ratio - Click first horizontal point`;
      } else if (currentPoints.length === 1) {
        return `Distance Ratio - Click second horizontal point`;
      } else if (currentPoints.length === 2) {
        return `Distance Ratio - Click first vertical point`;
      } else if (currentPoints.length === 3) {
        return `Distance Ratio - Click second vertical point`;
      }
    }
    return '';
  };

  if (!frameData) {
    return (
      <div className="w-screen h-screen min-h-screen bg-black text-white flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <p className="text-xl mb-6">No frame data available</p>
          <button 
            onClick={handleBack} 
            className="bg-gray-700 hover:bg-gray-600 text-white border-none rounded-lg px-6 py-3 text-base cursor-pointer transition-colors duration-200 flex items-center gap-2"
          >
            <GoArrowLeft />
            Back to Video Analysis
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <MeasurementHeader
        frameIdx={frameData.frameIdx}
        timestamp={frameData.timestamp}
        onBack={handleBack}
      />

      <MeasurementLayout>
        <div className="flex-1 flex items-center justify-center bg-zinc-900 rounded-xl border border-gray-700 p-4 overflow-hidden relative">
          {frameImageUrl ? (
            <div 
              className="relative overflow-hidden w-full h-full flex items-center justify-center"
              onContextMenu={handleContextMenu}
              style={{
                cursor: (selectedAngleType || selectedAreaType || selectedDistanceType) ? 'crosshair' : 'default'
              }}
            >
              <div className="relative">
                <img 
                  src={frameImageUrl} 
                  alt={`Frame ${frameData.frameIdx} at ${frameData.timestamp.toFixed(3)}s`}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  onClick={handleImageClick}
                  onDragStart={(e) => e.preventDefault()}
                  onContextMenu={handleContextMenu}
                  draggable={false}
                />
                
                {/* Points overlay */}
                {currentPoints.map((point, index) => {
                  let pointColor = 'bg-red-500'; // Default for angles
                  
                  if (selectedAreaType || measurementState.activeToolType === 'area') {
                    pointColor = 'bg-green-500';
                  } else if (selectedDistanceType || measurementState.activeToolType === 'distance') {
                    // First 2 points are horizontal (blue), last 2 are vertical (red)
                    pointColor = index < 2 ? 'bg-blue-500' : 'bg-red-500';
                  }
                  
                  return (
                    <div
                      key={index}
                      className={`absolute w-2 h-2 rounded-full transform -translate-x-1 -translate-y-1 pointer-events-none border border-white shadow-lg z-10 ${pointColor}`}
                      style={{
                        left: point[0],
                        top: point[1],
                        opacity: 0.7,
                      }}
                    />
                  );
                })}
                
                {/* Lines for area measurement */}
                {selectedAreaType && currentPoints.length > 1 && (
                  <svg 
                    className="absolute top-0 left-0 pointer-events-none z-5"
                    style={{ width: '100%', height: '100%' }}
                  >
                    {currentPoints.map((point, index) => {
                      if (index === 0) return null;
                      const prevPoint = currentPoints[index - 1];
                      return (
                        <line
                          key={index}
                          x1={prevPoint[0]}
                          y1={prevPoint[1]}
                          x2={point[0]}
                          y2={point[1]}
                          stroke="green"
                          strokeWidth="3"
                          strokeDasharray="5,5"
                        />
                      );
                    })}
                    {currentPoints.length >= 3 && (
                      <line
                        x1={currentPoints[currentPoints.length - 1][0]}
                        y1={currentPoints[currentPoints.length - 1][1]}
                        x2={currentPoints[0][0]}
                        y2={currentPoints[0][1]}
                        stroke="green"
                        strokeWidth="3"
                        strokeDasharray="5,5"
                      />
                    )}
                  </svg>
                )}

                {/* Lines for distance measurement */}
                {(selectedDistanceType || measurementState.activeToolType === 'distance') && currentPoints.length > 0 && (
                  <svg 
                    className="absolute top-0 left-0 pointer-events-none z-5"
                    style={{ width: '100%', height: '100%' }}
                  >
                    {/* Horizontal line (first 2 points) */}
                    {currentPoints.length >= 2 && (
                      <line
                        x1={currentPoints[0][0]}
                        y1={currentPoints[0][1]}
                        x2={currentPoints[1][0]}
                        y2={currentPoints[1][1]}
                        stroke="blue"
                        strokeWidth="3"
                        strokeDasharray="5,5"
                      />
                    )}
                    
                    {/* Vertical line (points 3 and 4) */}
                    {currentPoints.length >= 4 && (
                      <line
                        x1={currentPoints[2][0]}
                        y1={currentPoints[2][1]}
                        x2={currentPoints[3][0]}
                        y2={currentPoints[3][1]}
                        stroke="red"
                        strokeWidth="3"
                        strokeDasharray="5,5"
                      />
                    )}
                  </svg>
                )}
              </div>
              
              {/* Status indicator */}
              {(selectedAngleType || selectedAreaType || selectedDistanceType || measurementState.activeToolType) && (
                <div className="absolute top-2 left-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm z-20">
                  {getStatusText()}
                </div>
              )}
              
              {isLoading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg z-30">
                  <div className="text-white">
                    {selectedAreaType ? 'Calculating area...' : 
                     selectedAngleType ? 'Calculating angle...' : 
                     selectedDistanceType ? 'Calculating distance ratio...' : 'Processing...'}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <div className="text-lg mb-2">Loading frame...</div>
              <div className="text-sm">Frame {frameData.frameIdx} • {frameData.timestamp.toFixed(3)}s</div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <MeasurementToolsPanel
            measurements={measurements}
            onSave={saveMeasurements}
            onAngleTypeSelect={handleAngleTypeSelect}
            onAreaTypeSelect={handleAreaTypeSelect}
            onDistanceTypeSelect={handleDistanceTypeSelect}
            selectedAngleType={selectedAngleType}
            selectedAreaType={selectedAreaType}
            selectedDistanceType={selectedDistanceType}
            distanceMeasurementStep={distanceMeasurementStep} // Add this line
            onUndo={handleUndo}
            onRedo={handleRedo}
            onClearAll={handleClearAll}
            canUndo={canUndo}
            canRedo={canRedo}
          />
        </div>
      </MeasurementLayout>

      <ConfirmationPopup
        isOpen={showBackConfirmation}
        title="Unsaved Changes"
        message="Your current frame measurements will not be saved. Are you sure you want to go back to video analysis?"
        confirmButtonText="Confirm"
        cancelButtonText="Cancel"
        onConfirm={handleConfirmBack}
        onCancel={handleCancelBack}
      />
    </>
  );
}

export default ManualMeasurement;