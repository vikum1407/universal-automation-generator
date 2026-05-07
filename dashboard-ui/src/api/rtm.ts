const API_BASE = "http://localhost:3000";

// ─────────────────────────────────────────────────────────────
// Core types
// ─────────────────────────────────────────────────────────────

export type ReqType = "ui" | "api" | "hybrid" | "performance" | "security" | "business";
export type Priority = "low" | "medium" | "high" | "critical";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type TestStatus = "passed" | "failed" | "flaky" | "skipped" | "not-run";

export interface RTMRequirementSource {
  pageName?: string | null;
  endpointPath?: string | null;
  method?: string | null;
  flowId?: string | null;
  swaggerRef?: string | null;
  domSelector?: string | null;
}

export interface RTMAILogic {
  generatedBy: string;
  lastImprovedAt: string | null;
  confidenceScore: number;
  reasoning: string;
  steps: string[];
  assertions: string[];
  negativeTests: string[];
}

export interface RTMHistoryEntry {
  timestamp: string;
  change: string;
  actor: string;
}

export interface RTMRequirement {
  id: string;
  title: string;
  description: string;
  type: ReqType;
  source: RTMRequirementSource;
  businessPriority: Priority;
  riskLevel: RiskLevel;
  tags: string[];
  coveredBy: string[];
  covered: boolean;
  specFile: string | null;
  aiLogic: RTMAILogic;
  history: RTMHistoryEntry[];
}

export interface RTMBreakdownRow {
  type?: string;
  businessPriority?: string;
  riskLevel?: string;
  total: number;
  covered: number;
  uncovered: number;
  pct: number;
}

export interface RTMAnalytics {
  totalRequirements: number;
  coveredRequirements: number;
  coveragePercent: number;
  riskScore: number;
  stabilityScore: number;
  aiConfidenceScore: number;
  specFilesFound: number;
  byType: (RTMBreakdownRow & { type: string })[];
  byPriority: (RTMBreakdownRow & { businessPriority: string })[];
  byRisk: (RTMBreakdownRow & { riskLevel: string })[];
  trending: { new: number; updated: number; risky: number };
}

export interface RTMInsights {
  highRiskUncovered: RTMRequirement[];
  duplicateSuspects: { ids: string[]; titles: string[]; similarity: number }[];
  needsRewrite: RTMRequirement[];
  withFailingTests: RTMRequirement[];
  withFlakyTests: RTMRequirement[];
}

export interface RTMEnterpriseResponse {
  generatedAt: string;
  requirements: RTMRequirement[];
  analytics: RTMAnalytics;
  insights: RTMInsights;
}

// ─────────────────────────────────────────────────────────────
// API calls
// ─────────────────────────────────────────────────────────────

export async function fetchRTM(projectId: string): Promise<RTMEnterpriseResponse> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/rtm`);
  if (!res.ok) throw new Error("RTM not found");
  return res.json();
}

export async function regenerateRTM(projectId: string, ids: string[] = []): Promise<void> {
  await fetch(`${API_BASE}/projects/${projectId}/rtm/regenerate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ selectedRequirementIds: ids }),
  });
}

export async function patchRequirement(
  projectId: string,
  reqId: string,
  updates: Partial<RTMRequirement>,
): Promise<void> {
  await fetch(`${API_BASE}/projects/${projectId}/rtm/${reqId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
}

export function exportRTMUrl(projectId: string): string {
  return `${API_BASE}/projects/${projectId}/rtm/export`;
}

// Legacy compat (used by older components)
export type RTMRequirementView = RTMRequirement;
export type RTMResponse = RTMEnterpriseResponse;

// ─────────────────────────────────────────────────────────────
// Domain model types (Phase 1 — database-backed, versioned)
// ─────────────────────────────────────────────────────────────

export type RtmRequirementType   = 'functional' | 'nonFunctional' | 'technical' | 'regression';
export type RtmPriority          = 'P0' | 'P1' | 'P2' | 'P3';
export type RtmRisk              = 'high' | 'medium' | 'low';
export type RtmRequirementStatus = 'draft' | 'approved' | 'deprecated';
export type RtmEndpointMethod    = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export type ImportSource         = 'csv' | 'jira' | 'json';

export interface RtmVersion {
  id:            string;
  rtmRootId:     string;
  versionNumber: number;
  label:         string | null;
  createdAt:     string;
  createdBy:     string | null;
}

export interface RtmDomainRequirement {
  id:           string;
  rtmVersionId: string;
  key:          string;
  title:        string;
  description:  string;
  type:         RtmRequirementType;
  priority:     RtmPriority;
  risk:         RtmRisk;
  status:       RtmRequirementStatus;
  tags:         string[];
  createdAt:    string;
  updatedAt:    string;
}

export interface RtmJourney {
  id:             string;
  rtmVersionId:   string;
  key:            string;
  name:           string;
  description:    string;
  requirementIds: string[];
  createdAt:      string;
}

export interface RtmEndpoint {
  id:             string;
  rtmVersionId:   string;
  key:            string;
  method:         RtmEndpointMethod;
  path:           string;
  serviceName:    string | null;
  description:    string;
  requirementIds: string[];
  createdAt:      string;
}

export interface RTMSnapshot {
  rootId:        string;
  versionId:     string;
  versionNumber: number;
  label:         string | null;
  createdAt:     string;
  requirements:  RtmDomainRequirement[];
  journeys:      RtmJourney[];
  endpoints:     RtmEndpoint[];
}

// ─────────────────────────────────────────────────────────────
// Domain model API calls
// ─────────────────────────────────────────────────────────────

export async function initializeRTM(projectId: string, label?: string): Promise<{ snapshot: RTMSnapshot }> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/rtm/initialize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ label: label ?? "Initial" }),
  });
  if (!res.ok) throw new Error("Failed to initialize RTM");
  return res.json();
}

export async function fetchRTMSnapshot(projectId: string): Promise<RTMSnapshot | null> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/rtm/snapshot`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch RTM snapshot");
  return res.json();
}

export async function importRTM(
  projectId: string,
  source: ImportSource,
  payload: string | object,
  label?: string,
): Promise<RTMSnapshot> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/rtm/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source, payload, label }),
  });
  if (!res.ok) throw new Error("Failed to import RTM");
  return res.json();
}

export async function listRTMVersions(projectId: string): Promise<RtmVersion[]> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/rtm/versions`);
  if (!res.ok) return [];
  return res.json();
}

export async function activateRTMVersion(projectId: string, versionId: string): Promise<void> {
  await fetch(`${API_BASE}/projects/${projectId}/rtm/versions/${versionId}/activate`, {
    method: "PATCH",
  });
}

export async function createRTMRequirement(
  projectId: string,
  dto: Omit<RtmDomainRequirement, "id" | "rtmVersionId" | "createdAt" | "updatedAt">,
): Promise<RtmDomainRequirement> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/rtm/requirements`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error("Failed to create requirement");
  return res.json();
}

export async function updateRTMRequirement(
  projectId: string,
  reqId: string,
  dto: Partial<Omit<RtmDomainRequirement, "id" | "rtmVersionId" | "createdAt" | "updatedAt">>,
): Promise<RtmDomainRequirement> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/rtm/requirements/${reqId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error("Failed to update requirement");
  return res.json();
}

export async function deleteRTMRequirement(projectId: string, reqId: string): Promise<void> {
  await fetch(`${API_BASE}/projects/${projectId}/rtm/requirements/${reqId}`, {
    method: "DELETE",
  });
}

// ─────────────────────────────────────────────────────────────
// Phase 2 — Mapping types
// ─────────────────────────────────────────────────────────────

export type RtmMappingStrength = "primary" | "secondary";

export interface DiscoveredFlow {
  id:        string;
  projectId: string;
  name:      string;
  createdAt: string;
}

export interface DiscoveredEndpoint {
  id:        string;
  projectId: string;
  method:    string;
  path:      string;
  flowId:    string | null;
  createdAt: string;
}

export interface RequirementMappingSummary {
  requirementId: string;
  uiFlows:   { id: string; name: string; strength: string }[];
  endpoints: { id: string; method: string; path: string; strength: string }[];
  journeys:  { id: string; name: string }[];
}

export interface JourneyMappingSummary {
  journeyId:      string;
  requirementIds: string[];
  uiFlows:   { id: string; name: string }[];
  endpoints: { id: string; method: string; path: string }[];
}

export interface MappingSuggestions {
  suggestedFlows:     (DiscoveredFlow   & { score: number })[];
  suggestedEndpoints: (DiscoveredEndpoint & { score: number })[];
}

export interface VersionMappingSummary {
  requirementCount:              number;
  journeyCount:                  number;
  requirementFlowMappings:       number;
  requirementEndpointMappings:   number;
  journeyFlowMappings:           number;
  journeyEndpointMappings:       number;
  unmappedRequirements: { id: string; key: string; title: string }[];
}

// ─────────────────────────────────────────────────────────────
// Phase 2 — Mapping API helpers
// ─────────────────────────────────────────────────────────────

const mappingBase = (p: string, v: string) =>
  `${API_BASE}/projects/${p}/rtm/versions/${v}/mappings`;

export async function listDiscoveredFlows(projectId: string, versionId: string): Promise<DiscoveredFlow[]> {
  const res = await fetch(`${mappingBase(projectId, versionId)}/flows`);
  if (!res.ok) return [];
  return res.json();
}

export async function listDiscoveredEndpoints(projectId: string, versionId: string): Promise<DiscoveredEndpoint[]> {
  const res = await fetch(`${mappingBase(projectId, versionId)}/endpoints`);
  if (!res.ok) return [];
  return res.json();
}

export async function getVersionMappingSummary(projectId: string, versionId: string): Promise<VersionMappingSummary> {
  const res = await fetch(`${mappingBase(projectId, versionId)}/summary`);
  if (!res.ok) throw new Error("Failed to load mapping summary");
  return res.json();
}

export async function getRequirementMappings(
  projectId: string, versionId: string, requirementId: string,
): Promise<RequirementMappingSummary> {
  const res = await fetch(`${mappingBase(projectId, versionId)}/requirements/${requirementId}`);
  if (!res.ok) throw new Error("Failed to load requirement mappings");
  return res.json();
}

export async function getRequirementSuggestions(
  projectId: string, versionId: string, requirementId: string,
): Promise<MappingSuggestions> {
  const res = await fetch(`${mappingBase(projectId, versionId)}/requirements/${requirementId}/suggestions`);
  if (!res.ok) return { suggestedFlows: [], suggestedEndpoints: [] };
  return res.json();
}

export async function linkRequirementToFlow(
  projectId: string, versionId: string, requirementId: string,
  flowId: string, strength: RtmMappingStrength = "primary",
): Promise<void> {
  await fetch(`${mappingBase(projectId, versionId)}/requirements/${requirementId}/ui-flows`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ flowId, strength }),
  });
}

export async function unlinkRequirementFromFlow(
  projectId: string, versionId: string, requirementId: string, flowId: string,
): Promise<void> {
  await fetch(`${mappingBase(projectId, versionId)}/requirements/${requirementId}/ui-flows/${flowId}`, {
    method: "DELETE",
  });
}

export async function linkRequirementToEndpoint(
  projectId: string, versionId: string, requirementId: string,
  discoveredEndpointId: string, strength: RtmMappingStrength = "primary",
): Promise<void> {
  await fetch(`${mappingBase(projectId, versionId)}/requirements/${requirementId}/endpoints`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ discoveredEndpointId, strength }),
  });
}

export async function unlinkRequirementFromEndpoint(
  projectId: string, versionId: string, requirementId: string, endpointId: string,
): Promise<void> {
  await fetch(`${mappingBase(projectId, versionId)}/requirements/${requirementId}/endpoints/${endpointId}`, {
    method: "DELETE",
  });
}

export async function getJourneyMappings(
  projectId: string, versionId: string, journeyId: string,
): Promise<JourneyMappingSummary> {
  const res = await fetch(`${mappingBase(projectId, versionId)}/journeys/${journeyId}`);
  if (!res.ok) throw new Error("Failed to load journey mappings");
  return res.json();
}

export async function getJourneySuggestions(
  projectId: string, versionId: string, journeyId: string,
): Promise<MappingSuggestions> {
  const res = await fetch(`${mappingBase(projectId, versionId)}/journeys/${journeyId}/suggestions`);
  if (!res.ok) return { suggestedFlows: [], suggestedEndpoints: [] };
  return res.json();
}

export async function linkJourneyToFlow(
  projectId: string, versionId: string, journeyId: string, flowId: string,
): Promise<void> {
  await fetch(`${mappingBase(projectId, versionId)}/journeys/${journeyId}/ui-flows`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ flowId }),
  });
}

export async function unlinkJourneyFromFlow(
  projectId: string, versionId: string, journeyId: string, flowId: string,
): Promise<void> {
  await fetch(`${mappingBase(projectId, versionId)}/journeys/${journeyId}/ui-flows/${flowId}`, {
    method: "DELETE",
  });
}

export async function linkJourneyToEndpoint(
  projectId: string, versionId: string, journeyId: string, discoveredEndpointId: string,
): Promise<void> {
  await fetch(`${mappingBase(projectId, versionId)}/journeys/${journeyId}/endpoints`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ discoveredEndpointId }),
  });
}

export async function unlinkJourneyFromEndpoint(
  projectId: string, versionId: string, journeyId: string, endpointId: string,
): Promise<void> {
  await fetch(`${mappingBase(projectId, versionId)}/journeys/${journeyId}/endpoints/${endpointId}`, {
    method: "DELETE",
  });
}

// ─────────────────────────────────────────────────────────────
// Phase 3 — Coverage types
// ─────────────────────────────────────────────────────────────

export interface RequirementCoverage {
  id:                string;
  projectId:         string;
  rtmVersionId:      string;
  requirementId:     string;
  hasTests:          boolean;
  totalTests:        number;
  passedTests:       number;
  failedTests:       number;
  skippedTests:      number;
  uiFlowsTotal:      number;
  uiFlowsCovered:    number;
  endpointsTotal:    number;
  endpointsCovered:  number;
  journeysTotal:     number;
  journeysCovered:   number;
  coverageScore:     number;
  riskWeightedScore: number;
  lastComputedAt:    string;
  requirementKey?:   string;
  requirementTitle?: string;
  risk?:             string;
  priority?:         string;
}

export interface EndpointCoverage {
  id:             string;
  projectId:      string;
  rtmVersionId:   string;
  endpointId:     string;
  totalTests:     number;
  passedTests:    number;
  failedTests:    number;
  coverageScore:  number;
  lastComputedAt: string;
  endpointKey?:   string;
  method?:        string;
  path?:          string;
}

export interface JourneyCoverage {
  id:             string;
  projectId:      string;
  rtmVersionId:   string;
  journeyId:      string;
  totalTests:     number;
  passedTests:    number;
  failedTests:    number;
  coverageScore:  number;
  lastComputedAt: string;
  journeyKey?:    string;
  journeyName?:   string;
}

export interface RTMCoverageSummary {
  projectId:                   string;
  rtmVersionId:                string;
  requirementsTotal:           number;
  requirementsCovered:         number;
  requirementsCoveragePercent: number;
  endpointsTotal:              number;
  endpointsCovered:            number;
  endpointsCoveragePercent:    number;
  journeysTotal:               number;
  journeysCovered:             number;
  journeysCoveragePercent:     number;
  riskWeightedCoverageScore:   number;
  lastComputedAt:              string | null;
}

export interface RtmTestTag {
  id:        string;
  projectId: string;
  testId:    string;
  tagType:   string;
  tagValue:  string;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────
// Phase 3 — Coverage API helpers
// ─────────────────────────────────────────────────────────────

const coverageBase = (p: string, v: string) =>
  `${API_BASE}/projects/${p}/rtm/versions/${v}/coverage`;

export async function recomputeCoverage(projectId: string, versionId: string): Promise<void> {
  await fetch(`${coverageBase(projectId, versionId)}/recompute`, { method: "POST" });
}

function fwQuery(frameworkId?: string) {
  return frameworkId ? `?frameworkId=${encodeURIComponent(frameworkId)}` : "";
}

export async function getCoverageSummary(
  projectId: string, versionId: string, frameworkId?: string,
): Promise<RTMCoverageSummary> {
  const res = await fetch(`${coverageBase(projectId, versionId)}/summary${fwQuery(frameworkId)}`);
  if (!res.ok) throw new Error("Coverage not computed yet");
  return res.json();
}

export async function getRequirementCoverages(
  projectId: string, versionId: string, frameworkId?: string,
): Promise<RequirementCoverage[]> {
  const res = await fetch(`${coverageBase(projectId, versionId)}/requirements${fwQuery(frameworkId)}`);
  if (!res.ok) return [];
  return res.json();
}

export async function getEndpointCoverages(
  projectId: string, versionId: string, frameworkId?: string,
): Promise<EndpointCoverage[]> {
  const res = await fetch(`${coverageBase(projectId, versionId)}/endpoints${fwQuery(frameworkId)}`);
  if (!res.ok) return [];
  return res.json();
}

export async function getJourneyCoverages(
  projectId: string, versionId: string, frameworkId?: string,
): Promise<JourneyCoverage[]> {
  const res = await fetch(`${coverageBase(projectId, versionId)}/journeys${fwQuery(frameworkId)}`);
  if (!res.ok) return [];
  return res.json();
}

export async function addRtmTestTag(
  projectId: string, versionId: string,
  testId: string, tagType: string, tagValue: string,
): Promise<RtmTestTag> {
  const res = await fetch(`${coverageBase(projectId, versionId)}/tags`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ testId, tagType, tagValue }),
  });
  if (!res.ok) throw new Error("Failed to add tag");
  return res.json();
}

export async function removeRtmTestTag(
  projectId: string, versionId: string, tagId: string,
): Promise<void> {
  await fetch(`${coverageBase(projectId, versionId)}/tags/${tagId}`, { method: "DELETE" });
}

// ─────────────────────────────────────────────────────────────
// Phase 4 — Test Generation types + API
// ─────────────────────────────────────────────────────────────

export type GenerationStrategy = "smoke" | "regression" | "full";

export interface GenerateTestsDto {
  framework:     string;
  language:      string;
  strategy:      GenerationStrategy;
  includeUI:     boolean;
  includeAPI:    boolean;
  includeHybrid: boolean;
  baseUrl:       string;
}

export interface GeneratedFile {
  filePath:  string;
  testCount: number;
  type:      "ui" | "api" | "hybrid";
  reqKey:    string;
}

export interface GenerationResult {
  totalFiles:  number;
  totalTests:  number;
  uiFiles:     number;
  apiFiles:    number;
  hybridFiles: number;
  files:       GeneratedFile[];
  outputDir:   string;
}

function generationBase(projectId: string, versionId: string): string {
  return `${API_BASE}/projects/${projectId}/rtm/versions/${versionId}/generate`;
}

export async function generateRtmTests(
  projectId: string, versionId: string, dto: GenerateTestsDto,
): Promise<GenerationResult> {
  const res = await fetch(generationBase(projectId, versionId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error("Test generation failed");
  return res.json();
}

export async function listGeneratedFiles(
  projectId: string, versionId: string,
): Promise<string[]> {
  const res = await fetch(`${generationBase(projectId, versionId)}/results`);
  if (!res.ok) return [];
  return res.json();
}

// ─────────────────────────────────────────────────────────────
// Phase 5 — Coverage Gap Analysis types + API
// ─────────────────────────────────────────────────────────────

export interface RequirementGap {
  id:                     string;
  projectId:              string;
  rtmVersionId:           string;
  requirementId:          string;
  hasNoTests:             boolean;
  hasInsufficientTests:   boolean;
  missingUITests:         boolean;
  missingAPITests:        boolean;
  missingHybridTests:     boolean;
  missingNegativeTests:   boolean;
  missingBoundaryTests:   boolean;
  missingRegressionDepth: boolean;
  risk:                   string;
  priority:               string;
  coverageScore:          number;
  riskWeightedScore:      number;
  suggestedUITests:       number;
  suggestedAPITests:      number;
  suggestedHybridTests:   number;
  lastComputedAt:         string;
  requirementKey?:        string;
  requirementTitle?:      string;
}

export interface EndpointGap {
  id:                   string;
  projectId:            string;
  rtmVersionId:         string;
  endpointId:           string;
  hasNoTests:           boolean;
  hasInsufficientTests: boolean;
  missingPositiveTests: boolean;
  missingNegativeTests: boolean;
  missingBoundaryTests: boolean;
  coverageScore:        number;
  lastComputedAt:       string;
  endpointKey?:         string;
  method?:              string;
  path?:                string;
}

export interface JourneyGap {
  id:                      string;
  projectId:               string;
  rtmVersionId:            string;
  journeyId:               string;
  hasNoTests:              boolean;
  hasInsufficientTests:    boolean;
  missingEndToEndFlow:     boolean;
  missingAlternativePaths: boolean;
  coverageScore:           number;
  lastComputedAt:          string;
  journeyKey?:             string;
  journeyName?:            string;
}

export interface GapSummary {
  projectId:                string;
  rtmVersionId:             string;
  requirementsTotal:        number;
  requirementsNoTests:      number;
  requirementsInsufficient: number;
  requirementsHighRiskGap:  number;
  endpointsTotal:           number;
  endpointsNoTests:         number;
  endpointsInsufficient:    number;
  journeysTotal:            number;
  journeysNoTests:          number;
  journeysInsufficient:     number;
  lastComputedAt:           string | null;
}

export interface GenerationTask {
  type:           "ui" | "api" | "hybrid";
  target:         "requirement" | "endpoint" | "journey";
  targetId:       string;
  targetKey:      string;
  suggestedCount: number;
  reason:         string;
  priority:       "must" | "should" | "optional";
}

export interface GenerationPlan {
  projectId:    string;
  rtmVersionId: string;
  generatedAt:  string;
  tasks:        GenerationTask[];
  summary: { must: number; should: number; optional: number; total: number };
}

function gapBase(projectId: string, versionId: string): string {
  return `${API_BASE}/projects/${projectId}/rtm/${versionId}/gaps`;
}

export async function recomputeGaps(projectId: string, versionId: string): Promise<void> {
  await fetch(`${gapBase(projectId, versionId)}/recompute`, { method: "POST" });
}

export async function getGapSummary(projectId: string, versionId: string): Promise<GapSummary | null> {
  const res = await fetch(`${gapBase(projectId, versionId)}/summary`);
  if (!res.ok) return null;
  return res.json();
}

export async function getRequirementGaps(projectId: string, versionId: string): Promise<RequirementGap[]> {
  const res = await fetch(`${gapBase(projectId, versionId)}/requirements`);
  if (!res.ok) return [];
  return res.json();
}

export async function getEndpointGaps(projectId: string, versionId: string): Promise<EndpointGap[]> {
  const res = await fetch(`${gapBase(projectId, versionId)}/endpoints`);
  if (!res.ok) return [];
  return res.json();
}

export async function getJourneyGaps(projectId: string, versionId: string): Promise<JourneyGap[]> {
  const res = await fetch(`${gapBase(projectId, versionId)}/journeys`);
  if (!res.ok) return [];
  return res.json();
}

export async function getGenerationPlan(projectId: string, versionId: string): Promise<GenerationPlan | null> {
  const res = await fetch(`${gapBase(projectId, versionId)}/generation-plan`);
  if (!res.ok) return null;
  return res.json();
}

// ─────────────────────────────────────────────────────────────
// Phase 6 — Coverage Closure Loop types + API
// ─────────────────────────────────────────────────────────────

export type ClosureJobStatus = "pending" | "running" | "completed" | "failed" | "cancelled";
export type IterationStatus  = "pending" | "running" | "completed" | "failed";

export interface CoverageSummarySnapshot {
  requirementsTotal:           number;
  requirementsCovered:         number;
  requirementsCoveragePercent: number;
  endpointsTotal:              number;
  endpointsCovered:            number;
  endpointsCoveragePercent:    number;
  journeysTotal:               number;
  journeysCovered:             number;
  journeysCoveragePercent:     number;
  riskWeightedCoverageScore:   number;
}

export interface ClosureJob {
  id:                        string;
  projectId:                 string;
  rtmVersionId:              string;
  framework:                 string;
  language:                  string;
  baseUrl:                   string;
  targetRequirementCoverage: number;
  targetEndpointCoverage:    number | null;
  targetJourneyCoverage:     number | null;
  maxIterations:             number;
  maxTestsPerIteration:      number;
  prioritizeHighRisk:        boolean;
  dryRun:                    boolean;
  status:                    ClosureJobStatus;
  currentIteration:          number;
  testsGeneratedTotal:       number;
  createdAt:                 string;
  completedAt:               string | null;
  failureReason:             string | null;
  iterations?:               ClosureIteration[];
}

export interface ClosureIteration {
  id:              string;
  closureJobId:    string;
  iterationNumber: number;
  coverageBefore:  CoverageSummarySnapshot;
  coverageAfter:   CoverageSummarySnapshot | null;
  generationPlan:  GenerationPlan | null;
  testsGenerated:  number;
  testsExecuted:   number;
  status:          IterationStatus;
  startedAt:       string | null;
  completedAt:     string | null;
  failureReason:   string | null;
}

export interface StartClosureJobDto {
  framework:                 string;
  language:                  string;
  baseUrl:                   string;
  targetRequirementCoverage: number;
  targetEndpointCoverage?:   number;
  targetJourneyCoverage?:    number;
  maxIterations:             number;
  maxTestsPerIteration:      number;
  prioritizeHighRisk:        boolean;
  dryRun:                    boolean;
}

function closureBase(projectId: string, versionId: string): string {
  return `${API_BASE}/projects/${projectId}/rtm/${versionId}/closure-jobs`;
}

export async function startClosureJob(
  projectId: string, versionId: string, dto: StartClosureJobDto,
): Promise<ClosureJob> {
  const res = await fetch(closureBase(projectId, versionId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error("Failed to start closure job");
  return res.json();
}

export async function listClosureJobs(projectId: string, versionId: string): Promise<ClosureJob[]> {
  const res = await fetch(closureBase(projectId, versionId));
  if (!res.ok) return [];
  return res.json();
}

export async function getClosureJob(projectId: string, versionId: string, jobId: string): Promise<ClosureJob | null> {
  const res = await fetch(`${closureBase(projectId, versionId)}/${jobId}`);
  if (!res.ok) return null;
  return res.json();
}

export async function cancelClosureJob(projectId: string, versionId: string, jobId: string): Promise<void> {
  await fetch(`${closureBase(projectId, versionId)}/${jobId}/cancel`, { method: "POST" });
}

export async function getClosureIterations(projectId: string, versionId: string, jobId: string): Promise<ClosureIteration[]> {
  const res = await fetch(`${closureBase(projectId, versionId)}/${jobId}/iterations`);
  if (!res.ok) return [];
  return res.json();
}

// ─────────────────────────────────────────────────────────────
// Phase 9 — RTM AI
// ─────────────────────────────────────────────────────────────

const aiBase = (p: string, v: string) =>
  `${API_BASE}/projects/${p}/rtm/versions/${v}/ai`;

export interface ExtractedRequirement {
  title:              string;
  description:        string;
  type:               'functional' | 'nonFunctional';
  priority:           'P0' | 'P1' | 'P2' | 'P3';
  risk:               'high' | 'medium' | 'low';
  acceptanceCriteria: string[];
}

export interface RequirementCluster {
  clusterId:      string;
  label:          string;
  requirementIds: string[];
  duplicates:     string[];
  conflicts:      string[];
}

export interface RewriteResult {
  requirementId:       string;
  improvedTitle:       string;
  improvedDescription: string;
  acceptanceCriteria:  string[];
  rationale:           string;
}

export interface AIRiskScore {
  requirementId: string;
  risk:          'high' | 'medium' | 'low';
  score:         number;
  explanation:   string;
}

export async function extractRequirementsFromText(
  projectId: string,
  versionId: string,
  content:   string,
): Promise<{ extracted: number; requirements: ExtractedRequirement[] }> {
  const res = await fetch(`${aiBase(projectId, versionId)}/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error("Extraction failed");
  return res.json();
}

export async function clusterRequirements(
  projectId: string,
  versionId: string,
): Promise<RequirementCluster[]> {
  const res = await fetch(`${aiBase(projectId, versionId)}/cluster`, { method: "POST" });
  if (!res.ok) throw new Error("Clustering failed");
  return res.json();
}

export async function rewriteRequirement(
  projectId:     string,
  versionId:     string,
  requirementId: string,
  rewriteMode:   'clarity' | 'testability' | 'full',
): Promise<RewriteResult> {
  const res = await fetch(`${aiBase(projectId, versionId)}/rewrite/${requirementId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requirementId, rewriteMode }),
  });
  if (!res.ok) throw new Error("Rewrite failed");
  return res.json();
}

export async function acceptRewrite(
  projectId:           string,
  versionId:           string,
  requirementId:       string,
  improvedTitle:       string,
  improvedDescription: string,
): Promise<void> {
  await fetch(`${aiBase(projectId, versionId)}/rewrite/${requirementId}/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ improvedTitle, improvedDescription }),
  });
}

export async function scoreRequirementRisk(
  projectId:      string,
  versionId:      string,
  requirementIds: string[],
): Promise<AIRiskScore[]> {
  const res = await fetch(`${aiBase(projectId, versionId)}/score-risk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requirementIds }),
  });
  if (!res.ok) throw new Error("Risk scoring failed");
  return res.json();
}

export async function scoreAllRequirementRisk(
  projectId: string,
  versionId: string,
): Promise<AIRiskScore[]> {
  const res = await fetch(`${aiBase(projectId, versionId)}/score-risk/all`, { method: "POST" });
  if (!res.ok) throw new Error("Risk scoring failed");
  return res.json();
}
