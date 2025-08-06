import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GoArrowLeft } from "react-icons/go";
import MeasurementHeader from '../components/MeasurementHeader';
import MeasurementToolsPanel from '../components/MeasurementToolsPanel';
import MeasurementLayout from '../components/MeasurementLayout';
import ConfirmationPopup from '../components/ConfirmationPopup';
import { useUndoRedo } from '../hooks/useUndoRedo';
import { useTheme } from '../contexts/theme-context';
import type { Measurements } from '../types/measurements';



interface MeasurementState {
  measurements: Measurements;
  currentPoints: number[][];
  // Add context for better undo/redo - update to use new naming convention
  activeToolType?: 'angle' | 'area' | 'distance';
  activeToolSubtype?: 'angle_a' | 'angle_b' | 'area_a' | 'area_b' | 'area_av' | 'area_bv' | 'distance_ratio' | 'distance_a' | 'distance_c' | 'distance_g' | 'distance_h';
}

function ManualMeasurement() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  
  const frameData = location.state?.frameData;
  const [frameImageUrl, setFrameImageUrl] = useState<string | null>(null);
  const [showBackConfirmation, setShowBackConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Simple state management - no memo, no complex optimization
  const [selectedAngleType, setSelectedAngleType] = useState<'angle_a' | 'angle_b' | null>(null);
  const [selectedAreaType, setSelectedAreaType] = useState<'area_a' | 'area_b' | 'area_av' | 'area_bv' | null>(null);
  const [selectedDistanceType, setSelectedDistanceType] = useState<'distance_ratio' | null>(null);
  const [distanceMeasurementStep, setDistanceMeasurementStep] = useState<'horizontal' | 'vertical' | null>(null);
  // const [horizontalPoints, setHorizontalPoints] = useState<number[][]>([]);

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

  // Add at the top, after other hooks
  const [selectedRawDistanceType, setSelectedRawDistanceType] = useState<'distance_a' | 'distance_c' | 'distance_g' | 'distance_h' | null>(null);

  // Add this function after your other measurement handlers
  const handleRawDistanceToolSelect = (key: 'distance_a' | 'distance_c' | 'distance_g' | 'distance_h' | null) => {
    if (key === null) {
      setSelectedRawDistanceType(null);
      setSelectedAngleType(null);
      setSelectedAreaType(null);
      setSelectedDistanceType(null);
      setDistanceMeasurementStep(null);
      setMeasurementState({
        ...measurementState,
        currentPoints: [],
        activeToolType: undefined,
        activeToolSubtype: undefined,
      });
      return;
    }
    
    setSelectedRawDistanceType(key);
    setSelectedAngleType(null);
    setSelectedAreaType(null);
    setSelectedDistanceType(null);
    setDistanceMeasurementStep(null);
    setMeasurementState({
      ...measurementState,
      currentPoints: [],
      activeToolType: 'distance',
      activeToolSubtype: key,
    });
  };

  // Add this function after your other measurement handlers
  const handleCalculateRawDistance = async (
    points: number[][],
    key: 'distance_a' | 'distance_c' | 'distance_g' | 'distance_h'
  ) => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8000/measure/distance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points }),
      });
      if (!response.ok) throw new Error('Failed to calculate distance');
      const result = await response.json();
      
      console.log('📏 Distance calculation result:', result);
      
      setMeasurementState({
        measurements: {
          ...measurements,
          [key]: result.distance,
        },
        currentPoints: [],
        activeToolType: undefined,
        activeToolSubtype: undefined,
      });
      setSelectedRawDistanceType(null);
    } catch (error) {
      console.error('❌ Error calculating distance:', error);
      alert('Failed to calculate distance. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
          setSelectedAngleType(activeToolSubtype as 'angle_a' | 'angle_b');
          setSelectedAreaType(null);
          setSelectedDistanceType(null);
        } else {
          console.log('🔄 Not reselecting angle tool - 3 points already exist');
          setSelectedAngleType(null);
          setSelectedAreaType(null);
          setSelectedDistanceType(null);
        }
      } else if (activeToolType === 'area') {
        setSelectedAreaType(activeToolSubtype as 'area_a' | 'area_b' | 'area_av' | 'area_bv');
        setSelectedAngleType(null);
        setSelectedDistanceType(null);
      } else if (activeToolType === 'distance') {
        // Distance tools - handle both distance_ratio (4 points) and raw distance (2 points)
        if (activeToolSubtype === 'distance_ratio') {
          // Only reselect if we have less than 4 points (incomplete measurement)
          if (currentPoints.length < 4) {
            setSelectedDistanceType('distance_ratio');
            setSelectedAngleType(null);
            setSelectedAreaType(null);
          }
        } else if (['distance_a', 'distance_c', 'distance_g', 'distance_h'].includes(activeToolSubtype as string)) {
          // Only reselect if we have less than 2 points (incomplete measurement)
          if (currentPoints.length < 2) {
            setSelectedRawDistanceType(activeToolSubtype as 'distance_a' | 'distance_c' | 'distance_g' | 'distance_h');
            setSelectedAngleType(null);
            setSelectedAreaType(null);
            setSelectedDistanceType(null);
          }
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

  // Add useEffect to sync tool selection states with measurementState after undo/redo
  useEffect(() => {
    // When measurementState changes due to undo/redo, sync the tool selection states
    const { activeToolType, activeToolSubtype } = measurementState;
    
    console.log('🔄 Syncing tool states after state change:', { activeToolType, activeToolSubtype });
    
    if (!activeToolType || !activeToolSubtype) {
      // If no active tool in the restored state, deselect all tools
      setSelectedAngleType(null);
      setSelectedAreaType(null);
      setSelectedDistanceType(null);
      setSelectedRawDistanceType(null);
      setDistanceMeasurementStep(null);
    } else {
      // Sync tool selection based on the restored active tool
      if (activeToolType === 'angle') {
        setSelectedAngleType(activeToolSubtype as 'angle_a' | 'angle_b');
        setSelectedAreaType(null);
        setSelectedDistanceType(null);
        setSelectedRawDistanceType(null);
        setDistanceMeasurementStep(null);
      } else if (activeToolType === 'area') {
        setSelectedAngleType(null);
        setSelectedAreaType(activeToolSubtype as 'area_a' | 'area_b' | 'area_av' | 'area_bv');
        setSelectedDistanceType(null);
        setSelectedRawDistanceType(null);
        setDistanceMeasurementStep(null);
      } else if (activeToolType === 'distance') {
        setSelectedAngleType(null);
        setSelectedAreaType(null);
        
        if (activeToolSubtype === 'distance_ratio') {
          setSelectedDistanceType('distance_ratio');
          setSelectedRawDistanceType(null);
          // Set measurement step based on current points
          if (measurementState.currentPoints.length <= 2) {
            setDistanceMeasurementStep('horizontal');
          } else {
            setDistanceMeasurementStep('vertical');
          }
        } else {
          setSelectedDistanceType(null);
          setSelectedRawDistanceType(activeToolSubtype as 'distance_a' | 'distance_c' | 'distance_g' | 'distance_h');
          setDistanceMeasurementStep(null);
        }
      }
    }
  }, [measurementState.activeToolType, measurementState.activeToolSubtype, measurementState.currentPoints.length]);

  // Handle angle type selection - SIMPLIFIED
  const handleAngleTypeSelect = (type: 'angle_a' | 'angle_b' | null) => {
    console.log('🎯 PARENT - Angle type selected:', type);
    setSelectedAngleType(type);
    setSelectedAreaType(null);
    setSelectedDistanceType(null);
    setSelectedRawDistanceType(null); // Add this line
    
    // Update state with tool context using set method
    setMeasurementState({
      ...measurementState,
      currentPoints: [],
      activeToolType: type ? 'angle' : undefined,
      activeToolSubtype: type || undefined
    });
  };

  // Handle area type selection - SIMPLIFIED
  const handleAreaTypeSelect = (type: 'area_a' | 'area_b' | 'area_av' | 'area_bv' | null) => {
    console.log('🎯 PARENT - Area type selected:', type);
    setSelectedAreaType(type);
    setSelectedAngleType(null);
    setSelectedDistanceType(null);
    setSelectedRawDistanceType(null); // Add this line
    
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
    setSelectedRawDistanceType(null); // Add this line
    
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
    if (event.button !== 0) return;

    // Only allow clicks if a tool is selected
    if (!selectedAngleType && !selectedAreaType && !selectedDistanceType && !selectedRawDistanceType) {
      return;
    }

    // Get click position
    const imgRect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - imgRect.left;
    const y = event.clientY - imgRect.top;

    if (x < 0 || x > imgRect.width || y < 0 || y > imgRect.height) {
      return;
    }

    // --- RAW DISTANCE TOOL LOGIC ---
    if (
      selectedRawDistanceType &&
      ['distance_a', 'distance_c', 'distance_g', 'distance_h'].includes(selectedRawDistanceType)
    ) {
      // Only allow up to 2 points
      if (currentPoints.length >= 2) {
        setSelectedRawDistanceType(null);
        setMeasurementState({
          ...measurementState,
          currentPoints: [],
          activeToolType: undefined,
          activeToolSubtype: undefined,
        });
        return;
      }

      const key = selectedRawDistanceType as 'distance_a' | 'distance_c' | 'distance_g' | 'distance_h';
      const newPoints = [...currentPoints, [x, y]];
      setMeasurementState({
        ...measurementState,
        currentPoints: newPoints,
        activeToolType: 'distance',
        activeToolSubtype: key,
      });

      // When two points are selected, calculate the distance
      if (newPoints.length === 2) {
        await handleCalculateRawDistance(newPoints, key);
        // Don't call setMeasurementState again here - handleCalculateRawDistance already does it
      }
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
      // Preserve tool context for undo/redo - fix to handle all tool types
      activeToolType: selectedAngleType ? 'angle' as const : 
                       selectedAreaType ? 'area' as const : 
                       (selectedDistanceType || selectedRawDistanceType) ? 'distance' as const : 
                       undefined,
      activeToolSubtype: (selectedAngleType || selectedAreaType || selectedDistanceType || selectedRawDistanceType) as any
    };
    
    console.log('💾 Saving state for undo:', newState);
    setMeasurementState(newState);

    // Handle angle measurement (3 points)
    if (selectedAngleType && newPoints.length === 3) {
      console.log('📐 3 points reached, calculating angle...');
      try {
        setIsLoading(true);
        const response = await fetch('http://localhost:8000/measure/angle', {
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
        
        // Update measurements using set method - store just the angle value
        setMeasurementState({
          measurements: {
            ...measurements,
            [selectedAngleType]: result.angle  // Store just the angle number, not the full object
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
      const response = await fetch('http://localhost:8000/measure/area', {
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
      
      // Update measurements - store just the area_pixels value, not the full object
      setMeasurementState({
        measurements: {
          ...measurements,
          [selectedAreaType]: result.area_pixels  // Store just the area_pixels number, not the full result object
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
      const response = await fetch('http://localhost:8000/measure/distance-ratio', {
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
          // Remove distance_ratio - it's not part of the new measurement system
        },
        currentPoints: [],
        activeToolType: undefined,
        activeToolSubtype: undefined
      });
      
      // Instead, we should handle the distance_ratio differently or remove this functionality
      // Since this appears to be legacy code for the 4-point distance ratio tool
      console.log('Distance ratio calculated:', result);
      
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
    // Build measurements object with all 10 keys
    const measurementsToSave = {
      angle_a: measurements.angle_a || null,
      angle_b: measurements.angle_b || null,
      distance_a: measurements.distance_a || null,
      distance_c: measurements.distance_c || null,
      distance_g: measurements.distance_g || null,
      distance_h: measurements.distance_h || null,
      area_a: measurements.area_a || null,
      area_b: measurements.area_b || null,
      area_av: measurements.area_av || null,
      area_bv: measurements.area_bv || null,
    };

    // Fix the validation check (around lines 567-573)
    // Validation check
    if (!measurementsToSave.angle_a && !measurementsToSave.angle_b && 
        !measurementsToSave.area_a && !measurementsToSave.area_b &&
        !measurementsToSave.area_av && !measurementsToSave.area_bv &&  // ADD THESE TWO
        !measurementsToSave.distance_a && !measurementsToSave.distance_c &&
        !measurementsToSave.distance_g && !measurementsToSave.distance_h) {
      alert('Please measure at least one angle, area, or distance before saving.');
      return;
    }

    try {
      setIsLoading(true);
      console.log('💾 Saving measurements:', measurementsToSave);
      console.log('📄 Frame data:', frameData);
      
      // Check if this was a canvas-captured frame
      const isCanvasFrame = frameData?.captureMethod === 'canvas' && frameData?.imageBlob;
      
      if (isCanvasFrame) {
        console.log('🎨 Using canvas-captured frame endpoint');
        
        // Use FormData for canvas frames (includes image blob)
        const formData = new FormData();
        formData.append('timestamp', frameData.timestamp.toString());
        formData.append('frame_idx', frameData.frameIdx.toString());
        formData.append('measurements', JSON.stringify(measurementsToSave));
        formData.append('override_existing', (frameData.overrideExisting || false).toString());
        formData.append('canvas_image', frameData.imageBlob, `frame_${frameData.frameIdx}.png`);
        
        // Add custom name if provided
        if (frameData.customName) {
          formData.append('custom_name', frameData.customName);
        }
        
        const response = await fetch('http://localhost:8000/session/save-canvas-frame', {
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
        await fetch('http://localhost:8000/session/save-measured-frame', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timestamp: frameData.timestamp,
            frame_idx: frameData.frameIdx,
            measurements: measurementsToSave,
            custom_name: frameData.customName || undefined,
            override_existing: frameData.overrideExisting || false
          })
        });
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
    if (selectedRawDistanceType) {
      return `${selectedRawDistanceType}: ${currentPoints.length}/2 points`;
    }
    return '';
  };

  if (!frameData) {
    return (
      <div className={`w-screen h-screen min-h-screen flex flex-col overflow-hidden transition-colors duration-300 ${
        isDarkMode ? 'bg-black text-white' : 'bg-white text-gray-900'
      }`}>
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <p className="text-xl mb-6">No frame data available</p>
          <button 
            onClick={handleBack} 
            className={`border-none rounded-lg px-6 py-3 text-base cursor-pointer transition-colors duration-200 flex items-center gap-2 ${
              isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-gray-300 hover:bg-gray-400 text-gray-900'
            }`}
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

      <div className={`w-screen h-screen min-h-screen flex flex-col overflow-hidden transition-colors duration-300 ${
        isDarkMode ? 'bg-black text-white' : 'bg-white text-gray-900'
      }`}>
        <MeasurementLayout>
          <div className={`flex-1 flex items-center justify-center rounded-xl border p-4 overflow-hidden relative transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-zinc-900 border-gray-700' 
              : 'bg-gray-300 border-gray-500'
          }`}>
            {frameImageUrl ? (
              <div 
                className="relative overflow-hidden w-full h-full flex items-center justify-center"
                onContextMenu={handleContextMenu}
                style={{
                  cursor: (selectedAngleType || selectedAreaType || selectedDistanceType || selectedRawDistanceType) ? 'crosshair' : 'default'
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
                  {(selectedAreaType || measurementState.activeToolType === 'area') && currentPoints.length > 1 && (
                    <svg 
                      className="absolute top-0 left-0 pointer-events-none z-5"
                      style={{ width: '100%', height: '100%' }}
                    >
                      {currentPoints.slice(1).map((point, index) => {
                        const prevPoint = currentPoints[index];
                        return (
                          <line
                            key={`area-line-${index}`}
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

                  {/* Lines for angle measurement */}
                  {(selectedAngleType || measurementState.activeToolType === 'angle') && currentPoints.length > 1 && (
                    <svg 
                      className="absolute top-0 left-0 pointer-events-none z-5"
                      style={{ width: '100%', height: '100%' }}
                    >
                      {/* First line: from point 1 to point 2 (vertex) */}
                      {currentPoints.length >= 2 && (
                        <line
                          x1={currentPoints[0][0]}
                          y1={currentPoints[0][1]}
                          x2={currentPoints[1][0]}
                          y2={currentPoints[1][1]}
                          stroke="orange"
                          strokeWidth="3"
                          strokeDasharray="5,5"
                        />
                      )}
                      
                      {/* Second line: from point 2 (vertex) to point 3 */}
                      {currentPoints.length >= 3 && (
                        <line
                          x1={currentPoints[1][0]}
                          y1={currentPoints[1][1]}
                          x2={currentPoints[2][0]}
                          y2={currentPoints[2][1]}
                          stroke="orange"
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
                {(selectedAngleType || selectedAreaType || selectedDistanceType || selectedRawDistanceType || measurementState.activeToolType) && (
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
              <div className={`text-center transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
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
              onRawDistanceTypeSelect={handleRawDistanceToolSelect}
              selectedAngleType={selectedAngleType}
              selectedAreaType={selectedAreaType}
              selectedDistanceType={selectedDistanceType}
              selectedRawDistanceType={selectedRawDistanceType}
              distanceMeasurementStep={distanceMeasurementStep}
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
      </div>
    </>
  );
}

export default ManualMeasurement;