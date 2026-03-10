import { ReinforcementMemory } from './reinforcement-engine';
import { UIStateGraph } from './ui-state-engine';
import { UIScenario } from './ui-scenario-engine';

export interface RegressionSignature {
  id: string;
  kind: 'selector' | 'scenario' | 'state';
  refId: string;
  vector: number[]; // compact numeric fingerprint
  lastUpdatedAt: string;
}

export interface RegressionCluster {
  id: string;
  kind: 'selector' | 'scenario' | 'state';
  memberIds: string[];
  centroid: number[];
  label: string;
}

export interface RegressionForecast {
  id: string;
  kind: 'selector' | 'scenario' | 'state';
  refId: string;
  riskScore: number; // 0–1
  horizon: 'short' | 'medium' | 'long';
  reason: string;
}

export interface RegressionMemory {
  signatures: RegressionSignature[];
  clusters: RegressionCluster[];
  forecasts: RegressionForecast[];
}

export class RegressionEngine {
  analyze(
    reinforcement: ReinforcementMemory,
    scenarios: UIScenario[],
    stateGraph: UIStateGraph,
    existing?: RegressionMemory
  ): RegressionMemory {
    const signatures = this.buildSignatures(reinforcement, scenarios, stateGraph);
    const clusters = this.buildClusters(signatures);
    const forecasts = this.buildForecasts(signatures, clusters);

    return {
      signatures,
      clusters,
      forecasts
    };
  }

  private buildSignatures(
    reinforcement: ReinforcementMemory,
    scenarios: UIScenario[],
    stateGraph: UIStateGraph
  ): RegressionSignature[] {
    const signatures: RegressionSignature[] = [];
    const now = new Date().toISOString();

    // selectors
    for (const sel of reinforcement.selectors) {
      const total = sel.failures + sel.successes;
      const failureRate = total > 0 ? sel.failures / total : 0;
      const recencyBoost = sel.lastOutcome === 'failed' ? 1 : 0;
      const activity = Math.min(1, total / 20);

      signatures.push({
        id: `selector-${sel.requirementId}`,
        kind: 'selector',
        refId: sel.requirementId,
        vector: [failureRate, recencyBoost, activity],
        lastUpdatedAt: now
      });
    }

    // scenarios
    for (const sc of scenarios) {
      const r = reinforcement.scenarios.find(x => x.scenarioId === sc.id);
      const drift = r?.driftScore ?? sc.driftRisk;
      const failures = r?.failures ?? 0;
      const successes = r?.successes ?? 0;
      const total = failures + successes;
      const failureRate = total > 0 ? failures / total : 0;

      signatures.push({
        id: `scenario-${sc.id}`,
        kind: 'scenario',
        refId: sc.id,
        vector: [drift, failureRate, total > 0 ? Math.min(1, total / 20) : 0],
        lastUpdatedAt: now
      });
    }

    // states
    for (const st of stateGraph.states) {
      const r = reinforcement.states.find(x => x.stateId === st.id);
      const drift = r?.driftScore ?? st.driftRisk;
      const failures = r?.failures ?? 0;
      const successes = r?.successes ?? 0;
      const total = failures + successes;
      const failureRate = total > 0 ? failures / total : 0;

      signatures.push({
        id: `state-${st.id}`,
        kind: 'state',
        refId: st.id,
        vector: [drift, failureRate, total > 0 ? Math.min(1, total / 20) : 0],
        lastUpdatedAt: now
      });
    }

    return signatures;
  }

  private buildClusters(signatures: RegressionSignature[]): RegressionCluster[] {
    const clusters: RegressionCluster[] = [];

    const byKind: Record<string, RegressionSignature[]> = {
      selector: [],
      scenario: [],
      state: []
    };

    for (const sig of signatures) {
      byKind[sig.kind].push(sig);
    }

    for (const kind of ['selector', 'scenario', 'state'] as const) {
      const group = byKind[kind];
      if (!group.length) continue;

      // simple 2-cluster split: high vs low drift/failure
      const high: RegressionSignature[] = [];
      const low: RegressionSignature[] = [];

      for (const s of group) {
        const [driftOrFailure, failureRateOrDrift] = s.vector;
        const score = (driftOrFailure + failureRateOrDrift) / 2;
        if (score >= 0.5) high.push(s);
        else low.push(s);
      }

      if (high.length) {
        clusters.push({
          id: `${kind}-high-risk`,
          kind,
          memberIds: high.map(h => h.id),
          centroid: this.centroid(high),
          label: 'High-risk regression cluster'
        });
      }

      if (low.length) {
        clusters.push({
          id: `${kind}-low-risk`,
          kind,
          memberIds: low.map(l => l.id),
          centroid: this.centroid(low),
          label: 'Low-risk cluster'
        });
      }
    }

    return clusters;
  }

  private centroid(signatures: RegressionSignature[]): number[] {
    if (!signatures.length) return [0, 0, 0];
    const dim = signatures[0].vector.length;
    const sum = new Array(dim).fill(0);

    for (const s of signatures) {
      for (let i = 0; i < dim; i++) {
        sum[i] += s.vector[i];
      }
    }

    return sum.map(v => v / signatures.length);
  }

  private buildForecasts(
    signatures: RegressionSignature[],
    clusters: RegressionCluster[]
  ): RegressionForecast[] {
    const forecasts: RegressionForecast[] = [];

    for (const sig of signatures) {
      const cluster = clusters.find(c => c.memberIds.includes(sig.id));
      const [a, b, c] = sig.vector;
      const baseRisk = (a + b) / 2;
      const activity = c;

      const riskScore = Math.min(1, baseRisk * 0.7 + activity * 0.3);

      let horizon: 'short' | 'medium' | 'long' = 'long';
      if (riskScore > 0.7) horizon = 'short';
      else if (riskScore > 0.4) horizon = 'medium';

      const reasonParts: string[] = [];
      reasonParts.push(`Base risk: ${baseRisk.toFixed(2)}`);
      reasonParts.push(`Activity: ${activity.toFixed(2)}`);
      if (cluster && cluster.id.endsWith('high-risk')) {
        reasonParts.push('Member of high-risk cluster.');
      }

      forecasts.push({
        id: `forecast-${sig.id}`,
        kind: sig.kind,
        refId: sig.refId,
        riskScore,
        horizon,
        reason: reasonParts.join(' ')
      });
    }

    return forecasts;
  }
}
