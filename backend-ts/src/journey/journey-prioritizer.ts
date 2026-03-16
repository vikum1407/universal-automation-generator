import { Journey } from './journey-model';
import { JourneyRisk } from './journey-risk-engine';

export interface PrioritizedJourney {
  journey: Journey;
  risk: JourneyRisk;
}

export class JourneyPrioritizer {
  prioritize(journeys: Journey[], risks: JourneyRisk[]): PrioritizedJourney[] {
    const riskMap = new Map(risks.map(r => [r.id, r]));

    return journeys
      .map(j => ({
        journey: j,
        risk: riskMap.get(j.id)!
      }))
      .sort((a, b) => b.risk.score - a.risk.score);
  }
}
