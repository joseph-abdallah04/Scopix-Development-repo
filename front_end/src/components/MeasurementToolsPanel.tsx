import { FiRotateCcw, FiRotateCw, FiTrash2, FiSquare } from 'react-icons/fi';
import type { Measurements } from '../types/measurements';

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

interface AngleMeasurement {
  angle: number;
  points: number[][];
}

interface DistanceMeasurement {
  horizontal_distance: number;
  vertical_distance: number;
  ratio_percentage: number;
  horizontal_points: number[][];
  vertical_points: number[][];
}

interface MeasurementToolsPanelProps {
  measurements: Measurements;
  onSave: (measurements: any) => void;
  onAngleTypeSelect: (type: 'angle_a' | 'angle_b' | null) => void;
  onAreaTypeSelect: (type: 'area_a' | 'area_b' | 'area_av' | 'area_bv' | null) => void;
  onDistanceTypeSelect: (type: 'distance_ratio' | null) => void;
  onRawDistanceTypeSelect: (type: 'distance_a' | 'distance_c' | 'distance_g' | 'distance_h' | null) => void;
  selectedAngleType: 'angle_a' | 'angle_b' | null;
  selectedAreaType: 'area_a' | 'area_b' | 'area_av' | 'area_bv' | null;
  selectedDistanceType: 'distance_ratio' | null;
  selectedRawDistanceType: 'distance_a' | 'distance_c' | 'distance_g' | 'distance_h' | null;
  distanceMeasurementStep?: 'horizontal' | 'vertical' | null;
  onUndo: () => void;
  onRedo: () => void;
  onClearAll: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const MeasurementToolsPanel: React.FC<MeasurementToolsPanelProps> = ({
  measurements,
  onSave,
  onAngleTypeSelect,
  onAreaTypeSelect,
  onDistanceTypeSelect,
  onRawDistanceTypeSelect,
  selectedAngleType,
  selectedAreaType,
  selectedDistanceType,
  selectedRawDistanceType,
  distanceMeasurementStep,
  onUndo,
  onRedo,
  onClearAll,
  canUndo,
  canRedo
}) => {
  console.log('🎯 RENDER - MeasurementToolsPanel with props:', {
    selectedAngleType,
    selectedAreaType,
    hasAngleHandler: !!onAngleTypeSelect,
    hasAreaHandler: !!onAreaTypeSelect
  });

  const formatAngle = (angle: number) => `${angle.toFixed(1)}°`;
  const formatArea = (area: number, unit: string = 'px²') => `${area.toFixed(1)} ${unit}`;
  const formatDistance = (distance: number, unit: string = 'px') => `${distance.toFixed(1)} ${unit}`;
  const formatRatio = (ratio: number) => `${ratio.toFixed(1)}%`;

  // Check if at least one measurement has been taken
  const hasMeasurements = !!(
    measurements.angle_a || 
    measurements.angle_b || 
    measurements.area_a || 
    measurements.area_b ||
    measurements.area_av ||
    measurements.area_bv ||
    measurements.distance_a ||
    measurements.distance_c ||
    measurements.distance_g ||
    measurements.distance_h
  );

  // Handle angle tool selection/deselection
  const handleAngleToolClick = (type: 'angle_a' | 'angle_b') => {
    console.log(`${type} angle button clicked`);
    if (onAngleTypeSelect) {
      // If already selected, deselect it (pass null)
      if (selectedAngleType === type) {
        onAngleTypeSelect(null);
      } else {
        onAngleTypeSelect(type);
      }
    }
  };

  // Handle area tool selection/deselection
  const handleAreaToolClick = (type: 'area_a' | 'area_b' | 'area_av' | 'area_bv') => {
    console.log(`${type} button clicked`);
    if (onAreaTypeSelect) {
      // If already selected, deselect it (pass null)
      if (selectedAreaType === type) {
        onAreaTypeSelect(null);
      } else {
        onAreaTypeSelect(type);
      }
    }
  };

  // Handle distance tool selection/deselection
  const handleDistanceToolClick = (type: 'distance_ratio' | null) => {
    console.log(`${type} button clicked`);
    if (onDistanceTypeSelect) {
      if (selectedDistanceType === type) {
        onDistanceTypeSelect(null);
      } else {
        onDistanceTypeSelect(type);
      }
    }
  };

  // Add handler for raw distance tools
  const handleRawDistanceToolClick = (type: 'distance_a' | 'distance_c' | 'distance_g' | 'distance_h') => {
    console.log(`${type} raw distance button clicked`);
    if (onRawDistanceTypeSelect) {
      // If already selected, deselect it (pass null)
      if (selectedRawDistanceType === type) {
        onRawDistanceTypeSelect(null);
      } else {
        onRawDistanceTypeSelect(type);
      }
    }
  };

  return (
    <div className="bg-zinc-900 rounded-xl border border-gray-700 p-4 w-80 flex flex-col gap-4 h-full overflow-hidden">
      <h3 className="text-xl text-white text-center border-b border-gray-700 pb-2 m-0 flex-shrink-0">
        Measurement Tools
      </h3>
      
      {/* Scrollable content area with proper padding to avoid scrollbar overlap */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-4 min-h-0 pr-2 -mr-2">
        {/* Undo/Redo Controls */}
        <div className="bg-gray-800 rounded-lg p-3 flex-shrink-0">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Actions</h4>
          <div className="flex gap-2">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`flex-1 rounded px-3 py-2 text-sm transition-colors font-medium ${
                canUndo
                  ? 'bg-gray-600 hover:bg-gray-500 text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              <FiRotateCcw size={14} />
              Undo
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className={`flex-1 rounded px-3 py-2 text-sm transition-colors font-medium ${
                canRedo
                  ? 'bg-gray-600 hover:bg-gray-500 text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              <FiRotateCw size={14} />
              Redo
            </button>
            <button
              onClick={onClearAll}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded px-3 py-2 text-sm transition-colors font-medium"
            >
              <FiTrash2 size={14} />
              Clear All
            </button>
          </div>
        </div>
        
        {/* Angle Measurement Tools */}
        <div className="bg-gray-800 rounded-lg p-3 flex-shrink-0">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Angle Measurements</h4>
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => handleAngleToolClick('angle_a')}
              className={`flex items-center justify-between rounded px-3 py-2 text-xs transition-colors font-medium min-h-[2.5rem] ${
                selectedAngleType === 'angle_a' 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg' 
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-shrink">
                <span className="text-sm">∠</span>
                <span className="truncate">Angle A (Glottic)</span>
              </div>
              <span className="text-xs text-gray-300 ml-2 flex-shrink-0">
                {measurements.angle_a !== undefined && measurements.angle_a !== null
                  ? `${measurements.angle_a.toFixed(1)}°`
                  : '--'}
              </span>
            </button>
            <button 
              onClick={() => handleAngleToolClick('angle_b')}
              className={`flex items-center justify-between rounded px-3 py-2 text-xs transition-colors font-medium min-h-[2.5rem] ${
                selectedAngleType === 'angle_b' 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg' 
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-shrink">
                <span className="text-sm">∠</span>
                <span className="truncate">Angle B (Supraglottic)</span>
              </div>
              <span className="text-xs text-gray-300 ml-2 flex-shrink-0">
                {measurements.angle_b !== undefined && measurements.angle_b !== null
                  ? `${measurements.angle_b.toFixed(1)}°`
                  : '--'}
              </span>
            </button>
          </div>
        </div>

        {/* Area Measurement Tools */}
        <div className="bg-gray-800 rounded-lg p-3 flex-shrink-0">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Area Measurements</h4>
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => handleAreaToolClick('area_a')}
              className={`flex items-center justify-between rounded px-3 py-2 text-xs transition-colors font-medium min-h-[2.5rem] ${
                selectedAreaType === 'area_a' 
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg' 
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-shrink">
                <span className="truncate">Area A (Supraglottic)</span>
              </div>
              <span className="text-xs text-gray-300 ml-2 flex-shrink-0">
                {measurements.area_a !== undefined && measurements.area_a !== null
                  ? `${measurements.area_a.toFixed(0)} px²`
                  : '--'}
              </span>
            </button>
            <button 
              onClick={() => handleAreaToolClick('area_b')}
              className={`flex items-center justify-between rounded px-3 py-2 text-xs transition-colors font-medium min-h-[2.5rem] ${
                selectedAreaType === 'area_b' 
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg' 
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-shrink">
                <span className="truncate">Area B (Glottal)</span>
              </div>
              <span className="text-xs text-gray-300 ml-2 flex-shrink-0">
                {measurements.area_b !== undefined && measurements.area_b !== null
                  ? `${measurements.area_b.toFixed(0)} px²`
                  : '--'}
              </span>
            </button>
            <button 
              onClick={() => handleAreaToolClick('area_av')}
              className={`flex items-center justify-between rounded px-3 py-2 text-xs transition-colors font-medium min-h-[2.5rem] ${
                selectedAreaType === 'area_av' 
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg' 
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-shrink">
                <span className="truncate">Area AV</span>
              </div>
              <span className="text-xs text-gray-300 ml-2 flex-shrink-0">
                {measurements.area_av !== undefined && measurements.area_av !== null
                  ? `${measurements.area_av.toFixed(0)} px²`
                  : '--'}
              </span>
            </button>
            <button 
              onClick={() => handleAreaToolClick('area_bv')}
              className={`flex items-center justify-between rounded px-3 py-2 text-xs transition-colors font-medium min-h-[2.5rem] ${
                selectedAreaType === 'area_bv' 
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg' 
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-shrink">
                <span className="truncate">Area BV</span>
              </div>
              <span className="text-xs text-gray-300 ml-2 flex-shrink-0">
                {measurements.area_bv !== undefined && measurements.area_bv !== null
                  ? `${measurements.area_bv.toFixed(0)} px²`
                  : '--'}
              </span>
            </button>
          </div>
        </div>

        {/* Raw Distance Measurement Tools */}
        <div className="bg-gray-800 rounded-lg p-3 flex-shrink-0">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Distance Measurements</h4>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleRawDistanceToolClick('distance_a')}
              className={`flex items-center justify-between rounded px-3 py-2 text-xs transition-colors font-medium min-h-[2.5rem] ${
                selectedRawDistanceType === 'distance_a'
                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-shrink">
                <span className="truncate">Distance A</span>
              </div>
              <span className="text-xs text-gray-300 ml-2 flex-shrink-0">
                {measurements.distance_a !== undefined && measurements.distance_a !== null
                  ? `${measurements.distance_a.toFixed(1)} px`
                  : '--'}
              </span>
            </button>
            <button
              onClick={() => handleRawDistanceToolClick('distance_c')}
              className={`flex items-center justify-between rounded px-3 py-2 text-xs transition-colors font-medium min-h-[2.5rem] ${
                selectedRawDistanceType === 'distance_c'
                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-shrink">
                <span className="truncate">Distance C</span>
              </div>
              <span className="text-xs text-gray-300 ml-2 flex-shrink-0">
                {measurements.distance_c !== undefined && measurements.distance_c !== null
                  ? `${measurements.distance_c.toFixed(1)} px`
                  : '--'}
              </span>
            </button>
            <button
              onClick={() => handleRawDistanceToolClick('distance_g')}
              className={`flex items-center justify-between rounded px-3 py-2 text-xs transition-colors font-medium min-h-[2.5rem] ${
                selectedRawDistanceType === 'distance_g'
                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-shrink">
                <span className="truncate">Distance G</span>
              </div>
              <span className="text-xs text-gray-300 ml-2 flex-shrink-0">
                {measurements.distance_g !== undefined && measurements.distance_g !== null
                  ? `${measurements.distance_g.toFixed(1)} px`
                  : '--'}
              </span>
            </button>
            <button
              onClick={() => handleRawDistanceToolClick('distance_h')}
              className={`flex items-center justify-between rounded px-3 py-2 text-xs transition-colors font-medium min-h-[2.5rem] ${
                selectedRawDistanceType === 'distance_h'
                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-shrink">
                <span className="truncate">Distance H</span>
              </div>
              <span className="text-xs text-gray-300 ml-2 flex-shrink-0">
                {measurements.distance_h !== undefined && measurements.distance_h !== null
                  ? `${measurements.distance_h.toFixed(1)} px`
                  : '--'}
              </span>
            </button>
          </div>
        </div>

        {/* Instructions */}
        {(selectedAngleType || selectedAreaType || selectedDistanceType || selectedRawDistanceType) && (
          <div className="bg-yellow-800 rounded-lg p-3 border-2 border-yellow-600 flex-shrink-0">
            <h4 className="text-sm font-medium text-yellow-100 mb-2">📋 Instructions</h4>
            {selectedAngleType && (
              <>
                <p className="text-xs text-yellow-200">
                  Click 3 points to measure the {selectedAngleType} opening angle:
                </p>
                <ol className="text-xs text-yellow-200 mt-1 ml-4">
                  <li>1. Click the first point</li>
                  <li>2. Click the vertex (center point)</li>
                  <li>3. Click the third point</li>
                </ol>
                <p className="text-xs text-yellow-200 mt-2 italic">
                  💡 Click the tool again to unselect
                </p>
              </>
            )}
            {selectedAreaType && (
              <>
                <p className="text-xs text-yellow-200">
                  Click points to outline the {selectedAreaType.replace('_', ' ')} boundary:
                </p>
                <ol className="text-xs text-yellow-200 mt-1 ml-4">
                  <li>1. Click around the perimeter</li>
                  <li>2. At least 3 points required</li>
                  <li>3. Press <kbd className="bg-yellow-700 px-1 rounded text-yellow-100">Enter</kbd> to finish</li>
                </ol>
                <p className="text-xs text-yellow-200 mt-2 italic">
                  💡 Click the tool again to unselect
                </p>
              </>
            )}
            {selectedDistanceType && (
              <>
                <p className="text-xs text-yellow-200">
                  Measure horizontal and vertical distances for ratio calculation:
                </p>
                <ol className="text-xs text-yellow-200 mt-1 ml-4">
                  <li>1. Click 2 points for <strong>horizontal</strong> distance</li>
                  <li>2. Click 2 points for <strong>vertical</strong> distance</li>
                  <li>3. Ratio will be calculated as (X/Y) × 100</li>
                </ol>
                {distanceMeasurementStep && (
                  <div className="mt-2 p-2 bg-yellow-700 rounded">
                    <p className="text-xs text-yellow-100 font-medium">
                      📍 Current step: {distanceMeasurementStep === 'horizontal' ? 'Measuring horizontal distance' : 'Measuring vertical distance'}
                    </p>
                  </div>
                )}
                <p className="text-xs text-yellow-200 mt-2 italic">
                  💡 Click the tool again to unselect
                </p>
              </>
            )}
            {selectedRawDistanceType && (
              <>
                <p className="text-xs text-yellow-200">
                  Click 2 points to measure {selectedRawDistanceType.replace('_', ' ')} distance:
                </p>
                <ol className="text-xs text-yellow-200 mt-1 ml-4">
                  <li>1. Click the first point</li>
                  <li>2. Click the second point</li>
                  <li>3. Distance will be calculated automatically</li>
                </ol>
                <p className="text-xs text-yellow-200 mt-2 italic">
                  💡 Click the tool again to unselect
                </p>
              </>
            )}
          </div>
        )}
        
      </div>
      
      {/* Save button stays at bottom - outside scrollable area */}
      <div className="flex-shrink-0">
        <button 
          onClick={() => onSave(measurements)}
          disabled={!hasMeasurements}
          className={`w-full border-none rounded-lg px-4 py-3 text-sm font-medium cursor-pointer transition-colors duration-200 ${
            hasMeasurements
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
          }`}
        >
          Save Measurements
        </button>
      </div>
    </div>
  );
};

export default MeasurementToolsPanel;