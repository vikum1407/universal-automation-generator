export interface FlakinessProvider {
  getFlakinessRate(project: string): Promise<number>;
}
