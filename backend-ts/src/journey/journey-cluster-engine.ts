import { Journey } from './journey-model';
import { JourneyRisk } from './journey-risk-engine';

export interface JourneyCluster {
  id: string;
  label: string;
  journeys: Journey[];
}

export class JourneyClusterEngine {
  cluster(journeys: Journey[], risks: JourneyRisk[]): JourneyCluster[] {
    const clusters: JourneyCluster[] = [];
    const riskMap = new Map(risks.map(r => [r.id, r]));

    // 1. URL‑pattern clusters
    const urlClusters: Record<string, Journey[]> = {
      login: [],
      checkout: [],
      cart: [],
      browsing: [],
      navigation: [],
      generic: []
    };

    for (const j of journeys) {
      const path = j.steps.map(s => s.to.toLowerCase()).join(' ');

      if (path.includes('login')) urlClusters.login.push(j);
      else if (path.includes('checkout')) urlClusters.checkout.push(j);
      else if (path.includes('cart')) urlClusters.cart.push(j);
      else if (path.includes('inventory') || path.includes('product')) urlClusters.browsing.push(j);
      else if (j.steps.length > 2) urlClusters.navigation.push(j);
      else urlClusters.generic.push(j);
    }

    // 2. Step‑sequence similarity clusters (structural)
    const structuralClusters: JourneyCluster[] = [];
    const used = new Set<string>();

    for (const j of journeys) {
      if (used.has(j.id)) continue;

      const cluster: Journey[] = [j];
      used.add(j.id);

      for (const other of journeys) {
        if (other.id === j.id || used.has(other.id)) continue;

        const similarity = this.computeSimilarity(j, other);
        if (similarity >= 0.6) {
          cluster.push(other);
          used.add(other.id);
        }
      }

      structuralClusters.push({
        id: `STRUCT-${structuralClusters.length + 1}`,
        label: `Structural Cluster ${structuralClusters.length + 1}`,
        journeys: cluster
      });
    }

    // 3. Merge URL clusters + structural clusters
    let clusterIndex = 1;

    for (const [label, list] of Object.entries(urlClusters)) {
      if (list.length === 0) continue;

      clusters.push({
        id: `CLUSTER-${clusterIndex++}`,
        label: `${label.toUpperCase()} Cluster`,
        journeys: list
      });
    }

    for (const sc of structuralClusters) {
      clusters.push({
        id: `CLUSTER-${clusterIndex++}`,
        label: sc.label,
        journeys: sc.journeys
      });
    }

    return clusters;
  }

  private computeSimilarity(a: Journey, b: Journey): number {
    const aSteps = a.steps.map(s => s.to);
    const bSteps = b.steps.map(s => s.to);

    const minLen = Math.min(aSteps.length, bSteps.length);
    let matches = 0;

    for (let i = 0; i < minLen; i++) {
      if (aSteps[i] === bSteps[i]) matches++;
    }

    return matches / minLen;
  }
}
