export interface HealedPatternsProvider {
  getHealedPatterns(project: string): Promise<string[]>;
}
