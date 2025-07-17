export interface FrameExportData {
  frame_id: string;
  frame_idx: number;
  timestamp: number;
  custom_name: string;
  measurements: any;
  calculated_percentages: any;
  is_baseline?: boolean;
  thumbnail_url?: string; // Add thumbnail URL
}

export interface ExportData {
  frames_data: FrameExportData[];
  baseline_frame_id?: string;
  export_timestamp: string;
}

/**
 * Calculate percentage changes for a frame compared to baseline
 */
const calculatePercentageChanges = (
  currentFrame: any,
  baselineFrame: any
): any => {
  if (!baselineFrame || currentFrame.id === baselineFrame.id) {
    return {}; // No percentages for baseline frame
  }

  const percentages: any = {};
  const currentMeasurements = currentFrame.measurements || {};
  const baselineMeasurements = baselineFrame.measurements || {};

  // Calculate angle percentage changes
  if (currentMeasurements.glottic_angle !== undefined && baselineMeasurements.glottic_angle !== undefined) {
    const change = ((currentMeasurements.glottic_angle - baselineMeasurements.glottic_angle) / baselineMeasurements.glottic_angle) * 100;
    percentages.glottic_angle_closure = change;
  }

  if (currentMeasurements.supraglottic_angle !== undefined && baselineMeasurements.supraglottic_angle !== undefined) {
    const change = ((currentMeasurements.supraglottic_angle - baselineMeasurements.supraglottic_angle) / baselineMeasurements.supraglottic_angle) * 100;
    percentages.supraglottic_angle_closure = change;
  }

  // Calculate area percentage changes
  if (currentMeasurements.glottic_area !== undefined && baselineMeasurements.glottic_area !== undefined) {
    const change = ((currentMeasurements.glottic_area - baselineMeasurements.glottic_area) / baselineMeasurements.glottic_area) * 100;
    percentages.glottic_area_closure = change;
  }

  if (currentMeasurements.supraglottic_area !== undefined && baselineMeasurements.supraglottic_area !== undefined) {
    const change = ((currentMeasurements.supraglottic_area - baselineMeasurements.supraglottic_area) / baselineMeasurements.supraglottic_area) * 100;
    percentages.supraglottic_area_closure = change;
  }

  // Calculate distance ratio changes
  if (currentMeasurements.distance_ratio?.ratio_percentage !== undefined && baselineMeasurements.distance_ratio?.ratio_percentage !== undefined) {
    const change = ((currentMeasurements.distance_ratio.ratio_percentage - baselineMeasurements.distance_ratio.ratio_percentage) / baselineMeasurements.distance_ratio.ratio_percentage) * 100;
    percentages.distance_ratio_change = change;
  }

  return percentages;
};

/**
 * Trigger download of Excel file from backend
 */
export const downloadExcelFile = async (exportData: ExportData): Promise<void> => {
  try {
    const response = await fetch('http://0.0.0.0:8000/session/export-results', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(exportData)
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    // Get the filename from the response headers
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'video_analysis_results.xlsx';
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    // Convert response to blob
    const blob = await response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
};

/**
 * Prepare frames data for export with calculated percentages and thumbnail URLs
 */
export const prepareFramesForExport = (
  savedFrames: any[],
  baselineFrameId?: string
): FrameExportData[] => {
  const baselineFrame = savedFrames.find(frame => 
    frame.id === baselineFrameId || frame.isBaseline
  );

  return savedFrames.map(frame => ({
    frame_id: frame.id,
    frame_idx: frame.frameIdx || 0,
    timestamp: frame.timestamp || 0,
    custom_name: frame.customName || frame.name || `Frame ${frame.frameIdx || 0}`,
    measurements: frame.measurements || {},
    calculated_percentages: calculatePercentageChanges(frame, baselineFrame),
    is_baseline: frame.id === baselineFrameId || frame.isBaseline,
    thumbnail_url: frame.thumbnailUrl // Include thumbnail URL for backend access
  }));
};