import { Journey, JourneyType } from './journey-model';

export interface JourneyRisk {
  id: string;
  score: number;       // 0.0 – 1.0
  priority: 'P0' | 'P1' | 'P2';
  type: JourneyType;
}

export class JourneyRiskEngine {
  compute(journeys: Journey[]): JourneyRisk[] {
    return journeys.map(j => {
      const score = this.computeRiskScore(j);
      const priority = this.assignPriority(score);

      return {
        id: j.id,
        score,
        priority,
        type: j.type
      };
    });
  }

  private computeRiskScore(journey: Journey): number {
    let score = 0;

    const path = journey.steps.map(s => s.to.toLowerCase()).join(' ');

    // High‑risk flows
    if (path.includes('checkout')) score += 0.45;
    if (path.includes('complete')) score += 0.20;
    if (path.includes('payment')) score += 0.30;

    // Medium‑risk flows
    if (path.includes('cart')) score += 0.25;
    if (path.includes('inventory')) score += 0.15;
    if (path.includes('product')) score += 0.15;

    // Login is always important
    if (path.includes('login')) score += 0.30;

    // Longer journeys = more risk
    score += Math.min(journey.steps.length * 0.05, 0.25);

    // Normalize
    return Math.min(score, 1);
  }

  private assignPriority(score: number): 'P0' | 'P1' | 'P2' {
    if (score >= 0.7) return 'P0';
    if (score >= 0.4) return 'P1';
    return 'P2';
  }
}
