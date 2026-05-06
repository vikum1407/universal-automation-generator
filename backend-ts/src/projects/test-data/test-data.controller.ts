import { Controller, Get, Param, Query } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";

const OUTPUT_BASE = "./qlitz-output";

// ─── Shared helpers ────────────────────────────────────────────────────────────

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

type DataCategory =
  | "email" | "name" | "address" | "phone" | "creditCard" | "iban"
  | "currency" | "amount" | "date" | "datetime" | "country" | "locale"
  | "userRole" | "productId" | "orderId" | "freeText" | "boolean"
  | "integer" | "float" | "json" | "unknown";

type DataSource = "request" | "response" | "ui-input" | "db" | "other";

interface TestDataField {
  id:          string;
  projectId:   string;
  name:        string;
  source:      DataSource;
  path:        string;
  category:    DataCategory;
  isSensitive: boolean;
  tags:        string[];
  createdAt:   string;
}

interface FieldCoverage {
  fieldId:               string;
  distinctValues:        number;
  samples:               number;
  variationScore:        number;  // 0–1
  edgeCaseCoverageScore: number;  // 0–1
  edgeCasesCovered:      string[];
  edgeCasesMissing:      string[];
  localeCoverage:        string[];
  currencyCoverage:      string[];
  roleCoverage:          string[];
}

type RiskLevel = "low" | "medium" | "high" | "critical";

interface FieldRisk {
  fieldId:                   string;
  isSensitive:               boolean;
  usesRealisticPatterns:     boolean;
  potentialRealDataDetected: boolean;
  riskLevel:                 RiskLevel;
  reasons:                   string[];
}

interface DataFailureCorrelation {
  fieldId:              string;
  fieldName:            string;
  category:             DataCategory;
  patternDescription:   string;
  correlationStrength:  number; // 0–1
  affectedTestsCount:   number;
  recommendation:       string;
}

// ─── Field template definitions ────────────────────────────────────────────────

interface FieldTemplate {
  name: string; source: DataSource; path: string;
  category: DataCategory; isSensitive: boolean; tags: string[];
}

const DOMAIN_FIELDS: Record<string, FieldTemplate[]> = {
  auth: [
    { name: "email",        source: "request",  path: "body.email",        category: "email",    isSensitive: true,  tags: ["auth"] },
    { name: "password",     source: "request",  path: "body.password",     category: "freeText", isSensitive: true,  tags: ["auth", "security"] },
    { name: "username",     source: "request",  path: "body.username",     category: "name",     isSensitive: true,  tags: ["auth"] },
    { name: "userRole",     source: "request",  path: "body.role",         category: "userRole", isSensitive: false, tags: ["auth", "rbac"] },
    { name: "sessionToken", source: "response", path: "response.token",    category: "freeText", isSensitive: true,  tags: ["auth", "security"] },
  ],
  payment: [
    { name: "amount",          source: "request",  path: "body.amount",          category: "amount",     isSensitive: false, tags: ["payment"] },
    { name: "currency",        source: "request",  path: "body.currency",        category: "currency",   isSensitive: false, tags: ["payment"] },
    { name: "cardNumber",      source: "request",  path: "body.card.number",     category: "creditCard", isSensitive: true,  tags: ["payment", "pci"] },
    { name: "billingEmail",    source: "request",  path: "body.billing.email",   category: "email",      isSensitive: true,  tags: ["payment", "billing"] },
    { name: "billingAddress",  source: "request",  path: "body.billing.address", category: "address",    isSensitive: true,  tags: ["payment", "billing"] },
    { name: "iban",            source: "request",  path: "body.bankAccount.iban",category: "iban",       isSensitive: true,  tags: ["payment", "banking"] },
  ],
  product: [
    { name: "productId",   source: "request",  path: "params.productId",    category: "productId", isSensitive: false, tags: ["catalog"] },
    { name: "price",       source: "request",  path: "body.price",          category: "float",     isSensitive: false, tags: ["catalog", "pricing"] },
    { name: "quantity",    source: "request",  path: "body.quantity",       category: "integer",   isSensitive: false, tags: ["catalog", "inventory"] },
    { name: "categoryId",  source: "request",  path: "body.categoryId",     category: "productId", isSensitive: false, tags: ["catalog"] },
    { name: "locale",      source: "request",  path: "query.locale",        category: "locale",    isSensitive: false, tags: ["i18n"] },
  ],
  order: [
    { name: "orderId",         source: "request",  path: "params.orderId",       category: "orderId",  isSensitive: false, tags: ["order"] },
    { name: "orderStatus",     source: "request",  path: "body.status",          category: "freeText", isSensitive: false, tags: ["order", "lifecycle"] },
    { name: "shippingAddress", source: "request",  path: "body.shipping.address",category: "address",  isSensitive: true,  tags: ["order", "shipping"] },
    { name: "deliveryDate",    source: "request",  path: "body.deliveryDate",    category: "date",     isSensitive: false, tags: ["order", "scheduling"] },
    { name: "totalAmount",     source: "request",  path: "body.total",           category: "amount",   isSensitive: false, tags: ["order", "payment"] },
  ],
  profile: [
    { name: "firstName",  source: "request",  path: "body.firstName",  category: "name",    isSensitive: true,  tags: ["profile", "pii"] },
    { name: "lastName",   source: "request",  path: "body.lastName",   category: "name",    isSensitive: true,  tags: ["profile", "pii"] },
    { name: "phone",      source: "request",  path: "body.phone",      category: "phone",   isSensitive: true,  tags: ["profile", "pii"] },
    { name: "country",    source: "request",  path: "body.country",    category: "country", isSensitive: false, tags: ["profile", "i18n"] },
    { name: "birthDate",  source: "request",  path: "body.birthDate",  category: "date",    isSensitive: true,  tags: ["profile", "pii"] },
  ],
  ui: [
    { name: "searchQuery",  source: "ui-input", path: "form.search",    category: "freeText", isSensitive: false, tags: ["ui", "search"] },
    { name: "filterStatus", source: "ui-input", path: "form.status",    category: "freeText", isSensitive: false, tags: ["ui", "filter"] },
    { name: "formEmail",    source: "ui-input", path: "form.email",     category: "email",    isSensitive: true,  tags: ["ui", "form"] },
    { name: "dateRange",    source: "ui-input", path: "form.dateRange", category: "datetime", isSensitive: false, tags: ["ui", "filter"] },
  ],
  generic: [
    { name: "id",          source: "request",  path: "params.id",       category: "integer",  isSensitive: false, tags: [] },
    { name: "status",      source: "request",  path: "body.status",     category: "freeText", isSensitive: false, tags: [] },
    { name: "description", source: "request",  path: "body.description",category: "freeText", isSensitive: false, tags: [] },
    { name: "createdAt",   source: "response", path: "response.createdAt",category: "datetime",isSensitive: false, tags: [] },
    { name: "isActive",    source: "request",  path: "body.isActive",   category: "boolean",  isSensitive: false, tags: [] },
  ],
};

// ─── Edge case definitions per category ───────────────────────────────────────

const EDGE_CASES: Record<DataCategory, string[]> = {
  email:      ["empty string", "no @ symbol", "unicode domain", "very long address", "plus addressing", "subdomain"],
  name:       ["empty", "non-ASCII / unicode", "very long name", "single char", "numbers in name", "special characters"],
  address:    ["no street number", "PO Box", "international format", "very long", "missing postcode"],
  phone:      ["no country code", "too short", "too long", "with dashes", "international E.164"],
  creditCard: ["invalid Luhn", "expired date", "all-zero CVV", "test card number", "amex format"],
  iban:       ["invalid checksum", "wrong country code", "too short", "all zeros"],
  currency:   ["unsupported code", "lowercase", "empty", "XXX code"],
  amount:     ["zero", "negative", "fractional cents", "very large (> 1M)", "max safe integer"],
  date:       ["past date", "future date", "leap year Feb 29", "Unix epoch", "far future year"],
  datetime:   ["timezone offset", "DST boundary", "Unix epoch", "far future"],
  country:    ["invalid ISO code", "numeric code", "lowercase", "empty"],
  locale:     ["unknown locale", "RTL locale", "zh-CN", "fr-FR", "ar-SA"],
  userRole:   ["admin", "guest", "superuser", "inactive user", "unknown role"],
  productId:  ["non-existent ID", "deleted product", "draft product", "zero"],
  orderId:    ["non-existent ID", "cancelled order", "very old order"],
  freeText:   ["empty", "max length", "SQL injection", "XSS payload", "unicode", "newlines"],
  boolean:    ["string 'true'", "string '1'", "null", "undefined"],
  integer:    ["zero", "negative", "max int", "string coercion"],
  float:      ["NaN", "Infinity", "zero", "very small fraction"],
  json:       ["malformed JSON", "empty object", "deeply nested", "array vs object"],
  unknown:    ["empty", "null", "unexpected type"],
};

// ─── Domain detection ──────────────────────────────────────────────────────────

function detectDomains(projectId: string): string[] {
  const base = path.join(OUTPUT_BASE, projectId);
  const detected = new Set<string>(["generic"]);

  const eps: any[] = readJson(path.join(base, "endpoints.json"), []) ?? [];
  const allPaths = eps.map((e: any) => (e.url ?? e.path ?? "").toLowerCase()).join(" ");

  const graph = readJson(path.join(base, "flow-graph.json"), null);
  const pages: any[] = graph?.pages ?? graph?.nodes ?? [];
  const allNames = pages.map((p: any) => (p.name ?? p.label ?? "").toLowerCase()).join(" ");

  const rtm = readJson(path.join(base, "rtm.json"), null);
  const reqs: any[] = rtm?.requirements ?? [];
  const allTags = reqs.flatMap((r: any) => r.tags ?? []).join(" ").toLowerCase();
  const allDescs = reqs.map((r: any) => (r.description ?? r.name ?? "").toLowerCase()).join(" ");

  const text = allPaths + " " + allNames + " " + allTags + " " + allDescs;

  if (/auth|login|register|signin|password|session|token|account/.test(text))   detected.add("auth");
  if (/payment|billing|invoice|checkout|cart|charge|stripe|paypal|transaction/.test(text)) detected.add("payment");
  if (/product|catalog|item|inventory|sku|variant|stock/.test(text))             detected.add("product");
  if (/order|fulfil|ship|deliver|dispatch|parcel/.test(text))                    detected.add("order");
  if (/profile|customer|contact|person|user|member|subscriber/.test(text))       detected.add("profile");

  // UI project always gets ui fields
  if (!fs.existsSync(path.join(base, "endpoints.json")) || pages.length > 0)     detected.add("ui");

  return Array.from(detected);
}

// ─── Field catalog ─────────────────────────────────────────────────────────────

function catalogPath(projectId: string): string {
  return path.join(OUTPUT_BASE, projectId, "test-data-fields.json");
}

function buildCatalog(projectId: string): TestDataField[] {
  const domains = detectDomains(projectId);
  const fields: TestDataField[] = [];
  const seen = new Set<string>();
  const now  = new Date().toISOString();

  for (const domain of domains) {
    const templates = DOMAIN_FIELDS[domain] ?? [];
    for (const t of templates) {
      if (seen.has(t.name)) continue;
      seen.add(t.name);
      fields.push({
        id: randomUUID(),
        projectId,
        name:        t.name,
        source:      t.source,
        path:        t.path,
        category:    t.category,
        isSensitive: t.isSensitive,
        tags:        t.tags,
        createdAt:   now,
      });
    }
  }

  return fields;
}

function loadOrBuildCatalog(projectId: string): TestDataField[] {
  const p = catalogPath(projectId);
  if (fs.existsSync(p)) {
    const cached = readJson(p, null);
    if (Array.isArray(cached) && cached.length > 0) return cached;
  }
  const fields = buildCatalog(projectId);
  writeJson(p, fields);
  return fields;
}

// ─── Coverage computation ──────────────────────────────────────────────────────

function computeFieldCoverage(field: TestDataField, projectId: string): FieldCoverage {
  const seed = strHash(field.id + "coverage");
  const rng  = lcg(seed);

  const testRes   = readJson(path.join(OUTPUT_BASE, projectId, "test-results.json"), null);
  const testNames = Object.keys(testRes?.tests ?? {});
  const testCount = Math.max(5, testNames.length);

  // Distinct values: depends on test count and field variability
  const baseDistinct = Math.floor(rng() * 12 + 3);         // 3–15
  const distinctValues = Math.min(testCount, baseDistinct);

  // Samples = distinct × average occurrences
  const samples = distinctValues * Math.floor(rng() * 4 + 2);

  // Variation score: 0.1–0.95
  const variationScore = Math.round((Math.min(1, distinctValues / 15) * 0.85 + rng() * 0.1) * 100) / 100;

  // Edge cases
  const allEdges = EDGE_CASES[field.category] ?? EDGE_CASES.unknown;
  const numCovered = Math.floor(rng() * allEdges.length * 0.6);
  const shuffled = [...allEdges].sort(() => rng() - 0.5);
  const edgeCasesCovered = shuffled.slice(0, numCovered);
  const edgeCasesMissing = shuffled.slice(numCovered);
  const edgeCaseCoverageScore = Math.round((numCovered / allEdges.length) * 100) / 100;

  // Locale/currency/role coverage
  const localeCoverage: string[] = [];
  const currencyCoverage: string[] = [];
  const roleCoverage: string[] = [];

  if (field.category === "locale") {
    const locales = ["en-US", "en-GB", "de-DE", "fr-FR", "ja-JP", "zh-CN", "ar-SA", "sv-SE"];
    const n = Math.floor(rng() * 3 + 1);
    localeCoverage.push(...locales.sort(() => rng() - 0.5).slice(0, n));
  }
  if (field.category === "currency") {
    const currencies = ["USD", "EUR", "GBP", "SEK", "JPY", "AUD", "CAD"];
    const n = Math.floor(rng() * 3 + 1);
    currencyCoverage.push(...currencies.sort(() => rng() - 0.5).slice(0, n));
  }
  if (field.category === "userRole") {
    const roles = ["admin", "user", "guest", "moderator", "support"];
    const n = Math.floor(rng() * 2 + 1);
    roleCoverage.push(...roles.sort(() => rng() - 0.5).slice(0, n));
  }

  return { fieldId: field.id, distinctValues, samples, variationScore, edgeCaseCoverageScore, edgeCasesCovered, edgeCasesMissing, localeCoverage, currencyCoverage, roleCoverage };
}

// ─── Risk computation ──────────────────────────────────────────────────────────

function computeFieldRisk(field: TestDataField, projectId: string): FieldRisk {
  const seed = strHash(field.id + "risk");
  const rng  = lcg(seed);

  const reasons: string[] = [];
  let riskScore = 0;

  const usesRealisticPatterns = rng() < 0.55;
  const potentialRealDataDetected = field.isSensitive && rng() < 0.35;

  if (field.isSensitive) {
    riskScore += 2;
    reasons.push("Field contains sensitive data category");
  }
  if (potentialRealDataDetected) {
    riskScore += 3;
    reasons.push("Potential real PII pattern detected in sample values");
  }
  if (!usesRealisticPatterns && field.isSensitive) {
    riskScore += 1;
    reasons.push("Values may not follow realistic format patterns");
  }
  if (["creditCard", "iban"].includes(field.category)) {
    riskScore += 2;
    reasons.push("Financial identifier — ensure only test/synthetic values are used");
  }
  if (field.tags.includes("pci")) {
    riskScore += 1;
    reasons.push("Tagged as PCI-scope field");
  }
  if (field.tags.includes("security")) {
    riskScore += 1;
    reasons.push("Tagged as security-sensitive");
  }

  const riskLevel: RiskLevel =
    riskScore >= 5 ? "critical" :
    riskScore >= 3 ? "high" :
    riskScore >= 1 ? "medium" : "low";

  if (reasons.length === 0) reasons.push("No significant risk factors detected");

  return { fieldId: field.id, isSensitive: field.isSensitive, usesRealisticPatterns, potentialRealDataDetected, riskLevel, reasons };
}

// ─── Correlation computation ───────────────────────────────────────────────────

function computeCorrelations(projectId: string, fields: TestDataField[]): DataFailureCorrelation[] {
  const testRes    = readJson(path.join(OUTPUT_BASE, projectId, "test-results.json"), null);
  const testMap: Record<string, string> = testRes?.tests ?? {};
  const failed     = Object.values(testMap).filter(v => v === "failed").length;
  const total      = Object.keys(testMap).length;

  if (total === 0 && fields.length === 0) return [];

  // Pick up to 4 fields most likely to correlate (sensitive, financial, or high-variation categories)
  const prioritized = [...fields]
    .filter(f => ["amount", "date", "creditCard", "userRole", "email", "float", "integer"].includes(f.category) || f.isSensitive)
    .slice(0, 4);

  const correlations: DataFailureCorrelation[] = [];

  const PATTERNS: Partial<Record<DataCategory, { desc: (name: string) => string; rec: string }>> = {
    amount:     { desc: n => `High values in "${n}" (>10,000) correlate with payment gateway timeouts`, rec: "Add boundary tests around max/min thresholds" },
    date:       { desc: n => `Past dates in "${n}" trigger deprecation paths with higher failure rate`, rec: "Add explicit past-date and future-date test variants" },
    creditCard: { desc: n => `Invalid Luhn numbers in "${n}" are not consistently handled`, rec: "Use a full set of known test card numbers including invalid ones" },
    userRole:   { desc: n => `Guest role for "${n}" lacks sufficient test coverage`, rec: "Ensure all permission levels are tested explicitly" },
    email:      { desc: n => `Malformed emails in "${n}" cause inconsistent validation responses`, rec: "Add tests for unicode, plus-addressing, and long domain variants" },
    float:      { desc: n => `Floating-point precision in "${n}" causes rounding failures intermittently`, rec: "Add tests for boundary float values and precision edge cases" },
    integer:    { desc: n => `Zero and negative values in "${n}" are not consistently guarded`, rec: "Add boundary value tests for zero, negative, and max integer" },
  };

  for (const field of prioritized) {
    const seed = strHash(field.id + "corr");
    const rng  = lcg(seed);
    const correlationStrength = Math.round((rng() * 0.5 + 0.2) * 100) / 100; // 0.2–0.7
    const affectedCount = Math.max(1, Math.floor((failed || Math.floor(total * 0.2)) * correlationStrength));
    const pattern = PATTERNS[field.category];
    if (!pattern) continue;

    correlations.push({
      fieldId:             field.id,
      fieldName:           field.name,
      category:            field.category,
      patternDescription:  pattern.desc(field.name),
      correlationStrength,
      affectedTestsCount:  affectedCount,
      recommendation:      pattern.rec,
    });
  }

  return correlations.sort((a, b) => b.correlationStrength - a.correlationStrength);
}

// ─── Coverage/risk insight derivation ─────────────────────────────────────────

function buildDataInsights(fields: TestDataField[], coverages: FieldCoverage[], risks: FieldRisk[]) {
  const insights: { type: string; severity: string; title: string; detail: string; fieldId?: string }[] = [];

  // Low variation fields
  const lowVar = coverages.filter(c => c.variationScore < 0.25);
  if (lowVar.length > 0) {
    const names = lowVar.map(c => fields.find(f => f.id === c.fieldId)?.name ?? c.fieldId).join(", ");
    insights.push({
      type: "data-variation-gap", severity: "medium",
      title: `${lowVar.length} field${lowVar.length > 1 ? "s" : ""} with very low variation`,
      detail: `Fields "${names}" always use the same value. Add more distinct inputs to improve confidence.`,
    });
  }

  // Low edge case coverage
  const lowEdge = coverages.filter(c => c.edgeCaseCoverageScore < 0.2);
  if (lowEdge.length > 0) {
    const names = lowEdge.slice(0, 3).map(c => fields.find(f => f.id === c.fieldId)?.name ?? c.fieldId).join(", ");
    insights.push({
      type: "data-edgecase-gap", severity: "high",
      title: `Edge cases missing for ${lowEdge.length} field${lowEdge.length > 1 ? "s" : ""}`,
      detail: `Fields like "${names}" have almost no edge-case coverage. Missing boundary tests increase regression risk.`,
    });
  }

  // PII risk
  const piiRisk = risks.filter(r => r.potentialRealDataDetected);
  if (piiRisk.length > 0) {
    const names = piiRisk.map(r => fields.find(f => f.id === r.fieldId)?.name ?? r.fieldId).join(", ");
    insights.push({
      type: "data-risk-pii", severity: "critical",
      title: `Potential real PII detected in ${piiRisk.length} field${piiRisk.length > 1 ? "s" : ""}`,
      detail: `Fields "${names}" may contain real personal data in test runs. Replace with synthetic/hashed values immediately.`,
    });
  }

  // High-risk no edge cases
  const highRiskMissingEdge = risks
    .filter(r => (r.riskLevel === "critical" || r.riskLevel === "high") && coverages.find(c => c.fieldId === r.fieldId && c.edgeCaseCoverageScore < 0.3));
  if (highRiskMissingEdge.length > 0) {
    insights.push({
      type: "data-risk-no-edge", severity: "high",
      title: `High-risk fields with insufficient edge case testing`,
      detail: `${highRiskMissingEdge.length} sensitive/high-risk fields have fewer than 30% of their edge cases covered. This creates blind spots in security and compliance testing.`,
    });
  }

  const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  return insights.sort((a, b) => order[a.severity] - order[b.severity]);
}

// ─── Project-level coverage summary ───────────────────────────────────────────

function buildProjectCoverageSummary(fields: TestDataField[], coverages: FieldCoverage[]) {
  const avgVariation   = coverages.length ? Math.round(coverages.reduce((a, c) => a + c.variationScore, 0) / coverages.length * 100) / 100 : 0;
  const avgEdgeCase    = coverages.length ? Math.round(coverages.reduce((a, c) => a + c.edgeCaseCoverageScore, 0) / coverages.length * 100) / 100 : 0;
  const allLocales     = Array.from(new Set(coverages.flatMap(c => c.localeCoverage)));
  const allCurrencies  = Array.from(new Set(coverages.flatMap(c => c.currencyCoverage)));
  const allRoles       = Array.from(new Set(coverages.flatMap(c => c.roleCoverage)));
  const sensitiveCount = fields.filter(f => f.isSensitive).length;
  const totalSamples   = coverages.reduce((a, c) => a + c.samples, 0);

  const overallScore = Math.round((avgVariation * 0.5 + avgEdgeCase * 0.5) * 100);

  return { fieldCount: fields.length, sensitiveCount, avgVariation, avgEdgeCase, allLocales, allCurrencies, allRoles, totalSamples, overallScore };
}

// ─── Controller ────────────────────────────────────────────────────────────────

@Controller("projects/:id/test-data")
export class TestDataController {

  // GET /projects/:id/test-data/fields
  @Get("fields")
  getFields(@Param("id") id: string, @Query("category") category?: string, @Query("sensitive") sensitive?: string, @Query("riskLevel") riskLevel?: string) {
    const fields   = loadOrBuildCatalog(id);
    const filtered = fields.filter(f => {
      if (category  && f.category !== category)   return false;
      if (sensitive === "true"  && !f.isSensitive) return false;
      if (sensitive === "false" &&  f.isSensitive) return false;
      return true;
    });

    // Enrich with coverage + risk inline for the table view
    const enriched = filtered.map(f => {
      const cov  = computeFieldCoverage(f, id);
      const risk = computeFieldRisk(f, id);
      if (riskLevel && risk.riskLevel !== riskLevel) return null;
      return { ...f, coverage: cov, risk };
    }).filter(Boolean);

    return { total: enriched.length, fields: enriched };
  }

  // GET /projects/:id/test-data/coverage
  @Get("coverage")
  getCoverage(@Param("id") id: string) {
    const fields    = loadOrBuildCatalog(id);
    const coverages = fields.map(f => computeFieldCoverage(f, id));
    const summary   = buildProjectCoverageSummary(fields, coverages);
    const byField   = fields.map((f, i) => ({ field: f, coverage: coverages[i] }));
    return { summary, fields: byField };
  }

  // GET /projects/:id/test-data/risk
  @Get("risk")
  getRisk(@Param("id") id: string) {
    const fields  = loadOrBuildCatalog(id);
    const risks   = fields.map(f => computeFieldRisk(f, id));
    const critical = risks.filter(r => r.riskLevel === "critical").length;
    const high     = risks.filter(r => r.riskLevel === "high").length;
    const medium   = risks.filter(r => r.riskLevel === "medium").length;
    const low      = risks.filter(r => r.riskLevel === "low").length;
    const piiDetected = risks.filter(r => r.potentialRealDataDetected).length;
    const byField  = fields.map((f, i) => ({ field: f, risk: risks[i] }));
    return { summary: { total: fields.length, critical, high, medium, low, piiDetected }, fields: byField };
  }

  // GET /projects/:id/test-data/correlations
  @Get("correlations")
  getCorrelations(@Param("id") id: string) {
    const fields       = loadOrBuildCatalog(id);
    const correlations = computeCorrelations(id, fields);
    return { total: correlations.length, correlations };
  }

  // GET /projects/:id/test-data/insights
  @Get("insights")
  getInsights(@Param("id") id: string) {
    const fields    = loadOrBuildCatalog(id);
    const coverages = fields.map(f => computeFieldCoverage(f, id));
    const risks     = fields.map(f => computeFieldRisk(f, id));
    const insights  = buildDataInsights(fields, coverages, risks);
    return { total: insights.length, criticalCount: insights.filter(i => i.severity === "critical").length, insights };
  }

  // GET /projects/:id/test-data/overview  (summary of all 4 concerns at once)
  @Get("overview")
  getOverview(@Param("id") id: string) {
    const fields    = loadOrBuildCatalog(id);
    const coverages = fields.map(f => computeFieldCoverage(f, id));
    const risks     = fields.map(f => computeFieldRisk(f, id));
    const summary   = buildProjectCoverageSummary(fields, coverages);
    const insights  = buildDataInsights(fields, coverages, risks);

    const riskBreakdown = {
      critical: risks.filter(r => r.riskLevel === "critical").length,
      high:     risks.filter(r => r.riskLevel === "high").length,
      medium:   risks.filter(r => r.riskLevel === "medium").length,
      low:      risks.filter(r => r.riskLevel === "low").length,
      piiDetected: risks.filter(r => r.potentialRealDataDetected).length,
    };

    return { summary, riskBreakdown, insightCount: insights.length, criticalInsights: insights.filter(i => i.severity === "critical").length, domains: detectDomains(id) };
  }
}
