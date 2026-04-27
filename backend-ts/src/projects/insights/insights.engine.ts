import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";

const BASE = "./qlitz-output";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type InsightType =
  | "risk-hotspot"
  | "coverage-gap"
  | "flaky-cluster"
  | "critical-flow-instability"
  | "endpoint-risk"
  | "ai-impact"
  | "auto-heal-opportunity"
  | "quality-debt"
  | "trend-anomaly";

export type InsightSeverity = "low" | "medium" | "high" | "critical";
export type InsightStatus = "open" | "in-progress" | "resolved" | "dismissed";

export interface InsightAction {
  id: string;
  type: string;
  label: string;
  description?: string;
  target?: Record<string, any>;
}

export interface Insight {
  id: string;
  projectId: string;
  type: InsightType;
  severity: InsightSeverity;
  status: InsightStatus;
  title: string;
  description: string;
  area: string;
  createdAt: string;
  updatedAt: string;
  metricsSnapshot: Record<string, number>;
  suggestedActions: InsightAction[];
  linkedEntities: {
    requirementIds?: string[];
    endpointIds?: string[];
    flowIds?: string[];
    testIds?: string[];
    autoHealIds?: string[];
  };
  tags: string[];
}

export interface InsightFilters {
  types?: InsightType[];
  severities?: InsightSeverity[];
  statuses?: InsightStatus[];
}

// ─── File helpers ───────────────────────────────────────────────────────────────

function loadJson<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return null;
  }
}

function insightsFile(projectId: string) {
  return path.join(BASE, projectId, "insights.json");
}

function loadInsights(projectId: string): Insight[] {
  return loadJson<Insight[]>(insightsFile(projectId)) ?? [];
}

function saveInsights(projectId: string, insights: Insight[]) {
  const dir = path.join(BASE, projectId);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(insightsFile(projectId), JSON.stringify(insights, null, 2), "utf8");
}

// ─── Risk inference ─────────────────────────────────────────────────────────────

const HIGH_RISK_ENDPOINT_KEYWORDS = [
  "login", "logout", "auth", "token", "password", "refresh",
  "payment", "checkout", "order", "billing", "invoice",
  "admin", "user", "account", "register", "delete", "webhook",
];

function inferEndpointRisk(method: string, epPath: string, tags: string[] = []): InsightSeverity {
  const lower = (epPath + " " + tags.join(" ")).toLowerCase();
  const isWrite = ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());
  const hasKeyword = HIGH_RISK_ENDPOINT_KEYWORDS.some(k => lower.includes(k));

  if (lower.includes("payment") || lower.includes("checkout") || lower.includes("billing")) return "critical";
  if (lower.includes("auth") || lower.includes("login") || lower.includes("password")) return "high";
  if (hasKeyword && isWrite) return "high";
  if (hasKeyword) return "medium";
  if (isWrite) return "low";
  return "low";
}

function reqSeverity(r: any): InsightSeverity {
  if (r.businessPriority === "critical") return "critical";
  if (r.riskLevel === "high" || r.businessPriority === "high") return "high";
  if (r.riskLevel === "medium" || r.businessPriority === "medium") return "medium";
  return "low";
}

// ─── Generators ─────────────────────────────────────────────────────────────────

function genRiskHotspots(projectId: string, existing: Insight[]): Insight[] {
  const rtm = loadJson<any>(path.join(BASE, projectId, "rtm.json"));
  if (!rtm?.requirements) return [];

  const uncoveredHighRisk = (rtm.requirements as any[]).filter(
    r => (!r.coveredBy || r.coveredBy.length === 0) &&
      (r.riskLevel === "high" || r.businessPriority === "critical" || r.businessPriority === "high")
  );

  if (!uncoveredHighRisk.length) return [];

  const grouped: Record<string, any[]> = {};
  for (const r of uncoveredHighRisk) {
    const area = r.source?.pageName || r.source?.endpointPath || r.type || "General";
    if (!grouped[area]) grouped[area] = [];
    grouped[area].push(r);
  }

  const insights: Insight[] = [];
  for (const [area, reqs] of Object.entries(grouped)) {
    const existingKey = `risk-hotspot::${area}`;
    const prev = existing.find(i => i.type === "risk-hotspot" && i.area === area);
    if (prev?.status === "resolved" || prev?.status === "dismissed") continue;

    const hasCritical = reqs.some(r => r.businessPriority === "critical");
    const severity: InsightSeverity = hasCritical ? "critical" : "high";
    const reqIds = reqs.map(r => r.id);
    const count = reqs.length;

    insights.push({
      id: prev?.id ?? randomUUID(),
      projectId,
      type: "risk-hotspot",
      severity,
      status: prev?.status ?? "open",
      title: `${count} high-risk requirement${count > 1 ? "s" : ""} untested in "${area}"`,
      description: `${count} requirement${count > 1 ? "s" : ""} in the "${area}" area ${count > 1 ? "are" : "is"} classified as high-risk or business-critical but have no associated tests. These represent significant exposure — a defect here could directly impact users or core business processes.`,
      area,
      createdAt: prev?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metricsSnapshot: {
        uncoveredHighRisk: count,
        criticalCount: reqs.filter(r => r.businessPriority === "critical").length,
      },
      suggestedActions: [
        { id: randomUUID(), type: "open-rtm", label: "View in RTM", description: "Review requirements and coverage status" },
        { id: randomUUID(), type: "generate-tests", label: "Generate tests", description: "Use AI to generate test cases for these requirements" },
      ],
      linkedEntities: { requirementIds: reqIds },
      tags: ["risk", "coverage", area.toLowerCase().replace(/\s+/g, "-")],
    });
  }
  return insights;
}

function genCoverageGaps(projectId: string, existing: Insight[]): Insight[] {
  const rtm = loadJson<any>(path.join(BASE, projectId, "rtm.json"));
  if (!rtm?.requirements) return [];

  const reqs: any[] = rtm.requirements;
  const total = reqs.length;
  if (!total) return [];

  const covered = reqs.filter(r => r.coveredBy?.length > 0).length;
  const pct = Math.round((covered / total) * 100);

  if (pct >= 80) return []; // good coverage — no gap insight

  const uncovered = reqs.filter(r => !r.coveredBy?.length);
  const severity: InsightSeverity = pct < 30 ? "critical" : pct < 50 ? "high" : pct < 65 ? "medium" : "low";

  const prev = existing.find(i => i.type === "coverage-gap" && i.area === "Overall");
  if (prev?.status === "resolved" || prev?.status === "dismissed") return [];

  return [{
    id: prev?.id ?? randomUUID(),
    projectId,
    type: "coverage-gap",
    severity,
    status: prev?.status ?? "open",
    title: `Test coverage is ${pct}% — ${uncovered.length} requirements untested`,
    description: `Only ${covered} of ${total} requirements (${pct}%) have associated tests. ${uncovered.length} requirements have no test coverage at all. ${pct < 50 ? "This is a significant gap that increases release risk substantially." : "Closing this gap will improve confidence in releases."}`,
    area: "Overall",
    createdAt: prev?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metricsSnapshot: { total, covered, uncovered: uncovered.length, coveragePct: pct },
    suggestedActions: [
      { id: randomUUID(), type: "open-rtm", label: "Open RTM", description: "See all uncovered requirements" },
      { id: randomUUID(), type: "generate-tests", label: "Generate missing tests", description: "AI-generate tests for uncovered requirements" },
    ],
    linkedEntities: { requirementIds: uncovered.slice(0, 20).map(r => r.id) },
    tags: ["coverage", "testing"],
  }];
}

function genEndpointRisk(projectId: string, existing: Insight[]): Insight[] {
  const endpoints = loadJson<any[]>(path.join(BASE, projectId, "endpoints.json"));
  if (!endpoints?.length) return [];

  const specDir = path.join(BASE, projectId, "tests");
  const specFiles: string[] = [];
  if (fs.existsSync(specDir)) specFiles.push(...fs.readdirSync(specDir));
  if (fs.existsSync(path.join(BASE, projectId))) {
    fs.readdirSync(path.join(BASE, projectId))
      .filter(f => f.endsWith(".spec.ts"))
      .forEach(f => specFiles.push(f));
  }
  const specContent = specFiles.map(f => {
    try { return fs.readFileSync(path.join(BASE, projectId, "tests", f), "utf8"); } catch { return ""; }
  }).join("\n");

  const risky = endpoints.filter(ep => {
    const sev = inferEndpointRisk(ep.method, ep.path, ep.tags);
    if (sev === "low") return false;
    const pathSeg = ep.path.replace(/\//g, "").replace(/[{}]/g, "").toLowerCase();
    const isCovered = specContent.includes(ep.path) || specContent.includes(pathSeg);
    return !isCovered;
  });

  if (!risky.length) return [];

  const bySeverity: Record<string, any[]> = { critical: [], high: [], medium: [] };
  for (const ep of risky) {
    const sev = inferEndpointRisk(ep.method, ep.path, ep.tags);
    if (bySeverity[sev]) bySeverity[sev].push(ep);
  }

  const insights: Insight[] = [];
  for (const [sev, eps] of Object.entries(bySeverity)) {
    if (!eps.length) continue;
    const prev = existing.find(i => i.type === "endpoint-risk" && i.tags.includes(sev));
    if (prev?.status === "resolved" || prev?.status === "dismissed") continue;

    insights.push({
      id: prev?.id ?? randomUUID(),
      projectId,
      type: "endpoint-risk",
      severity: sev as InsightSeverity,
      status: prev?.status ?? "open",
      title: `${eps.length} ${sev}-risk endpoint${eps.length > 1 ? "s" : ""} without tests`,
      description: `${eps.length} ${sev}-risk API endpoint${eps.length > 1 ? "s" : ""} ${eps.length > 1 ? "have" : "has"} no test coverage: ${eps.slice(0, 3).map(e => `${e.method} ${e.path}`).join(", ")}${eps.length > 3 ? ` and ${eps.length - 3} more` : ""}. These endpoints handle sensitive operations and should be covered before release.`,
      area: "API Endpoints",
      createdAt: prev?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metricsSnapshot: { untestedEndpoints: eps.length, totalEndpoints: endpoints.length },
      suggestedActions: [
        { id: randomUUID(), type: "open-endpoints", label: "View endpoints", description: "Explore endpoints in the Endpoint Explorer" },
        { id: randomUUID(), type: "generate-tests", label: "Generate API tests", description: "Generate tests for uncovered endpoints" },
      ],
      linkedEntities: { endpointIds: eps.map(e => e.id ?? e.path) },
      tags: ["endpoints", "api", sev],
    });
  }
  return insights;
}

function genFlakyCluster(projectId: string, existing: Insight[]): Insight[] {
  const healStore = loadJson<any>(path.join(BASE, projectId, "auto-heal.json"))
    ?? loadJson<any>(path.join(BASE, projectId, "autoheal-log.json"));

  const heals: any[] = healStore?.heals ?? (Array.isArray(healStore) ? healStore : []);
  if (!heals.length) return [];

  const byTest: Record<string, any[]> = {};
  for (const h of heals) {
    const key = h.testFileName || h.testId || "unknown";
    if (!byTest[key]) byTest[key] = [];
    byTest[key].push(h);
  }

  const repeated = Object.entries(byTest).filter(([, hs]) => hs.length >= 2);
  if (!repeated.length) return [];

  const prev = existing.find(i => i.type === "flaky-cluster");
  if (prev?.status === "resolved" || prev?.status === "dismissed") return [];

  const count = repeated.length;
  const severity: InsightSeverity = count >= 5 ? "high" : count >= 3 ? "medium" : "low";

  return [{
    id: prev?.id ?? randomUUID(),
    projectId,
    type: "flaky-cluster",
    severity,
    status: prev?.status ?? "open",
    title: `${count} test${count > 1 ? "s" : ""} healed multiple times — flakiness cluster detected`,
    description: `${count} test${count > 1 ? "s have" : " has"} required Auto-Heal more than once, suggesting persistent flakiness rather than one-off failures. Repeated healing without root-cause fixes increases maintenance burden and reduces test reliability. Consider reviewing these tests for structural issues.`,
    area: "Test Stability",
    createdAt: prev?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metricsSnapshot: { repeatedlyFlakyTests: count, totalHeals: heals.length },
    suggestedActions: [
      { id: randomUUID(), type: "apply-auto-heal", label: "Review Auto-Heal log", description: "Inspect which tests are repeatedly flaky" },
      { id: randomUUID(), type: "open-replay", label: "Open Replay", description: "Replay failing tests to diagnose root causes" },
    ],
    linkedEntities: { testIds: repeated.map(([k]) => k), autoHealIds: repeated.flatMap(([, hs]) => hs.map(h => h.id)) },
    tags: ["flaky", "stability", "auto-heal"],
  }];
}

function genAutoHealOpportunity(projectId: string, existing: Insight[]): Insight[] {
  const healStore = loadJson<any>(path.join(BASE, projectId, "auto-heal.json"))
    ?? loadJson<any>(path.join(BASE, projectId, "autoheal-log.json"));

  const heals: any[] = healStore?.heals ?? (Array.isArray(healStore) ? healStore : []);
  const pending = heals.filter(h => h.status === "pending" && h.autoApplicable !== false);
  if (pending.length < 2) return [];

  const prev = existing.find(i => i.type === "auto-heal-opportunity");
  if (prev?.status === "resolved" || prev?.status === "dismissed") return [];

  const highConfidence = pending.filter(h => (h.confidence ?? 0) >= 0.8);
  const severity: InsightSeverity = highConfidence.length >= 3 ? "high" : "medium";

  return [{
    id: prev?.id ?? randomUUID(),
    projectId,
    type: "auto-heal-opportunity",
    severity,
    status: prev?.status ?? "open",
    title: `${pending.length} pending Auto-Heal patches ready to apply`,
    description: `${pending.length} Auto-Heal patches are waiting to be applied, including ${highConfidence.length} high-confidence fixes (≥80% confidence). Applying these patches will immediately improve test stability without manual intervention.`,
    area: "Auto-Heal",
    createdAt: prev?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metricsSnapshot: { pendingHeals: pending.length, highConfidenceHeals: highConfidence.length },
    suggestedActions: [
      { id: randomUUID(), type: "apply-auto-heal", label: "Apply pending heals", description: `Apply ${highConfidence.length} high-confidence patches now` },
    ],
    linkedEntities: { autoHealIds: pending.map(h => h.id) },
    tags: ["auto-heal", "quick-win", "stability"],
  }];
}

function genQualityDebt(projectId: string, existing: Insight[]): Insight[] {
  const rtm = loadJson<any>(path.join(BASE, projectId, "rtm.json"));
  const suggestions = loadJson<any[]>(path.join(BASE, projectId, "ai-suggestions.json")) ?? [];
  if (!rtm?.requirements) return [];

  const reqs: any[] = rtm.requirements;
  const uncoveredCount = reqs.filter(r => !r.coveredBy?.length).length;
  const ignoredSuggestions = suggestions.filter(s => s.status === "ignored" || s.status === "dismissed").length;
  const oldUncovered = reqs.filter(r => {
    if (r.coveredBy?.length) return false;
    if (!r.createdAt) return false;
    const age = Date.now() - new Date(r.createdAt).getTime();
    return age > 7 * 24 * 60 * 60 * 1000; // older than 7 days
  });

  if (oldUncovered.length < 3 && ignoredSuggestions < 5) return [];

  const prev = existing.find(i => i.type === "quality-debt");
  if (prev?.status === "resolved" || prev?.status === "dismissed") return [];

  const score = oldUncovered.length * 2 + ignoredSuggestions;
  const severity: InsightSeverity = score > 20 ? "high" : score > 10 ? "medium" : "low";

  return [{
    id: prev?.id ?? randomUUID(),
    projectId,
    type: "quality-debt",
    severity,
    status: prev?.status ?? "open",
    title: `Quality debt accumulating — ${uncoveredCount} long-standing coverage gaps`,
    description: `${oldUncovered.length > 0 ? `${oldUncovered.length} requirements have had no test coverage for over 7 days. ` : ""}${ignoredSuggestions > 0 ? `${ignoredSuggestions} AI suggestions have been ignored. ` : ""}This accumulated debt increases the risk of defects going undetected and makes future testing harder.`,
    area: "Quality",
    createdAt: prev?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metricsSnapshot: {
      longStandingGaps: oldUncovered.length,
      ignoredSuggestions,
      totalUncovered: uncoveredCount,
    },
    suggestedActions: [
      { id: randomUUID(), type: "create-suggestion", label: "Review AI suggestions", description: "Check pending and ignored suggestions" },
      { id: randomUUID(), type: "open-rtm", label: "Prioritize coverage", description: "Use RTM to identify highest-priority gaps" },
    ],
    linkedEntities: { requirementIds: oldUncovered.slice(0, 20).map(r => r.id) },
    tags: ["debt", "coverage", "long-standing"],
  }];
}

function genAIImpact(projectId: string, existing: Insight[]): Insight[] {
  const suggestions = loadJson<any[]>(path.join(BASE, projectId, "ai-suggestions.json")) ?? [];
  const healStore = loadJson<any>(path.join(BASE, projectId, "auto-heal.json"))
    ?? loadJson<any>(path.join(BASE, projectId, "autoheal-log.json"));
  const heals: any[] = healStore?.heals ?? (Array.isArray(healStore) ? healStore : []);

  const appliedHeals = heals.filter(h => h.status === "applied" || h.status === "validated").length;
  const appliedSuggestions = suggestions.filter(s => s.status === "applied").length;
  const pendingSuggestions = suggestions.filter(s => s.status === "pending" || !s.status).length;

  if (appliedHeals + appliedSuggestions < 3 && pendingSuggestions < 5) return [];

  const prev = existing.find(i => i.type === "ai-impact");
  if (prev?.status === "resolved" || prev?.status === "dismissed") return [];

  const hasPositiveImpact = appliedHeals + appliedSuggestions >= 3;
  const severity: InsightSeverity = pendingSuggestions > 10 ? "medium" : "low";

  return [{
    id: prev?.id ?? randomUUID(),
    projectId,
    type: "ai-impact",
    severity,
    status: prev?.status ?? "open",
    title: hasPositiveImpact
      ? `AI has improved quality — ${appliedHeals} heals and ${appliedSuggestions} suggestions applied`
      : `${pendingSuggestions} AI suggestions waiting to be reviewed`,
    description: hasPositiveImpact
      ? `AI assistance has already improved this project: ${appliedHeals} Auto-Heal patches applied (recovering previously flaky tests) and ${appliedSuggestions} AI suggestions implemented. ${pendingSuggestions > 0 ? `${pendingSuggestions} more suggestions are pending review.` : ""}`
      : `${pendingSuggestions} AI-generated test suggestions are waiting for review. Reviewing and applying them could significantly increase test coverage with minimal manual effort.`,
    area: "AI & Automation",
    createdAt: prev?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metricsSnapshot: { appliedHeals, appliedSuggestions, pendingSuggestions },
    suggestedActions: [
      { id: randomUUID(), type: "create-suggestion", label: "Review suggestions", description: `Review ${pendingSuggestions} pending AI suggestions` },
      { id: randomUUID(), type: "apply-auto-heal", label: "View Auto-Heal log", description: "See all AI-driven heals" },
    ],
    linkedEntities: {},
    tags: ["ai", "automation", "quick-win"],
  }];
}

// ─── Critical flow instability generator ────────────────────────────────────────

function genCriticalFlowInstability(projectId: string, existing: Insight[]): Insight[] {
  const rtm = loadJson<any>(path.join(BASE, projectId, "rtm.json"));
  const testResults = loadJson<any>(path.join(BASE, projectId, "test-results.json"));

  if (!rtm?.requirements || !testResults) return [];

  // Find requirements mapped to critical flows (critical priority + ui type with pageName)
  const criticalFlowReqs = (rtm.requirements as any[]).filter(
    r => r.type === "ui" &&
      r.source?.pageName &&
      (r.businessPriority === "critical" || r.riskLevel === "high")
  );

  if (!criticalFlowReqs.length) return [];

  // Check if test results show failures
  const hasFailing = testResults.status === "failed" || (testResults.failures?.length ?? 0) > 0;
  const failureCount: number = testResults.failures?.length ?? (hasFailing ? 1 : 0);

  if (!hasFailing) return [];

  // Group failures by page/flow area
  const failures: string[] = testResults.failures?.map((f: any) => f.file ?? f.test ?? "") ?? [];
  const affectedFlows = criticalFlowReqs.filter(r => {
    const pageName = (r.source?.pageName ?? "").toLowerCase();
    return failures.some((f: string) => f.toLowerCase().includes(pageName.replace(/\s+/g, "-")));
  });

  const affected = affectedFlows.length > 0 ? affectedFlows : criticalFlowReqs.slice(0, 2);
  const prev = existing.find(i => i.type === "critical-flow-instability");
  if (prev?.status === "resolved" || prev?.status === "dismissed") return [];

  const flowNames = [...new Set(affected.map(r => r.source?.pageName ?? "unknown"))];
  const severity: InsightSeverity = affected.some(r => r.businessPriority === "critical") ? "critical" : "high";

  return [{
    id: prev?.id ?? randomUUID(),
    projectId,
    type: "critical-flow-instability",
    severity,
    status: prev?.status ?? "open",
    title: `Critical flow instability detected — ${failureCount} test failure${failureCount > 1 ? "s" : ""} in key flows`,
    description: `${failureCount} test${failureCount > 1 ? "s" : ""} ${failureCount > 1 ? "are" : "is"} failing in flows tied to critical requirements: ${flowNames.slice(0, 3).join(", ")}${flowNames.length > 3 ? ` and ${flowNames.length - 3} more` : ""}. These flows are marked as business-critical — failures here directly impact users and should be resolved immediately.`,
    area: flowNames[0] ?? "Critical Flows",
    createdAt: prev?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metricsSnapshot: {
      failingTests: failureCount,
      criticalFlowsAffected: flowNames.length,
      criticalRequirements: affected.length,
    },
    suggestedActions: [
      { id: randomUUID(), type: "open-replay", label: "Replay failing tests", description: "Watch the failing tests to identify the root cause" },
      { id: randomUUID(), type: "apply-auto-heal", label: "Check Auto-Heal", description: "See if AI can automatically patch these failures" },
      { id: randomUUID(), type: "open-flows", label: "View flow graph", description: "Inspect the affected flows" },
    ],
    linkedEntities: {
      requirementIds: affected.map(r => r.id),
      flowIds: flowNames,
    },
    tags: ["critical", "flow", "failing", "instability"],
  }];
}

// ─── Engine ─────────────────────────────────────────────────────────────────────

export class InsightEngine {
  generate(projectId: string): Insight[] {
    const existing = loadInsights(projectId);

    const fresh: Insight[] = [
      ...genRiskHotspots(projectId, existing),
      ...genCoverageGaps(projectId, existing),
      ...genEndpointRisk(projectId, existing),
      ...genFlakyCluster(projectId, existing),
      ...genAutoHealOpportunity(projectId, existing),
      ...genCriticalFlowInstability(projectId, existing),
      ...genQualityDebt(projectId, existing),
      ...genAIImpact(projectId, existing),
    ];

    // Preserve resolved/dismissed insights not regenerated
    const freshIds = new Set(fresh.map(i => i.id));
    const preserved = existing.filter(
      i => (i.status === "resolved" || i.status === "dismissed") && !freshIds.has(i.id)
    );

    const all = [...fresh, ...preserved];
    saveInsights(projectId, all);
    return all;
  }

  list(projectId: string, filters: InsightFilters = {}): Insight[] {
    const insights = this.generate(projectId);
    return insights.filter(i => {
      if (filters.types?.length && !filters.types.includes(i.type)) return false;
      if (filters.severities?.length && !filters.severities.includes(i.severity)) return false;
      if (filters.statuses?.length && !filters.statuses.includes(i.status)) return false;
      return true;
    }).sort((a, b) => {
      const order: Record<InsightSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
    });
  }

  get(projectId: string, insightId: string): Insight | null {
    const insights = loadInsights(projectId);
    return insights.find(i => i.id === insightId) ?? null;
  }

  updateStatus(projectId: string, insightId: string, status: InsightStatus): Insight | null {
    const insights = loadInsights(projectId);
    const idx = insights.findIndex(i => i.id === insightId);
    if (idx === -1) return null;
    insights[idx] = { ...insights[idx], status, updatedAt: new Date().toISOString() };
    saveInsights(projectId, insights);
    return insights[idx];
  }
}
