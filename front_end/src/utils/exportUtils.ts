import { calculateAllBaselineComparisons, type FullFrameData } from './baselineCalculations';

export interface FrameExportData {
  frame_id: string;
  frame_idx: number;
  timestamp: number;
  custom_name: string;
  measurements: {
    angle_a?: number | null;
    angle_b?: number | null;
    area_a?: number | null;
    area_b?: number | null;
    area_av?: number | null;
    area_bv?: number | null;
    distance_a?: number | null;
    distance_c?: number | null;
    distance_g?: number | null;
    distance_h?: number | null;
  };
  formulas: {
    p_factor?: number | null;
    c_factor?: number | null;
    distance_ratio_1?: number | null;
    distance_ratio_2?: number | null;
    distance_ratio_3?: number | null;
    distance_ratio_4?: number | null;
    supraglottic_area_ratio_1?: number | null;
    supraglottic_area_ratio_2?: number | null;
  };
  baseline_comparisons?: {
    [key: string]: {
      percentOfBaseline: number;
      percentChangeFromBaseline: number;
    } | null;
  };
  is_baseline?: boolean;
  thumbnail_url?: string;
}

export interface ExportData {
  frames_data: FrameExportData[];
  baseline_frame_id?: string;
  export_timestamp: string;
}

/**
 * Prepare frames data for export with all measurements, formulas, and baseline comparisons
 */
export const prepareFramesForExport = async (
  frameMetadata: any[],
  baselineFrameId?: string
): Promise<FrameExportData[]> => {
  const exportData: FrameExportData[] = [];
  let baselineFrameData: FullFrameData | null = null;

  // Fetch baseline frame data if we have a baseline
  if (baselineFrameId) {
    try {
      const baselineResponse = await fetch(`http://localhost:8000/session/frame-details/${baselineFrameId}`);
      if (baselineResponse.ok) {
        baselineFrameData = await baselineResponse.json();
      }
    } catch (error) {
      console.error('Error fetching baseline frame data:', error);
    }
  }

  // Process each frame
  for (const frame of frameMetadata) {
    try {
      // Fetch full frame data for each frame
      const frameResponse = await fetch(`http://localhost:8000/session/frame-details/${frame.frame_id}`);
      if (!frameResponse.ok) {
        console.error(`Failed to fetch data for frame ${frame.frame_id}`);
        continue;
      }

      const fullFrameData: FullFrameData = await frameResponse.json();
      
      // Calculate baseline comparisons if we have baseline data
      let baselineComparisons = undefined;
      if (baselineFrameData && frame.frame_id !== baselineFrameId) {
        baselineComparisons = calculateAllBaselineComparisons(fullFrameData, baselineFrameData);
      }

      // Prepare export data for this frame
      const frameExportData: FrameExportData = {
        frame_id: frame.frame_id,
        frame_idx: fullFrameData.frame_idx,
        timestamp: fullFrameData.timestamp,
        custom_name: fullFrameData.custom_name || `Frame ${fullFrameData.frame_idx}`,
        measurements: fullFrameData.measurements || {},
        formulas: fullFrameData.formulas || {},
        baseline_comparisons: baselineComparisons,
        is_baseline: frame.frame_id === baselineFrameId,
        thumbnail_url: frame.thumbnail_url
      };

      exportData.push(frameExportData);
    } catch (error) {
      console.error(`Error processing frame ${frame.frame_id}:`, error);
    }
  }

  return exportData;
};

/**
 * Trigger download of Excel file from backend
 */
export const downloadExcelFile = async (exportData: ExportData): Promise<void> => {
  try {
    const response = await fetch('http://localhost:8000/session/export-results', {
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
