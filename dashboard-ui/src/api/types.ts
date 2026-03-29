export interface SuiteOverview {
  test_id: string;
  total_runs: number;
  passed_runs: number;
  failed_runs: number;
  flaky_runs: number;
  avg_duration_ms: number;
  last_status: string | null;
  last_run_at: string | null;
}

export interface TestAggregate {
  test_id: string;
  total_runs: number;
  passed_runs: number;
  failed_runs: number;
  flaky_runs: number;
  avg_duration_ms: number;
  last_status: string | null;
  last_run_at: string | null;
}

export interface DurationBucket {
  bucket: number;
  min_duration_ms: number;
  max_duration_ms: number;
  avg_duration_ms: number;
  count: number;
}

export interface RecentRun {
  run_id: string;
  status: string;
  duration_ms: number;
  started_at: string;
  finished_at: string;
}

export interface TestDetail {
  aggregate: TestAggregate | null;
  histogram: DurationBucket[];
  recent: RecentRun[];
}

export interface RunMetadata {
  run_id: string;
  test_id: string;
  status: string;
  duration_ms: number;
  started_at: string;
  finished_at: string;
  browser: string;
  browser_version: string | null;
  os: string;
  os_version: string;
  device: string | null;
  project: string;
  worker_index: number;
  retry: number;
  parallel_index: number;
}

export interface TimelineEvent {
  id: string;
  event_type: string;
  payload: any;
  timestamp: string;
}

export interface AIFailure {
  category: string;
  root_cause: string;
  suggestion: string;
  risk_level: string;
}

export interface AISuggestion {
  suggestion: string;
  code_snippet: string;
}

export interface AIInsights {
  insights: string;
}

export interface DistributedInfo {
  machine_id: string;
  ci_provider: string | null;
  ci_run_id: string | null;
  ci_job: string | null;
  ci_worker: string | null;
  shard_index: number;
  shard_total: number;
}

export interface RunDetail {
  run: RunMetadata | null;
  timeline: TimelineEvent[];
  ai: AIFailure | null;
  fix: AISuggestion | null;
  insights: AIInsights | null;
  distributed: DistributedInfo | null;
}

export interface FailureCluster {
  cluster_id: string;
  count: number;
  signature: string;
  examples: string[];
}

export interface HeatmapCell {
  day: string;
  hour: number;
  failures: number;
}

export interface FixDiff {
  before: string;
  after: string;
}

export interface AutoPatch {
  patch: string;
  instructions: string;
}

export interface RunIntelligence {
  summary: string;
  risk_score: number;
  stability_index: number;
  failure_probability: number;
}

export interface FlakinessPoint {
  date: string;
  flakiness: number;
}

export interface StabilityForecastPoint {
  date: string;
  stability: number;
}

export interface FailureCorrelationEdge {
  source: string;
  target: string;
  weight: number;
}

export interface GlobalTrendPoint {
  date: string;
  total_runs: number;
  failures: number;
  flakiness: number;
}

export interface TestRankingItem {
  test_id: string;
  failure_rate: number;
  flakiness: number;
  avg_duration_ms: number;
}

export interface FailureHotspot {
  file: string;
  count: number;
}

export interface StabilityLeaderboardItem {
  test_id: string;
  stability_index: number;
}

export interface PredictiveFailurePoint {
  test_id: string;
  probability: number;
}

export interface TestImpactItem {
  test_id: string;
  impacted_tests: string[];
  impact_score: number;
}

export interface PrioritizationItem {
  test_id: string;
  priority_score: number;
  rationale: string;
}

export interface ProjectInfo {
  project_id: string;
  name: string;
}

export interface ProjectTrendPoint {
  date: string;
  total_runs: number;
  failures: number;
}

export interface ProjectStabilityPoint {
  date: string;
  stability: number;
}

export interface ProjectFlakinessPoint {
  date: string;
  flakiness: number;
}

export interface ProjectHotspot {
  file: string;
  count: number;
}

export interface ProjectFailureModelPoint {
  test_id: string;
  probability: number;
}

export interface SearchResult {
  type: "test" | "run" | "error" | "log" | "screenshot";
  id: string;
  project_id: string;
  score: number;
  snippet: string;
  metadata: Record<string, any>;
}

export interface AIQueryRewrite {
  rewritten: string;
  intent: string;
}

export interface AIRootCauseAnswer {
  answer: string;
  confidence: number;
}

export interface AIScreenshotResult {
  screenshot_id: string;
  project_id: string;
  score: number;
  thumbnail_base64: string;
}

export interface HealingEvent {
  id: string;
  timestamp: string;
  selector: string;
  healed_selector: string;
  confidence: number;
  reason: string;
}

export interface HealingSuggestion {
  original: string;
  suggestion: string;
  rationale: string;
}

export interface WorkerNode {
  id: string;
  name: string;
  status: "healthy" | "degraded" | "offline";
  cpu: number;
  memory: number;
  running_tests: number;
}

export interface ShardAssignment {
  worker_id: string;
  test_id: string;
  shard_index: number;
}

export interface WorkerEvent {
  id: string;
  timestamp: string;
  worker_id: string;
  event: string;
}

export interface CPUProfileNode {
  name: string;
  value: number;
  children?: CPUProfileNode[];
}

export interface MemoryPoint {
  timestamp: string;
  used_mb: number;
}

export interface Bottleneck {
  id: string;
  description: string;
  severity: "low" | "medium" | "high";
  location: string;
}

export interface ModuleDependency {
  source: string;
  target: string;
}

export interface NetworkDependency {
  url: string;
  method: string;
  count: number;
}

export interface TestCouplingEdge {
  test_a: string;
  test_b: string;
  weight: number;
}

export interface ReplayStep {
  id: string;
  timestamp: string;
  action: string;
  selector: string | null;
  snapshot_id: string | null;
}

export interface DOMSnapshot {
  id: string;
  html: string;
}

export interface SnapshotDiff {
  before_id: string;
  after_id: string;
  diff_html: string;
}

export interface AIGeneratedTest {
  id: string;
  title: string;
  code: string;
  rationale: string;
}

export interface AIEdgeCase {
  id: string;
  description: string;
  risk: "low" | "medium" | "high";
}

export interface AIAssertionSuggestion {
  id: string;
  assertion: string;
  rationale: string;
}

export interface QualityScore {
  stability_index: number;
  coverage_score: number;
  risk_score: number;
  release_readiness: number;
  rationale: string;
}

export interface ReleaseGate {
  id: string;
  name: string;
  status: "pass" | "fail" | "warn";
  rationale: string;
}

export interface ReleaseBlocker {
  id: string;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
}

export interface ReleaseRiskItem {
  id: string;
  category: string;
  likelihood: number;
  impact: number;
}

export interface ReleaseChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}
