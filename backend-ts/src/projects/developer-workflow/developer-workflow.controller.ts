import { Controller, Get, Post, Param, Query } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";

const OUTPUT_BASE = "./qlitz-output";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function readJson(p: string, fb: any = null): any {
  try { return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : fb; }
  catch { return fb; }
}

function writeJson(p: string, data: any): void {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf8");
}

function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(1664525, s) + 1013904223 >>> 0;
    return s / 4294967296;
  };
}

function strHash(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// ─── Domain types ──────────────────────────────────────────────────────────────

type PRStatus    = "open" | "merged" | "blocked" | "closed";
type RImpact     = "none" | "minor" | "major" | "critical";
type RiskLevel   = "low" | "medium" | "high" | "critical";

interface CodeSymbol {
  name: string;
  type: "function" | "class" | "endpoint" | "selector" | "model" | "unknown";
  location: string;
}

interface ImpactAnalysis {
  changedFiles:           string[];
  impactedRequirements:   string[];
  impactedTests:          string[];
  impactedFlows:          string[];
  impactedEndpoints:      string[];
  riskScoreDelta:         number;
  coverageDelta:          number;
  readinessImpact:        RImpact;
  regressionProbability:  number;
  symbols:                CodeSymbol[];
  riskLevel:              RiskLevel;
}

interface MergeGate {
  pass:       boolean;
  reasons:    string[];
  blockers:   string[];
  warnings:   string[];
}

interface PullRequest {
  id:                     string;
  number:                 number;
  title:                  string;
  author:                 string;
  status:                 PRStatus;
  baseBranch:             string;
  headBranch:             string;
  linesAdded:             number;
  linesRemoved:           number;
  impact:                 ImpactAnalysis;
  mergeGate:              MergeGate;
  insights:               { type: string; severity: string; message: string }[];
  requiredTests:          string[];
  suggestedTests:         string[];
  annotation:             string;
  createdAt:              string;
  analyzedAt:             string;
}

// ─── PR generation data ────────────────────────────────────────────────────────

const AUTHORS = ["alex.morgan", "sam.chen", "priya.patel", "lucas.silva", "emma.johnson", "dev.team"];

const DOMAIN_PR_TITLES: Record<string, string[]> = {
  auth:    ["feat: update user session management", "fix: resolve OAuth callback redirect loop", "feat: implement MFA for admin users", "fix: refresh token expiry not honoured", "chore: rotate session secret keys"],
  payment: ["feat: integrate Stripe SCA flow", "fix: handle declined card response gracefully", "feat: add multi-currency checkout support", "fix: billing address VAT validation", "fix: retry logic for gateway timeouts"],
  product: ["feat: product variant filtering by attribute", "fix: catalog pagination off-by-one", "refactor: optimise search index queries", "feat: low-stock inventory alerts", "fix: category tree sorting regression"],
  order:   ["feat: order status push webhook", "fix: delivery date timezone calculation", "feat: order cancellation with refund flow", "fix: shipping address null pointer", "refactor: split order-fulfilment service"],
  profile: ["feat: avatar upload with image resize", "fix: non-ASCII name encoding regression", "feat: address book with default selection", "fix: phone E.164 validation edge cases", "chore: GDPR data-deletion pipeline"],
  ui:      ["feat: redesign checkout progress stepper", "fix: form validation feedback timing", "feat: keyboard navigation for modal dialogs", "fix: mobile layout breaks on narrow viewport", "refactor: move shared form primitives"],
  generic: ["chore: upgrade runtime dependencies", "fix: null pointer in error-response handler", "feat: structured health-check endpoint", "refactor: remove deprecated legacy adapters", "test: extend contract test coverage"],
};

const BRANCH_PREFIXES = ["feature", "fix", "hotfix", "chore", "refactor"];

// ─── File path derivation ──────────────────────────────────────────────────────

function deriveFilePaths(base: string, domain: string, rng: () => number): string[] {
  const eps: any[]  = readJson(path.join(base, "endpoints.json"), []) ?? [];
  const graph       = readJson(path.join(base, "flow-graph.json"), null);
  const pages: any[] = graph?.pages ?? graph?.nodes ?? [];

  const filePaths: string[] = [];

  // From endpoints
  for (const ep of eps.slice(0, 6)) {
    const raw = (ep.url ?? ep.path ?? "").replace(/https?:\/\/[^/]+/, "").replace(/[{}]/g, "_");
    if (!raw) continue;
    const segs = raw.split("/").filter(Boolean);
    if (segs.length >= 2) {
      filePaths.push(`src/api/${segs.slice(0, 2).join("/")}/${segs[1]}.controller.ts`);
    }
  }

  // From flows
  for (const p of pages.slice(0, 4)) {
    const name = (p.name ?? p.label ?? "page").toString().replace(/\s+/g, "").replace(/[^a-zA-Z0-9]/g, "");
    if (name) filePaths.push(`src/components/${name}/${name}.tsx`);
  }

  // Domain fallbacks
  const DOMAIN_FILES: Record<string, string[]> = {
    auth:    ["src/auth/auth.service.ts", "src/auth/session.middleware.ts", "src/auth/oauth.controller.ts"],
    payment: ["src/payments/payment.service.ts", "src/payments/stripe.adapter.ts", "src/billing/invoice.model.ts"],
    product: ["src/catalog/product.service.ts", "src/search/search.controller.ts", "src/inventory/stock.service.ts"],
    order:   ["src/orders/order.service.ts", "src/fulfillment/shipping.service.ts", "src/orders/webhook.controller.ts"],
    profile: ["src/users/profile.service.ts", "src/users/avatar.controller.ts", "src/gdpr/deletion.service.ts"],
    ui:      ["src/pages/checkout/CheckoutPage.tsx", "src/components/forms/FormField.tsx", "src/layouts/Modal.tsx"],
    generic: ["src/core/error-handler.ts", "src/health/health.controller.ts", "src/config/app.config.ts"],
  };

  const domainFiles = DOMAIN_FILES[domain] ?? DOMAIN_FILES.generic;
  filePaths.push(...domainFiles.slice(0, Math.floor(rng() * 2 + 1)));

  // Deduplicate + cap
  return Array.from(new Set(filePaths)).slice(0, 5);
}

// ─── Domain detection (reused pattern) ────────────────────────────────────────

function detectPrimaryDomain(projectId: string): string {
  const base = path.join(OUTPUT_BASE, projectId);
  const eps: any[] = readJson(path.join(base, "endpoints.json"), []) ?? [];
  const graph  = readJson(path.join(base, "flow-graph.json"), null);
  const pages: any[] = graph?.pages ?? graph?.nodes ?? [];
  const rtm    = readJson(path.join(base, "rtm.json"), null);
  const reqs: any[] = rtm?.requirements ?? [];

  const text = [
    ...eps.map((e: any) => e.url ?? e.path ?? ""),
    ...pages.map((p: any) => p.name ?? p.label ?? ""),
    ...reqs.flatMap((r: any) => r.tags ?? []),
  ].join(" ").toLowerCase();

  if (/payment|billing|stripe|invoice|checkout/.test(text)) return "payment";
  if (/auth|login|oauth|session|token/.test(text))           return "auth";
  if (/product|catalog|inventory|sku/.test(text))            return "product";
  if (/order|fulfil|ship|deliver/.test(text))                return "order";
  if (/profile|customer|user|member/.test(text))             return "profile";
  if (/graph|page|component|form/.test(text))                return "ui";
  return "generic";
}

// ─── Impact computation ────────────────────────────────────────────────────────

function buildImpact(
  projectId: string,
  files: string[],
  linesAdded: number,
  linesRemoved: number,
  rng: () => number,
): ImpactAnalysis {
  const base = path.join(OUTPUT_BASE, projectId);

  const rtm      = readJson(path.join(base, "rtm.json"), null);
  const reqs: any[] = rtm?.requirements ?? [];
  const testRes  = readJson(path.join(base, "test-results.json"), null);
  const testMap: Record<string, string> = testRes?.tests ?? {};
  const testNames = Object.keys(testMap);
  const graph    = readJson(path.join(base, "flow-graph.json"), null);
  const pages: any[] = graph?.pages ?? graph?.nodes ?? [];
  const eps: any[] = readJson(path.join(base, "endpoints.json"), []) ?? [];

  // Sample impacted items proportional to PR size
  const sizeRatio = Math.min(1, (linesAdded + linesRemoved) / 200);
  const nReqs     = Math.max(1, Math.floor(reqs.length * sizeRatio * 0.4));
  const nTests    = Math.max(1, Math.floor(testNames.length * sizeRatio * 0.3));
  const nFlows    = Math.max(1, Math.floor(pages.length * sizeRatio * 0.5));
  const nEps      = Math.max(1, Math.floor(eps.length * sizeRatio * 0.4));

  const impactedRequirements = reqs.slice(0, nReqs).map((r: any) => r.id ?? r.title ?? `REQ-${Math.floor(rng() * 999)}`);
  const impactedTests        = testNames.slice(0, nTests);
  const impactedFlows        = pages.slice(0, nFlows).map((p: any) => p.name ?? p.label ?? `Flow-${Math.floor(rng() * 99)}`);
  const impactedEndpoints    = eps.slice(0, nEps).map((e: any) => `${(e.method ?? "GET").toUpperCase()} ${(e.url ?? e.path ?? "/unknown").replace(/https?:\/\/[^/]+/, "")}`);

  // Regression probability: higher for large PRs affecting tests + critical reqs
  const critReqs = reqs.filter((r: any) => r.businessPriority === "critical" || r.businessPriority === "high");
  const critImpacted = Math.min(critReqs.length, nReqs);
  const baseProbability = sizeRatio * 0.4 + (critImpacted / Math.max(1, reqs.length)) * 0.3 + rng() * 0.3;
  const regressionProbability = Math.round(Math.min(0.95, Math.max(0.05, baseProbability)) * 100) / 100;

  // Coverage delta: tends to drop for large removals, rise for additions
  const coverageDelta = Math.round((linesAdded * 0.3 - linesRemoved * 0.2 + (rng() - 0.5) * 10) * 10) / 10;

  // Risk delta: positive for high regression, negative for test additions
  const riskScoreDelta = Math.round((regressionProbability * 20 - (linesAdded > linesRemoved ? 3 : 0) + (rng() - 0.4) * 8) * 10) / 10;

  const readinessImpact: RImpact =
    regressionProbability >= 0.70 ? "critical" :
    regressionProbability >= 0.50 ? "major" :
    regressionProbability >= 0.25 ? "minor" : "none";

  const riskLevel: RiskLevel =
    regressionProbability >= 0.70 ? "critical" :
    regressionProbability >= 0.50 ? "high" :
    regressionProbability >= 0.25 ? "medium" : "low";

  // Symbols (derived from file paths)
  const symbols: CodeSymbol[] = files.flatMap(f => {
    const parts = f.split("/");
    const filename = parts[parts.length - 1].replace(/\.(ts|tsx)$/, "");
    return [
      { name: filename, type: f.includes("controller") ? "endpoint" : f.includes("component") || f.includes("page") || f.endsWith(".tsx") ? "selector" : "function", location: f },
    ] as CodeSymbol[];
  });

  return { changedFiles: files, impactedRequirements, impactedTests, impactedFlows, impactedEndpoints, riskScoreDelta, coverageDelta, readinessImpact, regressionProbability, symbols, riskLevel };
}

// ─── Merge gate evaluation ─────────────────────────────────────────────────────

function buildMergeGate(impact: ImpactAnalysis, projectId: string): MergeGate {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (impact.regressionProbability >= 0.70) {
    blockers.push(`Regression probability ${Math.round(impact.regressionProbability * 100)}% exceeds 70% threshold`);
  }
  if (impact.readinessImpact === "critical") {
    blockers.push("Merge would drop project readiness to not-ready");
  }
  if (impact.coverageDelta < -10) {
    blockers.push(`Coverage would drop by ${Math.abs(impact.coverageDelta)}% below budget`);
  }

  const insightRaw  = readJson(path.join(OUTPUT_BASE, projectId, "insights.json"), null);
  const insights: any[] = Array.isArray(insightRaw) ? insightRaw : (insightRaw?.insights ?? []);
  const critOpen    = insights.filter((i: any) => i.severity === "critical" && i.status === "open").length;
  if (critOpen > 0) {
    blockers.push(`${critOpen} open critical insight${critOpen > 1 ? "s" : ""} must be resolved before merge`);
  }

  if (impact.regressionProbability >= 0.40 && impact.regressionProbability < 0.70) {
    warnings.push(`Regression probability ${Math.round(impact.regressionProbability * 100)}% — consider adding more tests`);
  }
  if (impact.coverageDelta < 0 && impact.coverageDelta >= -10) {
    warnings.push(`Coverage will decrease by ${Math.abs(impact.coverageDelta)}%`);
  }
  if (impact.readinessImpact === "major") {
    warnings.push("Readiness will downgrade from ready → at-risk");
  }
  if (impact.impactedFlows.length >= 2) {
    warnings.push(`${impact.impactedFlows.length} flows impacted — run full regression suite`);
  }

  return { pass: blockers.length === 0, reasons: [...blockers, ...warnings], blockers, warnings };
}

// ─── PR insights ───────────────────────────────────────────────────────────────

function buildPRInsights(impact: ImpactAnalysis, projectId: string): { type: string; severity: string; message: string }[] {
  const out: { type: string; severity: string; message: string }[] = [];

  if (impact.regressionProbability >= 0.60) {
    out.push({ type: "code-regression-risk", severity: "high", message: `High regression probability (${Math.round(impact.regressionProbability * 100)}%) — ${impact.impactedTests.length} test${impact.impactedTests.length !== 1 ? "s" : ""} at risk` });
  }
  if (impact.coverageDelta < -5) {
    out.push({ type: "code-coverage-drop", severity: "high", message: `Coverage will drop by ${Math.abs(impact.coverageDelta).toFixed(1)}% — review uncovered requirements` });
  }
  if (impact.impactedRequirements.some((r: string) => r.includes("critical") || r.includes("CRIT"))) {
    out.push({ type: "code-risk", severity: "critical", message: "This change affects at least one critical requirement" });
  }
  if (impact.impactedEndpoints.length >= 3) {
    out.push({ type: "code-affects-shared-endpoint", severity: "medium", message: `${impact.impactedEndpoints.length} endpoints impacted — check cross-project usage` });
  }
  if (impact.impactedFlows.length >= 2) {
    out.push({ type: "code-affects-critical-flow", severity: "medium", message: `${impact.impactedFlows.length} flows affected: ${impact.impactedFlows.slice(0, 2).join(", ")}` });
  }
  if (impact.riskScoreDelta > 10) {
    out.push({ type: "code-risk", severity: "medium", message: `Risk score will increase by +${impact.riskScoreDelta.toFixed(1)} points` });
  }

  return out;
}

// ─── Test suggestions ──────────────────────────────────────────────────────────

function buildTestSuggestions(impact: ImpactAnalysis, domain: string): { required: string[]; suggested: string[] } {
  const DOMAIN_TESTS: Record<string, { req: string[]; sug: string[] }> = {
    auth:    { req: ["test_login_invalid_credentials", "test_session_expiry"], sug: ["test_concurrent_sessions", "test_mfa_bypass_attempt"] },
    payment: { req: ["test_payment_declined_card", "test_payment_zero_amount"], sug: ["test_payment_extreme_amounts", "test_payment_currency_mismatch"] },
    product: { req: ["test_product_not_found", "test_category_empty"], sug: ["test_product_search_unicode", "test_variant_out_of_stock"] },
    order:   { req: ["test_order_invalid_status", "test_order_missing_fields"], sug: ["test_order_cancellation_race", "test_delivery_date_past"] },
    profile: { req: ["test_profile_missing_required_fields", "test_phone_invalid_format"], sug: ["test_profile_unicode_name", "test_avatar_oversized_file"] },
    ui:      { req: ["test_form_submit_invalid", "test_navigation_mobile"], sug: ["test_form_keyboard_submit", "test_modal_escape_key"] },
    generic: { req: ["test_null_input_handling", "test_error_response_format"], sug: ["test_concurrent_requests", "test_max_payload_size"] },
  };

  const base = DOMAIN_TESTS[domain] ?? DOMAIN_TESTS.generic;

  const extraRequired = impact.impactedFlows
    .slice(0, 2)
    .map(f => `test_${f.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/__+/g, "_")}_regression`);

  const extraSuggested = impact.impactedEndpoints
    .slice(0, 2)
    .map(e => `test_${e.split(" ")[1]?.replace(/[^a-z0-9]/g, "_") ?? "endpoint"}_edge_case`);

  return {
    required:  [...base.req, ...extraRequired].slice(0, 4),
    suggested: [...base.sug, ...extraSuggested].slice(0, 4),
  };
}

// ─── PR annotation (markdown) ─────────────────────────────────────────────────

function buildAnnotation(pr: Omit<PullRequest, "annotation">): string {
  const { impact, mergeGate, insights, requiredTests, suggestedTests } = pr;
  const gateIcon = mergeGate.pass ? "✅" : "🚫";
  const lines: string[] = [
    `## ${gateIcon} Qlitz Impact Analysis — PR #${pr.number}`,
    "",
    `| Metric | Value |`,
    `|---|---|`,
    `| Regression Probability | **${Math.round(impact.regressionProbability * 100)}%** |`,
    `| Readiness Impact | **${impact.readinessImpact}** |`,
    `| Coverage Delta | **${impact.coverageDelta >= 0 ? "+" : ""}${impact.coverageDelta.toFixed(1)}%** |`,
    `| Risk Score Delta | **${impact.riskScoreDelta >= 0 ? "+" : ""}${impact.riskScoreDelta.toFixed(1)}** |`,
    `| Changed Files | **${impact.changedFiles.length}** |`,
    `| Impacted Requirements | **${impact.impactedRequirements.length}** |`,
    `| Impacted Tests | **${impact.impactedTests.length}** |`,
    `| Impacted Flows | **${impact.impactedFlows.length}** |`,
    `| Impacted Endpoints | **${impact.impactedEndpoints.length}** |`,
    "",
  ];

  if (!mergeGate.pass && mergeGate.blockers.length > 0) {
    lines.push("### 🚫 Merge Blockers");
    mergeGate.blockers.forEach(b => lines.push(`- ❌ ${b}`));
    lines.push("");
  }

  if (mergeGate.warnings.length > 0) {
    lines.push("### ⚠️ Warnings");
    mergeGate.warnings.forEach(w => lines.push(`- ⚠️ ${w}`));
    lines.push("");
  }

  if (insights.length > 0) {
    lines.push("### 🔍 Insights");
    insights.forEach(i => lines.push(`- **[${i.severity}]** ${i.message}`));
    lines.push("");
  }

  if (requiredTests.length > 0) {
    lines.push("### ✅ Required Tests");
    requiredTests.forEach(t => lines.push(`- \`${t}\``));
    lines.push("");
  }

  if (suggestedTests.length > 0) {
    lines.push("### 💡 Suggested Tests");
    suggestedTests.forEach(t => lines.push(`- \`${t}\``));
    lines.push("");
  }

  if (impact.impactedFlows.length > 0) {
    lines.push("### 🔄 Impacted Flows");
    impact.impactedFlows.forEach(f => lines.push(`- ${f}`));
    lines.push("");
  }

  lines.push("---");
  lines.push(`*Analyzed by Qlitz at ${pr.analyzedAt}*`);

  return lines.join("\n");
}

// ─── PR catalog generation ─────────────────────────────────────────────────────

function generatePRs(projectId: string): PullRequest[] {
  const seed   = strHash(projectId);
  const rng    = lcg(seed);
  const domain = detectPrimaryDomain(projectId);
  const titles = DOMAIN_PR_TITLES[domain] ?? DOMAIN_PR_TITLES.generic;
  const base   = path.join(OUTPUT_BASE, projectId);

  const count = Math.floor(rng() * 4 + 6); // 6-10 PRs
  const prs: PullRequest[] = [];
  const now   = Date.now();

  const STATUSES: PRStatus[] = ["merged", "merged", "merged", "open", "open", "blocked", "merged", "closed", "open", "merged"];

  for (let i = 0; i < count; i++) {
    const irng       = lcg(strHash(projectId + String(i)));
    const titleIdx   = i % titles.length;
    const title      = titles[titleIdx];
    const slug       = title.replace(/^[a-z]+:\s*/i, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
    const prefix     = BRANCH_PREFIXES[Math.floor(irng() * BRANCH_PREFIXES.length)];
    const headBranch = `${prefix}/${slug}`;
    const author     = AUTHORS[Math.floor(irng() * AUTHORS.length)];
    const daysAgo    = Math.floor(irng() * 28 + 1);
    const createdAt  = new Date(now - daysAgo * 86_400_000).toISOString();
    const linesAdded   = Math.floor(irng() * 200 + 20);
    const linesRemoved = Math.floor(irng() * 80 + 5);
    const files      = deriveFilePaths(base, domain, irng);
    const impact     = buildImpact(projectId, files, linesAdded, linesRemoved, irng);
    const mergeGate  = buildMergeGate(impact, projectId);
    const prInsights = buildPRInsights(impact, projectId);
    const tests      = buildTestSuggestions(impact, domain);

    const status: PRStatus = mergeGate.blockers.length > 0 && (STATUSES[i % STATUSES.length] === "open")
      ? "blocked"
      : STATUSES[i % STATUSES.length];

    const prBase: Omit<PullRequest, "annotation"> = {
      id: randomUUID(), number: 100 + i + Math.floor(irng() * 50),
      title, author, status,
      baseBranch: "main", headBranch,
      linesAdded, linesRemoved,
      impact, mergeGate,
      insights: prInsights,
      requiredTests: tests.required,
      suggestedTests: tests.suggested,
      createdAt,
      analyzedAt: new Date(now - Math.floor(irng() * 2) * 3_600_000).toISOString(),
    };

    prs.push({ ...prBase, annotation: buildAnnotation(prBase) });
  }

  return prs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function loadOrGeneratePRs(projectId: string): PullRequest[] {
  const p = path.join(OUTPUT_BASE, projectId, "workflow-prs.json");
  if (fs.existsSync(p)) {
    const cached = readJson(p, null);
    if (Array.isArray(cached) && cached.length > 0) return cached;
  }
  const prs = generatePRs(projectId);
  writeJson(p, prs);
  return prs;
}

// ─── Project-scoped controller ─────────────────────────────────────────────────

@Controller("projects/:id/workflow")
export class WorkflowController {

  @Get("prs")
  listPRs(@Param("id") id: string, @Query("status") status?: string) {
    const prs = loadOrGeneratePRs(id);
    const filtered = status ? prs.filter(p => p.status === status) : prs;
    return {
      total: filtered.length,
      open:    prs.filter(p => p.status === "open").length,
      blocked: prs.filter(p => p.status === "blocked").length,
      merged:  prs.filter(p => p.status === "merged").length,
      prs: filtered.map(p => ({
        id: p.id, number: p.number, title: p.title, author: p.author,
        status: p.status, headBranch: p.headBranch,
        linesAdded: p.linesAdded, linesRemoved: p.linesRemoved,
        regressionProbability: p.impact.regressionProbability,
        readinessImpact: p.impact.readinessImpact,
        coverageDelta: p.impact.coverageDelta,
        riskLevel: p.impact.riskLevel,
        mergeGatePass: p.mergeGate.pass,
        insightCount: p.insights.length,
        createdAt: p.createdAt,
      })),
    };
  }

  @Get("prs/:prId")
  getPR(@Param("id") id: string, @Param("prId") prId: string) {
    const prs = loadOrGeneratePRs(id);
    const pr  = prs.find(p => p.id === prId || String(p.number) === prId);
    return pr ?? { error: "PR not found" };
  }

  @Get("prs/:prId/annotation")
  getAnnotation(@Param("id") id: string, @Param("prId") prId: string) {
    const prs = loadOrGeneratePRs(id);
    const pr  = prs.find(p => p.id === prId || String(p.number) === prId);
    if (!pr) return { error: "PR not found" };
    return { prId: pr.id, number: pr.number, markdown: pr.annotation };
  }

  @Get("merge-gate")
  mergeGate(@Param("id") id: string) {
    const prs     = loadOrGeneratePRs(id);
    const openPRs = prs.filter(p => p.status === "open" || p.status === "blocked");
    const blockedCount = openPRs.filter(p => !p.mergeGate.pass).length;
    return {
      openPRs: openPRs.length,
      blocked: blockedCount,
      allPass: blockedCount === 0,
      prs: openPRs.map(p => ({
        id: p.id, number: p.number, title: p.title,
        pass: p.mergeGate.pass, blockers: p.mergeGate.blockers, warnings: p.mergeGate.warnings,
      })),
    };
  }

  @Post("analyze")
  reanalyze(@Param("id") id: string) {
    const p = path.join(OUTPUT_BASE, id, "workflow-prs.json");
    if (fs.existsSync(p)) fs.unlinkSync(p);
    const prs = loadOrGeneratePRs(id);
    return { message: "PRs re-analyzed", count: prs.length };
  }
}

// ─── Org-scoped controller ─────────────────────────────────────────────────────

@Controller("org/workflow")
export class OrgWorkflowController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("dashboard")
  async dashboard(@Query("projectIds") projectIds?: string) {
    const projects = await this.prisma.project.findMany({ take: 100 });
    const filterSet = projectIds ? new Set(projectIds.split(",")) : null;

    const allPRs: (PullRequest & { projectId: string; projectName: string })[] = [];

    for (const proj of projects) {
      if (filterSet && !filterSet.has(proj.id)) continue;
      const name = (proj as any).name ?? proj.id;
      try {
        const prs = loadOrGeneratePRs(proj.id);
        prs.forEach(pr => allPRs.push({ ...pr, projectId: proj.id, projectName: name }));
      } catch { /* skip unscanned projects */ }
    }

    const open    = allPRs.filter(p => p.status === "open");
    const blocked = allPRs.filter(p => p.status === "blocked");
    const merged  = allPRs.filter(p => p.status === "merged");

    const risky   = allPRs
      .filter(p => p.impact.regressionProbability >= 0.50)
      .sort((a, b) => b.impact.regressionProbability - a.impact.regressionProbability)
      .slice(0, 10);

    const coverageDrop = allPRs
      .filter(p => p.impact.coverageDelta < -5)
      .sort((a, b) => a.impact.coverageDelta - b.impact.coverageDelta)
      .slice(0, 10);

    const affectingCriticalFlows = allPRs
      .filter(p => p.impact.impactedFlows.length >= 2)
      .slice(0, 10);

    const avgRegression = allPRs.length
      ? Math.round(allPRs.reduce((a, p) => a + p.impact.regressionProbability, 0) / allPRs.length * 100)
      : 0;

    return {
      generatedAt: new Date().toISOString(),
      summary: {
        totalPRs: allPRs.length,
        open: open.length,
        blocked: blocked.length,
        merged: merged.length,
        avgRegressionRisk: avgRegression,
        totalInsights: allPRs.reduce((a, p) => a + p.insights.length, 0),
      },
      riskyPRs:                  risky.map(prRow),
      coverageDropPRs:           coverageDrop.map(prRow),
      affectingCriticalFlowsPRs: affectingCriticalFlows.map(prRow),
      blockedPRs:                blocked.map(prRow),
    };
  }
}

function prRow(p: PullRequest & { projectId: string; projectName: string }) {
  return {
    id: p.id, number: p.number, title: p.title, author: p.author,
    status: p.status, projectId: p.projectId, projectName: p.projectName,
    regressionProbability: p.impact.regressionProbability,
    readinessImpact: p.impact.readinessImpact,
    coverageDelta: p.impact.coverageDelta,
    riskLevel: p.impact.riskLevel,
    mergeGatePass: p.mergeGate.pass,
    blockers: p.mergeGate.blockers,
    insightCount: p.insights.length,
    createdAt: p.createdAt,
  };
}
