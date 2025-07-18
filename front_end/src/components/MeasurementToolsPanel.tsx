import { FiRotateCcw, FiRotateCw, FiTrash2, FiSquare } from 'react-icons/fi';

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
  measurements: {
    glottic?: AngleMeasurement;
    supraglottic?: AngleMeasurement;
    glottic_area?: AreaMeasurement;
    supraglottic_area?: AreaMeasurement;
    distance_ratio?: DistanceMeasurement;
  };
  onSave: (measurements: any) => void;
  onAngleTypeSelect: (type: 'glottic' | 'supraglottic' | null) => void;
  onAreaTypeSelect: (type: 'glottic_area' | 'supraglottic_area' | null) => void;
  onDistanceTypeSelect: (type: 'distance_ratio' | null) => void;
  selectedAngleType: 'glottic' | 'supraglottic' | null;
  selectedAreaType: 'glottic_area' | 'supraglottic_area' | null;
  selectedDistanceType: 'distance_ratio' | null;
  distanceMeasurementStep?: 'horizontal' | 'vertical' | null; // Add this prop
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
  selectedAngleType,
  selectedAreaType,
  selectedDistanceType,
  distanceMeasurementStep, // Add this
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
    measurements.glottic || 
    measurements.supraglottic || 
    measurements.glottic_area || 
    measurements.supraglottic_area ||
    measurements.distance_ratio
  );

  // Handle angle tool selection/deselection
  const handleAngleToolClick = (type: 'glottic' | 'supraglottic') => {
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
  const handleAreaToolClick = (type: 'glottic_area' | 'supraglottic_area') => {
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
  const handleDistanceToolClick = (type: 'distance_ratio') => {
    console.log(`${type} button clicked`);
    if (onDistanceTypeSelect) {
      if (selectedDistanceType === type) {
        onDistanceTypeSelect(null);
      } else {
        onDistanceTypeSelect(type);
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
              onClick={() => handleAngleToolClick('glottic')}
              className={`flex items-center gap-2 rounded px-3 py-2 text-sm transition-colors font-medium ${
                selectedAngleType === 'glottic' 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg' 
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              <span className="text-base">∠</span>
              Glottic Opening Angle
            </button>
            <button 
              onClick={() => handleAngleToolClick('supraglottic')}
              className={`flex items-center gap-2 rounded px-3 py-2 text-sm transition-colors font-medium ${
                selectedAngleType === 'supraglottic' 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg' 
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              <span className="text-base">∠</span>
              Supraglottic Opening Angle
            </button>
          </div>
        </div>

        {/* Area Measurement Tools */}
        <div className="bg-gray-800 rounded-lg p-3 flex-shrink-0">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Area Measurements</h4>
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => handleAreaToolClick('glottic_area')}
              className={`flex items-center gap-2 rounded px-3 py-2 text-sm transition-colors font-medium ${
                selectedAreaType === 'glottic_area' 
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg' 
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              <FiSquare size={14} />
              Glottic Opening Area
            </button>
            <button 
              onClick={() => handleAreaToolClick('supraglottic_area')}
              className={`flex items-center gap-2 rounded px-3 py-2 text-sm transition-colors font-medium ${
                selectedAreaType === 'supraglottic_area' 
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg' 
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              <FiSquare size={14} />
              Supraglottic Opening Area
            </button>
          </div>
        </div>

        {/* Distance Ratio Measurement Tool */}
        <div className="bg-gray-800 rounded-lg p-3 flex-shrink-0">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Distance Ratio Measurements</h4>
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => handleDistanceToolClick('distance_ratio')}
              className={`flex items-center gap-2 rounded px-3 py-2 text-sm transition-colors font-medium ${
                selectedDistanceType === 'distance_ratio' 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg' 
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              <span className="text-base">📏</span>
              Distance Ratio (X/Y)
            </button>
          </div>
        </div>

        {/* Instructions */}
        {(selectedAngleType || selectedAreaType || selectedDistanceType) && (
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
          </div>
        )}

        {/* Current Measurements Display */}
        <div className="bg-gray-800 rounded-lg p-3 flex-shrink-0">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Current Measurements</h4>
          
          {/* Angle Measurements */}
          <div className="mb-4">
            <h5 className="text-xs font-medium text-gray-400 mb-2">ANGLES</h5>
            
            <div className="mb-2">
              <span className="text-xs text-gray-500">Glottic Opening:</span>
              <div className="text-sm text-white">
                {measurements.glottic ? formatAngle(measurements.glottic.angle) : 'Not measured'}
              </div>
            </div>
            
            <div className="mb-2">
              <span className="text-xs text-gray-500">Supraglottic Opening:</span>
              <div className="text-sm text-white">
                {measurements.supraglottic ? formatAngle(measurements.supraglottic.angle) : 'Not measured'}
              </div>
            </div>
          </div>

          {/* Area Measurements */}
          <div className="mb-4">
            <h5 className="text-xs font-medium text-gray-400 mb-2">AREAS</h5>
            
            <div className="mb-2">
              <span className="text-xs text-gray-500">Glottic Area:</span>
              <div className="text-sm text-white">
                {measurements.glottic_area ? (
                  <div>
                    <div>{formatArea(measurements.glottic_area.area_pixels)}</div>
                    {measurements.glottic_area.area_mm2 && (
                      <div className="text-xs text-gray-400">
                        {formatArea(measurements.glottic_area.area_mm2, 'mm²')}
                      </div>
                    )}
                  </div>
                ) : 'Not measured'}
              </div>
            </div>
            
            <div className="mb-2">
              <span className="text-xs text-gray-500">Supraglottic Area:</span>
              <div className="text-sm text-white">
                {measurements.supraglottic_area ? (
                  <div>
                    <div>{formatArea(measurements.supraglottic_area.area_pixels)}</div>
                    {measurements.supraglottic_area.area_mm2 && (
                      <div className="text-xs text-gray-400">
                        {formatArea(measurements.supraglottic_area.area_mm2, 'mm²')}
                      </div>
                    )}
                  </div>
                ) : 'Not measured'}
              </div>
            </div>
          </div>

          {/* Distance Ratio Measurements */}
          <div className="mb-4">
            <h5 className="text-xs font-medium text-gray-400 mb-2">DISTANCE RATIO</h5>
            
            <div className="mb-2">
              <span className="text-xs text-gray-500">Horizontal Distance:</span>
              <div className="text-sm text-white">
                {measurements.distance_ratio ? formatDistance(measurements.distance_ratio.horizontal_distance) : 'Not measured'}
              </div>
            </div>
            
            <div className="mb-2">
              <span className="text-xs text-gray-500">Vertical Distance:</span>
              <div className="text-sm text-white">
                {measurements.distance_ratio ? formatDistance(measurements.distance_ratio.vertical_distance) : 'Not measured'}
              </div>
            </div>
            
            <div className="mb-2">
              <span className="text-xs text-gray-500">Ratio (X/Y):</span>
              <div className="text-sm text-white">
                {measurements.distance_ratio ? formatRatio(measurements.distance_ratio.ratio_percentage) : 'Not measured'}
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 mb-4">
            Select a measurement type above to start
          </p>
        </div>
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