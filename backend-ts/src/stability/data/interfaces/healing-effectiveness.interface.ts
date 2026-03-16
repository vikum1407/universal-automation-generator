export interface HealingEffectivenessProvider {
  getHealingEffectiveness(project: string): Promise<number>;
}
