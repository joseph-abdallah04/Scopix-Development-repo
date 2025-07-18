export interface AngleMeasurement {
  angle: number;
  points: number[][];
}

export interface FrameMeasurements {
  glottic?: AngleMeasurement;
  supraglottic?: AngleMeasurement;
}

export function calculatePercentageClosure(
  currentMeasurements: FrameMeasurements,
  baselineMeasurements: FrameMeasurements
): { glottic?: number; supraglottic?: number } {
  const result: { glottic?: number; supraglottic?: number } = {};

  if (currentMeasurements.glottic && baselineMeasurements.glottic) {
    const currentAngle = currentMeasurements.glottic.angle;
    const baselineAngle = baselineMeasurements.glottic.angle;
    
    // Calculate percentage closure: (baseline - current) / baseline * 100
    result.glottic = ((baselineAngle - currentAngle) / baselineAngle) * 100;
  }

  if (currentMeasurements.supraglottic && baselineMeasurements.supraglottic) {
    const currentAngle = currentMeasurements.supraglottic.angle;
    const baselineAngle = baselineMeasurements.supraglottic.angle;
    
    result.supraglottic = ((baselineAngle - currentAngle) / baselineAngle) * 100;
  }

  return result;
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}