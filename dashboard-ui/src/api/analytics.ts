import { api } from "./client";
import type {
  SuiteOverview,
  TestDetail,
  RunDetail
} from "./types";

const BASE = "/api/analytics";

export const AnalyticsAPI = {
  getSuites(): Promise<SuiteOverview[]> {
    return api.get(`${BASE}/suites`);
  },

  getTestDetail(testId: string): Promise<TestDetail> {
    return api.get(`${BASE}/tests/${testId}`);
  },

  getRunDetail(runId: string): Promise<RunDetail> {
    return api.get(`${BASE}/runs/${runId}`);
  },

  getFailureClusters(testId: string) {
    return api.get(`${BASE}/tests/${testId}/clusters`);
  },

  getFailureHeatmap(testId: string) {
    return api.get(`${BASE}/tests/${testId}/heatmap`);
  },

  getFixDiff(runId: string) {
    return api.get(`${BASE}/runs/${runId}/fix-diff`);
  },

  getAutoPatch(runId: string) {
    return api.get(`${BASE}/runs/${runId}/auto-patch`);
  },

  getRunIntelligence(runId: string) {
    return api.get(`${BASE}/runs/${runId}/intelligence`);
  },

  getFlakinessTrend(testId: string) {
    return api.get(`${BASE}/tests/${testId}/flakiness-trend`);
  },

  getStabilityForecast(testId: string) {
    return api.get(`${BASE}/tests/${testId}/stability-forecast`);
  },

  getFailureCorrelation(testId: string) {
    return api.get(`${BASE}/tests/${testId}/failure-correlation`);
  },

  getGlobalTrends() {
    return api.get(`${BASE}/global/trends`);
  },

  getTestRanking() {
    return api.get(`${BASE}/global/test-ranking`);
  },

  getFailureHotspots() {
    return api.get(`${BASE}/global/failure-hotspots`);
  },

  getStabilityLeaderboard() {
    return api.get(`${BASE}/global/stability-leaderboard`);
  },

  getPredictiveFailureModel() {
    return api.get(`${BASE}/global/predictive-failure`);
  },

  getTestImpactAnalysis() {
    return api.get(`${BASE}/global/test-impact`);
  },

  getIntelligentPrioritization() {
    return api.get(`${BASE}/global/prioritization`);
  },

  getProjects() {
    return api.get(`${BASE}/projects`);
  },

  getProjectTrends(projectId: string) {
    return api.get(`${BASE}/projects/${projectId}/trends`);
  },

  getProjectStability(projectId: string) {
    return api.get(`${BASE}/projects/${projectId}/stability`);
  },

  getProjectFlakiness(projectId: string) {
    return api.get(`${BASE}/projects/${projectId}/flakiness`);
  },

  getProjectHotspots(projectId: string) {
    return api.get(`${BASE}/projects/${projectId}/hotspots`);
  },

  getProjectFailureModel(projectId: string) {
    return api.get(`${BASE}/projects/${projectId}/failure-model`);
  },

  search(query: string) {
    return api.get(`${BASE}/search?q=${encodeURIComponent(query)}`);
  },

  aiRewriteQuery(query: string) {
    return api.get(`${BASE}/ai/rewrite?q=${encodeURIComponent(query)}`);
  },

  aiRootCauseQA(query: string) {
    return api.get(`${BASE}/ai/root-cause?q=${encodeURIComponent(query)}`);
  },

  aiScreenshotSearch(query: string) {
    return api.get(`${BASE}/ai/screenshot-search?q=${encodeURIComponent(query)}`);
  },

  getHealingEvents(runId: string) {
    return api.get(`${BASE}/runs/${runId}/healing-events`);
  },

  getHealingSuggestions(runId: string) {
    return api.get(`${BASE}/runs/${runId}/healing-suggestions`);
  },

  getWorkers() {
    return api.get(`${BASE}/cluster/workers`);
  },

  getShardAssignments(runId: string) {
    return api.get(`${BASE}/runs/${runId}/shards`);
  },

  getWorkerEvents() {
    return api.get(`${BASE}/cluster/events`);
  },

  getCPUProfile(runId: string) {
    return api.get(`${BASE}/runs/${runId}/cpu-profile`);
  },

  getMemoryTimeline(runId: string) {
    return api.get(`${BASE}/runs/${runId}/memory-timeline`);
  },

  getBottlenecks(runId: string) {
    return api.get(`${BASE}/runs/${runId}/bottlenecks`);
  },

  getModuleDependencies(runId: string) {
    return api.get(`${BASE}/runs/${runId}/module-deps`);
  },

  getNetworkDependencies(runId: string) {
    return api.get(`${BASE}/runs/${runId}/network-deps`);
  },

  getTestCoupling() {
    return api.get(`${BASE}/global/test-coupling`);
  },

  getReplaySteps(runId: string) {
    return api.get(`${BASE}/runs/${runId}/replay-steps`);
  },

  getSnapshot(snapshotId: string) {
    return api.get(`${BASE}/snapshots/${snapshotId}`);
  },

  getSnapshotDiff(beforeId: string, afterId: string) {
    return api.get(`${BASE}/snapshots/diff?before=${beforeId}&after=${afterId}`);
  },

  getAIGeneratedTests(testId: string) {
    return api.get(`${BASE}/ai/tests?test=${testId}`);
  },

  getAIEdgeCases(testId: string) {
    return api.get(`${BASE}/ai/edge-cases?test=${testId}`);
  },

  getAIAssertionSuggestions(testId: string) {
    return api.get(`${BASE}/ai/assertions?test=${testId}`);
  },

  getQualityScore(testId: string) {
    return api.get(`${BASE}/quality/score?test=${testId}`);
  },

  getReleaseGates() {
    return api.get(`${BASE}/release/gates`);
  },

  getReleaseBlockers() {
    return api.get(`${BASE}/release/blockers`);
  },

  getReleaseRisks() {
    return api.get(`${BASE}/release/risks`);
  },

  getReleaseChecklist() {
    return api.get(`${BASE}/release/checklist`);
  }
};
