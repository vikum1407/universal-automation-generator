export interface TestMetadata {
  requirementIds: string[];
  requirementKeys: string[];
  journeyIds:     string[];
  endpointIds:    string[];
  uiFlowIds:      string[];
  tags:           string[];
}

export function buildTestMetadata(input: {
  requirementId?:  string;
  requirementKey?: string;
  journeyId?:      string;
  endpointIds?:    string[];
  uiFlowIds?:      string[];
}): TestMetadata {
  const requirementIds  = input.requirementId  ? [input.requirementId]  : [];
  const requirementKeys = input.requirementKey ? [input.requirementKey] : [];
  const journeyIds      = input.journeyId ? [input.journeyId] : [];
  const endpointIds     = input.endpointIds ?? [];
  const uiFlowIds       = input.uiFlowIds  ?? [];

  const tags = [
    ...requirementKeys.map(k => `REQ:${k}`),
    ...journeyIds.map(id => `JOURNEY:${id.slice(0, 8)}`),
    ...endpointIds.map(id => `ENDPOINT:${id.slice(0, 8)}`),
    ...uiFlowIds.map(id => `UIFLOW:${id.slice(0, 8)}`),
  ];

  return { requirementIds, requirementKeys, journeyIds, endpointIds, uiFlowIds, tags };
}

// Renders RTM annotation lines for TypeScript/JavaScript tests
export function buildTSTagComment(meta: TestMetadata): string {
  const lines: string[] = ['// ── RTM Traceability ──────────────────────────────────────'];
  if (meta.requirementIds.length)  lines.push(`// @rtm-req  ${meta.requirementIds.join(' ')}`);
  if (meta.requirementKeys.length) lines.push(`// @rtm-key  ${meta.requirementKeys.join(' ')}`);
  if (meta.journeyIds.length)      lines.push(`// @rtm-journey  ${meta.journeyIds.join(' ')}`);
  if (meta.endpointIds.length)     lines.push(`// @rtm-endpoint ${meta.endpointIds.join(' ')}`);
  if (meta.uiFlowIds.length)       lines.push(`// @rtm-flow ${meta.uiFlowIds.join(' ')}`);
  lines.push('// ────────────────────────────────────────────────────────────');
  return lines.join('\n');
}

// Renders RTM annotation lines for Java tests (Javadoc + TestNG groups)
export function buildJavaTagComment(meta: TestMetadata): string {
  const lines: string[] = ['  /**', '   * RTM Traceability:'];
  if (meta.requirementKeys.length) lines.push(`   * @requirement ${meta.requirementKeys.join(', ')}`);
  if (meta.journeyIds.length)      lines.push(`   * @journey ${meta.journeyIds.join(', ')}`);
  if (meta.endpointIds.length)     lines.push(`   * @endpoint ${meta.endpointIds.join(', ')}`);
  lines.push('   */');
  return lines.join('\n');
}

// Build TestNG groups annotation value (Java)
export function buildTestNGGroups(meta: TestMetadata): string {
  if (!meta.tags.length) return '';
  const group = meta.tags.map(t => `"${t}"`).join(', ');
  return `(groups = {${group}})`;
}

// Build Python markers/docstring
export function buildPythonTagComment(meta: TestMetadata): string {
  const lines: string[] = ['# ── RTM Traceability ──────────────────────────────────────'];
  if (meta.requirementIds.length)  lines.push(`# @rtm-req  ${meta.requirementIds.join(' ')}`);
  if (meta.requirementKeys.length) lines.push(`# @rtm-key  ${meta.requirementKeys.join(' ')}`);
  if (meta.journeyIds.length)      lines.push(`# @rtm-journey  ${meta.journeyIds.join(' ')}`);
  if (meta.endpointIds.length)     lines.push(`# @rtm-endpoint ${meta.endpointIds.join(' ')}`);
  if (meta.uiFlowIds.length)       lines.push(`# @rtm-flow ${meta.uiFlowIds.join(' ')}`);
  lines.push('# ────────────────────────────────────────────────────────────');
  return lines.join('\n');
}
