import { Journey } from './journey-model';

export interface JourneyCoverageMap {
  pages: Record<string, number>;
  transitions: Record<string, number>;
  journeys: number;
}

export class JourneyCoverageMapBuilder {
  build(journeys: Journey[]): JourneyCoverageMap {
    const pages: Record<string, number> = {};
    const transitions: Record<string, number> = {};

    for (const j of journeys) {
      for (const step of j.steps) {
        pages[step.from] = (pages[step.from] || 0) + 1;
        pages[step.to] = (pages[step.to] || 0) + 1;

        const key = `${step.from} -> ${step.to}`;
        transitions[key] = (transitions[key] || 0) + 1;
      }
    }

    return {
      pages,
      transitions,
      journeys: journeys.length
    };
  }
}
