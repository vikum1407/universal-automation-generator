export function mapScoreToGrade(score: number): string {
  if (score >= 0.90) return "A";
  if (score >= 0.80) return "B";
  if (score >= 0.70) return "C";
  if (score >= 0.60) return "D";
  return "F";
}
