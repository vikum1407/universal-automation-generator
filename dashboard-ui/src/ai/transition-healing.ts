export type TransitionFix = {
  from: string;
  to: string;
  severity: number;
  reason: string;
  type: "add" | "strengthen" | "remove";
};

export type TransitionHealingResult = {
  healedGraph: {
    pages: any[];
    transitions: any[];
    clusters: any[];
  };
  suggestions: TransitionFix[];
  stabilityScore: number;
  diff: {
    added: TransitionFix[];
    removed: TransitionFix[];
    strengthened: TransitionFix[];
  };
};

function scoreVolatility(vol: number) {
  return Math.min(1, vol / 5);
}

function scoreRisk(risk: number) {
  return Math.min(1, risk / 10);
}

function scoreAnomaly(a: number) {
  return Math.min(1, a / 3);
}

export function healTransitions(
  graph: { pages: any[]; transitions: any[]; clusters: any[] },
  evolutionPoints: any[],
  anomalies: any[],
  forecast: any[]
): TransitionHealingResult {
  const transitions = [...graph.transitions];
  const pages = [...graph.pages];
  const clusters = [...graph.clusters];

  const suggestions: TransitionFix[] = [];
  const added: TransitionFix[] = [];
  const removed: TransitionFix[] = [];
  const strengthened: TransitionFix[] = [];

  const volatilityMap: Record<string, number> = {};
  const anomalyMap: Record<string, number> = {};
  const riskMap: Record<string, number> = {};

  evolutionPoints.forEach(p => {
    volatilityMap[p.id] = p.volatility ?? 0;
  });

  anomalies.forEach(a => {
    anomalyMap[a.id] = a.severity ?? 0;
  });

  forecast.forEach(f => {
    riskMap[f.label] = f.predicted ?? 0;
  });

  const transitionMap = new Map<string, any>();
  transitions.forEach(t => {
    transitionMap.set(`${t.from}->${t.to}`, t);
  });

  pages.forEach(p => {
    pages.forEach(q => {
      if (p.id === q.id) return;

      const key = `${p.id}->${q.id}`;
      const exists = transitionMap.has(key);

      const volScore = scoreVolatility(volatilityMap[p.id] ?? 0);
      const anomalyScore = scoreAnomaly(anomalyMap[p.id] ?? 0);
      const riskScore = scoreRisk(riskMap[`Forecast +1`] ?? 0);

      const weight = (volScore + anomalyScore + riskScore) / 3;

      if (!exists && weight > 0.6) {
        const fix: TransitionFix = {
          from: p.id,
          to: q.id,
          severity: weight,
          reason: "High volatility + anomaly + forecasted risk",
          type: "add"
        };
        suggestions.push(fix);
        added.push(fix);
        transitions.push({ from: p.id, to: q.id, weight: 1 });
      }

      if (exists && weight > 0.5) {
        const fix: TransitionFix = {
          from: p.id,
          to: q.id,
          severity: weight,
          reason: "Transition unstable under weighted heuristics",
          type: "strengthen"
        };
        suggestions.push(fix);
        strengthened.push(fix);
      }

      if (exists && weight < 0.1) {
        const fix: TransitionFix = {
          from: p.id,
          to: q.id,
          severity: 1 - weight,
          reason: "Transition likely obsolete or unstable",
          type: "remove"
        };
        suggestions.push(fix);
        removed.push(fix);
        const idx = transitions.findIndex(t => t.from === p.id && t.to === q.id);
        if (idx !== -1) transitions.splice(idx, 1);
      }
    });
  });

  const stabilityScore =
    1 -
    (added.length * 0.1 + strengthened.length * 0.05 + removed.length * 0.1);

  return {
    healedGraph: {
      pages,
      transitions,
      clusters
    },
    suggestions,
    stabilityScore: Math.max(0, stabilityScore),
    diff: {
      added,
      removed,
      strengthened
    }
  };
}
