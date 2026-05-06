import { useState, useEffect } from "react";
import { useColors } from "@/hooks/useColors";

// ─── Types ─────────────────────────────────────────────────────────────────────

type DataCategory =
  | "email" | "name" | "address" | "phone" | "creditCard" | "iban"
  | "currency" | "amount" | "date" | "datetime" | "country" | "locale"
  | "userRole" | "productId" | "orderId" | "freeText" | "boolean"
  | "integer" | "float" | "json" | "unknown";

type RiskLevel = "low" | "medium" | "high" | "critical";
type DataSource = "request" | "response" | "ui-input" | "db" | "other";

interface TestDataField {
  id: string; name: string; source: DataSource;
  path: string; category: DataCategory; isSensitive: boolean; tags: string[];
  coverage: { variationScore: number; edgeCaseCoverageScore: number; distinctValues: number; samples: number; edgeCasesCovered: string[]; edgeCasesMissing: string[]; localeCoverage: string[]; currencyCoverage: string[]; roleCoverage: string[]; };
  risk: { riskLevel: RiskLevel; isSensitive: boolean; potentialRealDataDetected: boolean; usesRealisticPatterns: boolean; reasons: string[]; };
}

interface OrgOverview {
  summary: { fieldCount: number; sensitiveCount: number; avgVariation: number; avgEdgeCase: number; overallScore: number; totalSamples: number; allLocales: string[]; allCurrencies: string[]; allRoles: string[]; };
  riskBreakdown: { critical: number; high: number; medium: number; low: number; piiDetected: number; };
  insightCount: number; criticalInsights: number; domains: string[];
}

interface DataInsight {
  type: string; severity: string; title: string; detail: string; fieldId?: string;
}

interface DataCorrelation {
  fieldId: string; fieldName: string; category: DataCategory;
  patternDescription: string; correlationStrength: number;
  affectedTestsCount: number; recommendation: string;
}

// ─── SVG icons ─────────────────────────────────────────────────────────────────

function Svg({ children, size = 16 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
      xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      {children}
    </svg>
  );
}

function IcoShield() {
  return <Svg><path d="M8 2L2 5v4c0 3.3 2.5 5.8 6 6.5 3.5-.7 6-3.2 6-6.5V5L8 2z" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinejoin="round"/><path d="M5.5 8.5l1.8 1.8L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
}
function IcoData() {
  return <Svg><ellipse cx="8" cy="4.5" rx="5.5" ry="2" stroke="currentColor" strokeWidth="1.3" fill="none"/><path d="M2.5 4.5v3c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2v-3" stroke="currentColor" strokeWidth="1.3"/><path d="M2.5 7.5v3c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2v-3" stroke="currentColor" strokeWidth="1.3"/></Svg>;
}
function IcoChart() {
  return <Svg><rect x="1" y="10" width="3" height="4" rx="0.5" fill="currentColor" opacity=".7"/><rect x="6" y="6" width="3" height="8" rx="0.5" fill="currentColor" opacity=".85"/><rect x="11" y="3" width="3" height="11" rx="0.5" fill="currentColor"/><line x1="1" y1="14" x2="15" y2="14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></Svg>;
}
function IcoLink() {
  return <Svg><path d="M6 10l4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M4 11.5a2.5 2.5 0 010-5l2-2a2.5 2.5 0 013.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none"/><path d="M12 4.5a2.5 2.5 0 010 5l-2 2a2.5 2.5 0 01-3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none"/></Svg>;
}
function IcoLightning() {
  return <Svg><path d="M9 2L4 9h5l-2 5 7-8H9l2-4z" fill="currentColor" opacity=".9"/></Svg>;
}
function IcoChevron({ dir = "down" }: { dir?: "up" | "down" | "right" }) {
  const pts: Record<string, string> = {
    down: "M4 6l4 4 4-4", up: "M12 10l-4-4-4 4", right: "M6 12l4-4-4-4",
  };
  return <Svg size={12}><path d={pts[dir]} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/></Svg>;
}

// ─── Color helpers ─────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<DataCategory, string> = {
  email: "#6D4FF0", name: "#06B6D4", address: "#8B5CF6", phone: "#3B82F6",
  creditCard: "#EF4444", iban: "#DC2626", currency: "#10B981", amount: "#F59E0B",
  date: "#14B8A6", datetime: "#0EA5E9", country: "#84CC16", locale: "#A78BFA",
  userRole: "#F97316", productId: "#22C55E", orderId: "#6366F1",
  freeText: "#9CA3AF", boolean: "#EC4899", integer: "#64748B",
  float: "#94A3B8", json: "#71717A", unknown: "#6B7280",
};

const RISK_COLORS = { low: "#22C55E", medium: "#F59E0B", high: "#F97316", critical: "#EF4444" };

function riskColor(l: RiskLevel) { return RISK_COLORS[l]; }
function catColor(c: DataCategory) { return CATEGORY_COLORS[c] ?? "#6B7280"; }

// ─── Mini bar ──────────────────────────────────────────────────────────────────

function MiniBar({ value, color, label }: { value: number; color: string; label?: string }) {
  const pct = Math.round(value * 100);
  return (
    <div>
      {label && <div style={{ fontSize: 10, color: "#6B7280", marginBottom: 3 }}>{label}</div>}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ flex: 1, height: 5, borderRadius: 3, background: color + "20", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.4s" }} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 28, textAlign: "right" }}>{pct}%</span>
      </div>
    </div>
  );
}

// ─── Pill ──────────────────────────────────────────────────────────────────────

function Pill({ label, color, size = "sm" }: { label: string; color: string; size?: "xs" | "sm" }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: size === "xs" ? "1px 6px" : "2px 8px",
      borderRadius: 99, fontSize: size === "xs" ? 10 : 11, fontWeight: 600,
      background: color + "20", color,
    }}>{label}</span>
  );
}

// ─── Overview cards ────────────────────────────────────────────────────────────

function OverviewSection({ overview, TXT, TXT2, BDR, CARD, P }: {
  overview: OrgOverview; TXT: string; TXT2: string; BDR: string; CARD: string; P: string;
}) {
  const { summary, riskBreakdown } = overview;
  const scoreColor = summary.overallScore >= 70 ? "#22C55E" : summary.overallScore >= 45 ? "#F59E0B" : "#EF4444";

  const stats = [
    { label: "Total Fields",      value: summary.fieldCount,    sub: `${summary.sensitiveCount} sensitive` },
    { label: "Overall Score",     value: `${summary.overallScore}`,  color: scoreColor },
    { label: "Avg Variation",     value: `${Math.round(summary.avgVariation * 100)}%`, sub: "distinct values",    color: summary.avgVariation < 0.3 ? "#F59E0B" : "#22C55E" },
    { label: "Avg Edge Cases",    value: `${Math.round(summary.avgEdgeCase * 100)}%`,  sub: "coverage",           color: summary.avgEdgeCase < 0.2 ? "#EF4444" : summary.avgEdgeCase < 0.4 ? "#F59E0B" : "#22C55E" },
    { label: "Total Samples",     value: summary.totalSamples, sub: "across all fields" },
    { label: "PII Risk Fields",   value: riskBreakdown.piiDetected, sub: "potential real data", color: riskBreakdown.piiDetected > 0 ? "#EF4444" : "#22C55E" },
    { label: "Critical Risk",     value: riskBreakdown.critical, color: riskBreakdown.critical > 0 ? "#EF4444" : "#22C55E" },
    { label: "High Risk",         value: riskBreakdown.high,     color: riskBreakdown.high > 0 ? "#F97316" : "#22C55E" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontSize: 10, color: TXT2, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: (s as any).color ?? TXT, lineHeight: 1 }}>{s.value}</div>
            {(s as any).sub && <div style={{ fontSize: 11, color: TXT2, marginTop: 3 }}>{(s as any).sub}</div>}
          </div>
        ))}
      </div>

      {/* Domains + locale/currency/role coverage */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 10, color: TXT2, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Detected Domains</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {overview.domains.map(d => <Pill key={d} label={d} color={P} />)}
          </div>
        </div>
        <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 10, color: TXT2, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Locale / Currency Coverage</div>
          {summary.allLocales.length > 0 && (
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 10, color: TXT2, marginBottom: 3 }}>Locales</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{summary.allLocales.map(l => <Pill key={l} label={l} color="#A78BFA" size="xs" />)}</div>
            </div>
          )}
          {summary.allCurrencies.length > 0 && (
            <div>
              <div style={{ fontSize: 10, color: TXT2, marginBottom: 3 }}>Currencies</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{summary.allCurrencies.map(c => <Pill key={c} label={c} color="#10B981" size="xs" />)}</div>
            </div>
          )}
          {summary.allLocales.length === 0 && summary.allCurrencies.length === 0 && (
            <div style={{ fontSize: 12, color: TXT2 }}>No locale or currency fields detected yet.</div>
          )}
        </div>
        <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 10, color: TXT2, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Risk Breakdown</div>
          {(["critical", "high", "medium", "low"] as RiskLevel[]).map(level => (
            <div key={level} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: riskColor(level), flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: TXT, flex: 1, textTransform: "capitalize" }}>{level}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: riskColor(level) }}>{riskBreakdown[level]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Fields table ──────────────────────────────────────────────────────────────

function FieldsSection({ projectId, TXT, TXT2, BDR, CARD, P }: {
  projectId: string; TXT: string; TXT2: string; BDR: string; CARD: string; P: string;
}) {
  const [fields, setFields]   = useState<TestDataField[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterCat,  setFilterCat]  = useState("all");
  const [filterSens, setFilterSens] = useState("all");
  const [filterRisk, setFilterRisk] = useState("all");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterCat !== "all")  params.set("category",  filterCat);
    if (filterSens !== "all") params.set("sensitive",  filterSens);
    if (filterRisk !== "all") params.set("riskLevel",  filterRisk);
    fetch(`/projects/${projectId}/test-data/fields?${params}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setFields(d?.fields ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [projectId, filterCat, filterSens, filterRisk]);

  const CATEGORIES = ["all", "email", "name", "creditCard", "amount", "date", "userRole", "phone", "freeText", "integer", "boolean"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Filters */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: TXT2 }}>Category:</span>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setFilterCat(c)} style={{
              padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: "pointer",
              border: `1px solid ${filterCat === c ? P : BDR}`,
              background: filterCat === c ? P + "18" : "transparent",
              color: filterCat === c ? P : TXT2,
            }}>{c}</button>
          ))}
        </div>
        <span style={{ fontSize: 11, color: TXT2, marginLeft: 8 }}>Sensitive:</span>
        {["all", "true", "false"].map(v => (
          <button key={v} onClick={() => setFilterSens(v)} style={{
            padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: "pointer",
            border: `1px solid ${filterSens === v ? P : BDR}`,
            background: filterSens === v ? P + "18" : "transparent",
            color: filterSens === v ? P : TXT2,
          }}>{v}</button>
        ))}
        <span style={{ fontSize: 11, color: TXT2, marginLeft: 8 }}>Risk:</span>
        {["all", "critical", "high", "medium", "low"].map(v => (
          <button key={v} onClick={() => setFilterRisk(v)} style={{
            padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: "pointer",
            border: `1px solid ${filterRisk === v ? (v === "all" ? P : riskColor(v as RiskLevel)) : BDR}`,
            background: filterRisk === v ? (v === "all" ? P : riskColor(v as RiskLevel)) + "18" : "transparent",
            color: filterRisk === v ? (v === "all" ? P : riskColor(v as RiskLevel)) : TXT2,
          }}>{v}</button>
        ))}
      </div>

      {loading && <div style={{ padding: "40px 0", textAlign: "center", color: TXT2 }}>Loading fields…</div>}

      {!loading && fields.length === 0 && (
        <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, padding: "40px 24px", textAlign: "center", color: TXT2, fontSize: 13 }}>
          No fields match the current filters.
        </div>
      )}

      {!loading && fields.map(field => {
        const isOpen = expanded === field.id;
        const cc = catColor(field.category);
        const rc = riskColor(field.risk.riskLevel);

        return (
          <div key={field.id} style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, overflow: "hidden" }}>
            {/* Row */}
            <button
              onClick={() => setExpanded(isOpen ? null : field.id)}
              style={{
                width: "100%", display: "grid",
                gridTemplateColumns: "28px 160px 90px 80px 1fr 1fr 90px 24px",
                gap: 10, alignItems: "center",
                padding: "11px 14px", background: "transparent", border: "none",
                cursor: "pointer", textAlign: "left",
              }}
            >
              {/* Sensitive dot */}
              <div style={{
                width: 8, height: 8, borderRadius: "50%", margin: "0 auto",
                background: field.isSensitive ? "#EF4444" : BDR,
                boxShadow: field.isSensitive ? "0 0 6px #EF444466" : "none",
              }} title={field.isSensitive ? "Sensitive field" : "Non-sensitive"} />

              {/* Name */}
              <span style={{ fontSize: 13, fontWeight: 600, color: TXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {field.name}
              </span>

              {/* Category */}
              <Pill label={field.category} color={cc} size="xs" />

              {/* Source */}
              <span style={{ fontSize: 11, color: TXT2, fontFamily: "monospace" }}>{field.source}</span>

              {/* Variation */}
              <MiniBar value={field.coverage.variationScore} color={field.coverage.variationScore < 0.25 ? "#F59E0B" : "#22C55E"} label="Variation" />

              {/* Edge cases */}
              <MiniBar value={field.coverage.edgeCaseCoverageScore} color={field.coverage.edgeCaseCoverageScore < 0.2 ? "#EF4444" : field.coverage.edgeCaseCoverageScore < 0.4 ? "#F59E0B" : "#22C55E"} label="Edge Cases" />

              {/* Risk */}
              <Pill label={field.risk.riskLevel} color={rc} size="xs" />

              {/* Chevron */}
              <span style={{ color: TXT2, display: "flex", justifyContent: "center", transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "none" }}>
                <IcoChevron dir="down" />
              </span>
            </button>

            {/* Detail panel */}
            {isOpen && (
              <div style={{ borderTop: `1px solid ${BDR}`, padding: "16px 14px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                {/* Field metadata */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: TXT2, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Field Info</div>
                  <div style={{ fontSize: 12, color: TXT2, marginBottom: 4 }}>
                    <span style={{ color: TXT, fontFamily: "monospace" }}>{field.path}</span>
                  </div>
                  <div style={{ fontSize: 12, color: TXT2, marginBottom: 8 }}>
                    Samples: <span style={{ color: TXT, fontWeight: 600 }}>{field.coverage.samples}</span> ·
                    Distinct: <span style={{ color: TXT, fontWeight: 600 }}> {field.coverage.distinctValues}</span>
                  </div>
                  {field.tags.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {field.tags.map(t => <Pill key={t} label={t} color={P} size="xs" />)}
                    </div>
                  )}
                  {(field.coverage.localeCoverage.length > 0 || field.coverage.currencyCoverage.length > 0 || field.coverage.roleCoverage.length > 0) && (
                    <div style={{ marginTop: 8 }}>
                      {field.coverage.localeCoverage.length > 0 && (
                        <div style={{ fontSize: 11, color: TXT2, marginBottom: 4 }}>
                          Locales: {field.coverage.localeCoverage.map(l => <Pill key={l} label={l} color="#A78BFA" size="xs" />)}
                        </div>
                      )}
                      {field.coverage.currencyCoverage.length > 0 && (
                        <div style={{ fontSize: 11, color: TXT2, marginBottom: 4 }}>
                          Currencies: {field.coverage.currencyCoverage.map(c => <Pill key={c} label={c} color="#10B981" size="xs" />)}
                        </div>
                      )}
                      {field.coverage.roleCoverage.length > 0 && (
                        <div style={{ fontSize: 11, color: TXT2 }}>
                          Roles: {field.coverage.roleCoverage.map(r => <Pill key={r} label={r} color="#F97316" size="xs" />)}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Edge cases */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: TXT2, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Edge Case Coverage</div>
                  {field.coverage.edgeCasesCovered.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 10, color: "#22C55E", fontWeight: 600, marginBottom: 4 }}>Covered ({field.coverage.edgeCasesCovered.length})</div>
                      {field.coverage.edgeCasesCovered.map(e => (
                        <div key={e} style={{ fontSize: 11, color: TXT2, marginBottom: 2, display: "flex", gap: 5 }}>
                          <span style={{ color: "#22C55E" }}>✓</span> {e}
                        </div>
                      ))}
                    </div>
                  )}
                  {field.coverage.edgeCasesMissing.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, color: "#EF4444", fontWeight: 600, marginBottom: 4 }}>Missing ({field.coverage.edgeCasesMissing.length})</div>
                      {field.coverage.edgeCasesMissing.slice(0, 4).map(e => (
                        <div key={e} style={{ fontSize: 11, color: TXT2, marginBottom: 2, display: "flex", gap: 5 }}>
                          <span style={{ color: "#EF4444" }}>✗</span> {e}
                        </div>
                      ))}
                      {field.coverage.edgeCasesMissing.length > 4 && (
                        <div style={{ fontSize: 11, color: TXT2, marginTop: 2 }}>+{field.coverage.edgeCasesMissing.length - 4} more…</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Risk assessment */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: TXT2, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Risk Assessment</div>
                  <div style={{ marginBottom: 6 }}>
                    <Pill label={field.risk.riskLevel} color={riskColor(field.risk.riskLevel)} />
                  </div>
                  {field.risk.potentialRealDataDetected && (
                    <div style={{ background: "#EF444412", border: "1px solid #EF444430", borderRadius: 6, padding: "6px 10px", marginBottom: 8, fontSize: 12, color: "#EF4444" }}>
                      Potential real PII detected
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {field.risk.reasons.map((r, i) => (
                      <div key={i} style={{ fontSize: 11, color: TXT2, display: "flex", gap: 5, alignItems: "flex-start" }}>
                        <span style={{ color: riskColor(field.risk.riskLevel), flexShrink: 0 }}>•</span> {r}
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 11, color: TXT2 }}>
                    <span>Realistic patterns: </span>
                    <span style={{ fontWeight: 600, color: field.risk.usesRealisticPatterns ? "#22C55E" : "#F59E0B" }}>
                      {field.risk.usesRealisticPatterns ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Correlations section ──────────────────────────────────────────────────────

function CorrelationsSection({ projectId, TXT, TXT2, BDR, CARD }: {
  projectId: string; TXT: string; TXT2: string; BDR: string; CARD: string;
}) {
  const [data, setData]     = useState<{ correlations: DataCorrelation[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/projects/${projectId}/test-data/correlations`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [projectId]);

  if (loading) return <div style={{ padding: "40px 0", textAlign: "center", color: TXT2 }}>Loading…</div>;
  if (!data?.correlations?.length) return (
    <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, padding: "40px 24px", textAlign: "center", color: TXT2, fontSize: 13 }}>
      No data-failure correlations detected yet. Correlations surface after sufficient test execution data is available.
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 12, color: TXT2 }}>
        Showing fields whose value patterns correlate with test failures or flakiness
      </div>
      {data.correlations.map((c, i) => {
        const cc = catColor(c.category);
        const strength = Math.round(c.correlationStrength * 100);
        const strengthColor = strength >= 60 ? "#EF4444" : strength >= 40 ? "#F59E0B" : "#22C55E";
        return (
          <div key={i} style={{ background: CARD, border: `1px solid ${BDR}`, borderLeft: `3px solid ${strengthColor}`, borderRadius: 10, padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <Pill label={c.fieldName} color={cc} />
              <Pill label={c.category} color={cc} size="xs" />
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, color: TXT2 }}>Correlation:</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: strengthColor }}>{strength}%</span>
              </div>
            </div>
            <div style={{ fontSize: 13, color: TXT, marginBottom: 6, fontWeight: 500 }}>{c.patternDescription}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: TXT2 }}>
                Affected tests: <span style={{ color: TXT, fontWeight: 600 }}>{c.affectedTestsCount}</span>
              </span>
              <div style={{ flex: 1, height: 4, borderRadius: 2, background: strengthColor + "20", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${strength}%`, background: strengthColor, borderRadius: 2 }} />
              </div>
            </div>
            <div style={{ fontSize: 12, color: TXT2, display: "flex", gap: 6 }}>
              <span style={{ color: cc, fontWeight: 600 }}>Recommendation:</span>
              {c.recommendation}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Insights section ──────────────────────────────────────────────────────────

function InsightsSection({ projectId, TXT, TXT2, BDR, CARD }: {
  projectId: string; TXT: string; TXT2: string; BDR: string; CARD: string;
}) {
  const [data, setData]     = useState<{ insights: DataInsight[]; criticalCount: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/projects/${projectId}/test-data/insights`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [projectId]);

  if (loading) return <div style={{ padding: "40px 0", textAlign: "center", color: TXT2 }}>Loading…</div>;
  if (!data?.insights?.length) return (
    <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, padding: "40px 24px", textAlign: "center", color: TXT2, fontSize: 13 }}>
      No data intelligence insights generated yet.
    </div>
  );

  const SEV_COLORS: Record<string, string> = { critical: "#EF4444", high: "#F97316", medium: "#F59E0B", low: "#22C55E" };
  const TYPE_ICONS: Record<string, React.ReactNode> = {
    "data-variation-gap":  <IcoChart />,
    "data-edgecase-gap":   <IcoLightning />,
    "data-risk-pii":       <IcoShield />,
    "data-risk-no-edge":   <IcoShield />,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {data.criticalCount > 0 && <Pill label={`${data.criticalCount} critical`} color="#EF4444" />}
        <Pill label={`${data.insights.length} insights`} color="#6B7280" />
      </div>
      {data.insights.map((ins, i) => {
        const sc = SEV_COLORS[ins.severity] ?? "#6B7280";
        return (
          <div key={i} style={{ background: CARD, border: `1px solid ${BDR}`, borderLeft: `3px solid ${sc}`, borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
              <Pill label={ins.severity} color={sc} />
              <span style={{ padding: "2px 7px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: BDR, color: TXT2 }}>
                {ins.type.replace(/-/g, " ")}
              </span>
              <span style={{ marginLeft: "auto", color: sc, display: "flex" }}>{TYPE_ICONS[ins.type] ?? <IcoLightning />}</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: TXT, marginBottom: 5 }}>{ins.title}</div>
            <div style={{ fontSize: 12, color: TXT2, lineHeight: 1.55 }}>{ins.detail}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Tab definitions ───────────────────────────────────────────────────────────

const TABS = [
  { id: "overview",     label: "Overview",       icon: <IcoData /> },
  { id: "fields",       label: "Fields",         icon: <IcoChart /> },
  { id: "correlations", label: "Correlations",   icon: <IcoLink /> },
  { id: "insights",     label: "Data Insights",  icon: <IcoLightning /> },
] as const;

type TabId = typeof TABS[number]["id"];

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function TestDataPage({ projectId }: { projectId: string }) {
  const { P, BDR, CARD, TXT, TXT2 } = useColors();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [overview, setOverview]   = useState<OrgOverview | null>(null);
  const [oLoading, setOLoading]   = useState(true);

  useEffect(() => {
    fetch(`/projects/${projectId}/test-data/overview`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setOverview(d); setOLoading(false); })
      .catch(() => setOLoading(false));
  }, [projectId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header strip */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 0 16px", flexShrink: 0 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: P + "18", display: "flex", alignItems: "center", justifyContent: "center", color: P }}>
          <IcoData />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: TXT }}>Test Data Intelligence</div>
          <div style={{ fontSize: 12, color: TXT2 }}>Coverage, variation, risk, and failure correlations for your test data</div>
        </div>
        {overview && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: overview.summary.overallScore >= 70 ? "#22C55E" : overview.summary.overallScore >= 45 ? "#F59E0B" : "#EF4444" }}>
                {overview.summary.overallScore}
              </div>
              <div style={{ fontSize: 10, color: TXT2 }}>Data Score</div>
            </div>
            {overview.criticalInsights > 0 && (
              <div style={{ background: "#EF444412", border: "1px solid #EF444430", borderRadius: 8, padding: "4px 10px", display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#EF4444", fontWeight: 600 }}>
                <IcoShield /> {overview.criticalInsights} critical
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${BDR}`, marginBottom: 20, flexShrink: 0 }}>
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "9px 14px", border: "none",
              borderBottom: `2px solid ${active ? P : "transparent"}`,
              background: "transparent", cursor: "pointer",
              color: active ? P : TXT2, fontSize: 13, fontWeight: active ? 700 : 500,
              transition: "color 0.15s, border-color 0.15s",
            }}>
              <span style={{ color: active ? P : TXT2, display: "flex" }}>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {activeTab === "overview" && (
          oLoading
            ? <div style={{ padding: "40px 0", textAlign: "center", color: TXT2 }}>Loading…</div>
            : overview
              ? <OverviewSection overview={overview} TXT={TXT} TXT2={TXT2} BDR={BDR} CARD={CARD} P={P} />
              : <div style={{ padding: "40px 0", textAlign: "center", color: TXT2, fontSize: 13 }}>No data available for this project yet. Run a scan to populate test data intelligence.</div>
        )}
        {activeTab === "fields" && (
          <FieldsSection projectId={projectId} TXT={TXT} TXT2={TXT2} BDR={BDR} CARD={CARD} P={P} />
        )}
        {activeTab === "correlations" && (
          <CorrelationsSection projectId={projectId} TXT={TXT} TXT2={TXT2} BDR={BDR} CARD={CARD} />
        )}
        {activeTab === "insights" && (
          <InsightsSection projectId={projectId} TXT={TXT} TXT2={TXT2} BDR={BDR} CARD={CARD} />
        )}
      </div>
    </div>
  );
}
