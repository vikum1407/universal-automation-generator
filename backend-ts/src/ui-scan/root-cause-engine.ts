import { ReinforcementMemory } from './reinforcement-engine';
import { RegressionMemory } from './regression-engine';
import { UIStateGraph } from './ui-state-engine';
import { UIScenario } from './ui-scenario-engine';

export interface RootCauseNode {
  id: string;
  kind: 'selector' | 'scenario' | 'state' | 'failure' | 'regression';
  refId?: string;
  label: string;
}

export interface RootCauseEdge {
  from: string;
  to: string;
  relation:
    | 'causes'
    | 'correlates'
    | 'shares-selector'
    | 'shares-state'
    | 'shares-scenario'
    | 'shares-regression';
}

export interface RootCauseCluster {
  id: string;
  label: string;
  nodeIds: string[];
  impactScore: number;
  recurrenceProbability: number;
  explanation: string;
}

export interface RootCauseMemory {
  nodes: RootCauseNode[];
  edges: RootCauseEdge[];
  clusters: RootCauseCluster[];
  generatedAt: string;
}

export interface TestFailureLike {
  title: string;
  file?: string;
  error: string;
}

export class RootCauseEngine {
  analyze(
    failures: TestFailureLike[],
    reinforcement: ReinforcementMemory,
    regression: RegressionMemory,
    stateGraph: UIStateGraph,
    scenarios: UIScenario[]
  ): RootCauseMemory {
    const nodes: RootCauseNode[] = [];
    const edges: RootCauseEdge[] = [];

    const selectorNodes = this.buildSelectorNodes(reinforcement, nodes);
    const scenarioNodes = this.buildScenarioNodes(scenarios, nodes);
    const stateNodes = this.buildStateNodes(stateGraph, nodes);
    const failureNodes = this.buildFailureNodes(failures, nodes);
    const regressionNodes = this.buildRegressionNodes(regression, nodes);

    this.linkFailuresToSelectors(failures, failureNodes, selectorNodes, edges);
    this.linkFailuresToScenarios(failures, failureNodes, scenarioNodes, edges);
    this.linkFailuresToStates(failures, failureNodes, stateNodes, edges);
    this.linkSelectorsToRegression(selectorNodes, regressionNodes, regression, edges);
    this.linkScenariosToRegression(scenarioNodes, regressionNodes, regression, edges);
    this.linkStatesToRegression(stateNodes, regressionNodes, regression, edges);

    const clusters = this.buildClusters(nodes, edges, failures, regression);

    return {
      nodes,
      edges,
      clusters,
      generatedAt: new Date().toISOString()
    };
  }

  private buildSelectorNodes(
    reinforcement: ReinforcementMemory,
    nodes: RootCauseNode[]
  ): RootCauseNode[] {
    const out: RootCauseNode[] = [];
    for (const s of reinforcement.selectors) {
      const node: RootCauseNode = {
        id: `selector-${s.requirementId}`,
        kind: 'selector',
        refId: s.requirementId,
        label: `Selector for requirement ${s.requirementId}`
      };
      nodes.push(node);
      out.push(node);
    }
    return out;
  }

  private buildScenarioNodes(
    scenarios: UIScenario[],
    nodes: RootCauseNode[]
  ): RootCauseNode[] {
    const out: RootCauseNode[] = [];
    for (const s of scenarios) {
      const node: RootCauseNode = {
        id: `scenario-${s.id}`,
        kind: 'scenario',
        refId: s.id,
        label: s.title
      };
      nodes.push(node);
      out.push(node);
    }
    return out;
  }

  private buildStateNodes(
    stateGraph: UIStateGraph,
    nodes: RootCauseNode[]
  ): RootCauseNode[] {
    const out: RootCauseNode[] = [];
    for (const st of stateGraph.states) {
      const node: RootCauseNode = {
        id: `state-${st.id}`,
        kind: 'state',
        refId: st.id,
        label: st.label
      };
      nodes.push(node);
      out.push(node);
    }
    return out;
  }

  private buildFailureNodes(
    failures: TestFailureLike[],
    nodes: RootCauseNode[]
  ): RootCauseNode[] {
    const out: RootCauseNode[] = [];
    failures.forEach((f, idx) => {
      const node: RootCauseNode = {
        id: `failure-${idx + 1}`,
        kind: 'failure',
        label: f.title
      };
      nodes.push(node);
      out.push(node);
    });
    return out;
  }

  private buildRegressionNodes(
    regression: RegressionMemory,
    nodes: RootCauseNode[]
  ): RootCauseNode[] {
    const out: RootCauseNode[] = [];
    for (const sig of regression.signatures) {
      const node: RootCauseNode = {
        id: `regression-${sig.id}`,
        kind: 'regression',
        refId: sig.refId,
        label: `Regression signature (${sig.kind})`
      };
      nodes.push(node);
      out.push(node);
    }
    return out;
  }

  private linkFailuresToSelectors(
    failures: TestFailureLike[],
    failureNodes: RootCauseNode[],
    selectorNodes: RootCauseNode[],
    edges: RootCauseEdge[]
  ) {
    failures.forEach((f, idx) => {
      const failureNode = failureNodes[idx];
      for (const sel of selectorNodes) {
        if (f.title.includes(sel.refId ?? '')) {
          edges.push({
            from: failureNode.id,
            to: sel.id,
            relation: 'shares-selector'
          });
        }
      }
    });
  }

  private linkFailuresToScenarios(
    failures: TestFailureLike[],
    failureNodes: RootCauseNode[],
    scenarioNodes: RootCauseNode[],
    edges: RootCauseEdge[]
  ) {
    failures.forEach((f, idx) => {
      const failureNode = failureNodes[idx];
      for (const sc of scenarioNodes) {
        if (f.title.includes(sc.label)) {
          edges.push({
            from: failureNode.id,
            to: sc.id,
            relation: 'shares-scenario'
          });
        }
      }
    });
  }

  private linkFailuresToStates(
    failures: TestFailureLike[],
    failureNodes: RootCauseNode[],
    stateNodes: RootCauseNode[],
    edges: RootCauseEdge[]
  ) {
    failures.forEach((f, idx) => {
      const failureNode = failureNodes[idx];
      for (const st of stateNodes) {
        if (f.title.includes(st.label)) {
          edges.push({
            from: failureNode.id,
            to: st.id,
            relation: 'shares-state'
          });
        }
      }
    });
  }

  private linkSelectorsToRegression(
    selectorNodes: RootCauseNode[],
    regressionNodes: RootCauseNode[],
    regression: RegressionMemory,
    edges: RootCauseEdge[]
  ) {
    for (const sel of selectorNodes) {
      const sig = regression.signatures.find(
        s => s.kind === 'selector' && s.refId === sel.refId
      );
      if (!sig) continue;

      const regNode = regressionNodes.find(r => r.id === `regression-${sig.id}`);
      if (!regNode) continue;

      edges.push({
        from: sel.id,
        to: regNode.id,
        relation: 'correlates'
      });
    }
  }

  private linkScenariosToRegression(
    scenarioNodes: RootCauseNode[],
    regressionNodes: RootCauseNode[],
    regression: RegressionMemory,
    edges: RootCauseEdge[]
  ) {
    for (const sc of scenarioNodes) {
      const sig = regression.signatures.find(
        s => s.kind === 'scenario' && s.refId === sc.refId
      );
      if (!sig) continue;

      const regNode = regressionNodes.find(r => r.id === `regression-${sig.id}`);
      if (!regNode) continue;

      edges.push({
        from: sc.id,
        to: regNode.id,
        relation: 'correlates'
      });
    }
  }

  private linkStatesToRegression(
    stateNodes: RootCauseNode[],
    regressionNodes: RootCauseNode[],
    regression: RegressionMemory,
    edges: RootCauseEdge[]
  ) {
    for (const st of stateNodes) {
      const sig = regression.signatures.find(
        s => s.kind === 'state' && s.refId === st.refId
      );
      if (!sig) continue;

      const regNode = regressionNodes.find(r => r.id === `regression-${sig.id}`);
      if (!regNode) continue;

      edges.push({
        from: st.id,
        to: regNode.id,
        relation: 'correlates'
      });
    }
  }

  private buildClusters(
    nodes: RootCauseNode[],
    edges: RootCauseEdge[],
    failures: TestFailureLike[],
    regression: RegressionMemory
  ): RootCauseCluster[] {
    const clusters: RootCauseCluster[] = [];

    const failureNodes = nodes.filter(n => n.kind === 'failure');
    const regressionForecasts = regression.forecasts;

    if (!failureNodes.length && !regressionForecasts.length) return clusters;

    const highRiskForecasts = regressionForecasts.filter(f => f.riskScore > 0.7);
    const highRiskIds = new Set(highRiskForecasts.map(f => f.refId));

    const highRiskSelectors = nodes.filter(
      n => n.kind === 'selector' && n.refId && highRiskIds.has(n.refId)
    );
    const highRiskScenarios = nodes.filter(
      n => n.kind === 'scenario' && n.refId && highRiskIds.has(n.refId)
    );
    const highRiskStates = nodes.filter(
      n => n.kind === 'state' && n.refId && highRiskIds.has(n.refId)
    );

    const impactedFailures = new Set<string>();
    for (const e of edges) {
      if (e.relation === 'shares-selector' || e.relation === 'shares-scenario' || e.relation === 'shares-state') {
        impactedFailures.add(e.from);
      }
    }

    const clusterNodes = [
      ...highRiskSelectors,
      ...highRiskScenarios,
      ...highRiskStates,
      ...nodes.filter(n => impactedFailures.has(n.id))
    ];

    if (clusterNodes.length) {
      const impactScore = Math.min(1, clusterNodes.length / Math.max(1, nodes.length));
      const recurrenceProbability = Math.min(
        1,
        highRiskForecasts.reduce((s, f) => s + f.riskScore, 0) /
          Math.max(1, highRiskForecasts.length)
      );

      clusters.push({
        id: 'cluster-high-risk',
        label: 'High-risk root-cause cluster',
        nodeIds: clusterNodes.map(n => n.id),
        impactScore,
        recurrenceProbability,
        explanation:
          'Cluster of high-risk selectors, scenarios, states, and their associated failures and regression signatures.'
      });
    }

    return clusters;
  }
}
