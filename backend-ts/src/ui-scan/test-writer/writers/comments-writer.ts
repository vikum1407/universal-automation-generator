export class CommentsWriter {
  priority(title: string, optimization?: any) {
    if (!optimization) return '';
    const item = optimization.testPlan.find(t => t.title === title);
    if (!item) return '';
    return `
/**
 * Priority: ${item.priority}
 * Reason: ${item.reason}
 */
`;
  }

  regressionSelector(id: string, regression?: any) {
    if (!regression) return '';
    const sig = regression.signatures.find(s => s.kind === 'selector' && s.refId === id);
    if (!sig) return '';
    const forecast = regression.forecasts.find(f => f.kind === 'selector' && f.refId === id);
    return `
/**
 * Regression Risk: ${(forecast?.riskScore ?? 0).toFixed(2)}
 */
`;
  }

  regressionScenario(id: string, regression?: any) {
    if (!regression) return '';
    const sig = regression.signatures.find(s => s.kind === 'scenario' && s.refId === id);
    if (!sig) return '';
    const forecast = regression.forecasts.find(f => f.kind === 'scenario' && f.refId === id);
    return `
/**
 * Regression Risk: ${(forecast?.riskScore ?? 0).toFixed(2)}
 */
`;
  }

  regressionState(id: string, regression?: any) {
    if (!regression) return '';
    const sig = regression.signatures.find(s => s.kind === 'state' && s.refId === id);
    if (!sig) return '';
    const forecast = regression.forecasts.find(f => f.kind === 'state' && f.refId === id);
    return `
/**
 * Regression Risk: ${(forecast?.riskScore ?? 0).toFixed(2)}
 */
`;
  }

  rcaSelector(id: string, rootCause?: any) {
    if (!rootCause) return '';
    const node = rootCause.nodes.find(n => n.kind === 'selector' && n.refId === id);
    if (!node) return '';
    const cluster = rootCause.clusters.find(c => c.nodeIds.includes(node.id));
    if (!cluster) return '';
    return `
/**
 * RCA Cluster: ${cluster.label}
 */
`;
  }

  rcaScenario(id: string, rootCause?: any) {
    if (!rootCause) return '';
    const node = rootCause.nodes.find(n => n.kind === 'scenario' && n.refId === id);
    if (!node) return '';
    const cluster = rootCause.clusters.find(c => c.nodeIds.includes(node.id));
    if (!cluster) return '';
    return `
/**
 * RCA Cluster: ${cluster.label}
 */
`;
  }

  rcaState(id: string, rootCause?: any) {
    if (!rootCause) return '';
    const node = rootCause.nodes.find(n => n.kind === 'state' && n.refId === id);
    if (!node) return '';
    const cluster = rootCause.clusters.find(c => c.nodeIds.includes(node.id));
    if (!cluster) return '';
    return `
/**
 * RCA Cluster: ${cluster.label}
 */
`;
  }
}
