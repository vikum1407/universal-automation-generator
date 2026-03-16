export interface StabilityFactor {
  label: string;
  weight: number;
  value: number;
}

export interface StabilityScoreResult {
  score: number;
  grade: string;
  factors: StabilityFactor[];
}
