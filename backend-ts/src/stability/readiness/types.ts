export interface ReleaseReadinessResult {
  status: "safe" | "risky" | "blocked";
  stabilityScore: number;
  reasons: string[];
  recommendations: string[];
}
