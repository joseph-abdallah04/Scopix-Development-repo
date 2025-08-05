// Baseline calculation utilities for the new measurement system

export interface FullFrameData {
  frame_id: string;
  frame_idx: number;
  timestamp: number;
  custom_name?: string;
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
  formulas?: {
    p_factor?: number;
    c_factor?: number;
    distance_ratio_1?: number;
    distance_ratio_2?: number;
    distance_ratio_3?: number;
    distance_ratio_4?: number;
    supraglottic_area_ratio_1?: number;
    supraglottic_area_ratio_2?: number;
  };
}

export interface BaselineComparison {
  percentOfBaseline: number;
  percentChangeFromBaseline: number;
}

export function calculateAllBaselineComparisons(
  currentFrame: FullFrameData,
  baselineFrame: FullFrameData
): Record<string, BaselineComparison | null> {
  const comparisons: Record<string, BaselineComparison | null> = {};

  // Helper function to calculate comparison
  const calculateComparison = (current: number | null | undefined, baseline: number | null | undefined): BaselineComparison | null => {
    if (current == null || baseline == null || baseline === 0) {
      return null;
    }
    
    const percentOfBaseline = (current / baseline) * 100;
    const percentChangeFromBaseline = ((current - baseline) / baseline) * 100;
    
    return { percentOfBaseline, percentChangeFromBaseline };
  };

  // Calculate comparisons ONLY for angles (not raw area/distance measurements)
  comparisons.angle_a = calculateComparison(currentFrame.measurements.angle_a, baselineFrame.measurements.angle_a);
  comparisons.angle_b = calculateComparison(currentFrame.measurements.angle_b, baselineFrame.measurements.angle_b);

  // Calculate comparisons for formulas
  if (currentFrame.formulas && baselineFrame.formulas) {
    comparisons.p_factor = calculateComparison(currentFrame.formulas.p_factor, baselineFrame.formulas.p_factor);
    comparisons.c_factor = calculateComparison(currentFrame.formulas.c_factor, baselineFrame.formulas.c_factor);
    comparisons.distance_ratio_1 = calculateComparison(currentFrame.formulas.distance_ratio_1, baselineFrame.formulas.distance_ratio_1);
    comparisons.distance_ratio_2 = calculateComparison(currentFrame.formulas.distance_ratio_2, baselineFrame.formulas.distance_ratio_2);
    comparisons.distance_ratio_3 = calculateComparison(currentFrame.formulas.distance_ratio_3, baselineFrame.formulas.distance_ratio_3);
    comparisons.distance_ratio_4 = calculateComparison(currentFrame.formulas.distance_ratio_4, baselineFrame.formulas.distance_ratio_4);
    comparisons.supraglottic_area_ratio_1 = calculateComparison(currentFrame.formulas.supraglottic_area_ratio_1, baselineFrame.formulas.supraglottic_area_ratio_1);
    comparisons.supraglottic_area_ratio_2 = calculateComparison(currentFrame.formulas.supraglottic_area_ratio_2, baselineFrame.formulas.supraglottic_area_ratio_2);
  }

  return comparisons;
} 