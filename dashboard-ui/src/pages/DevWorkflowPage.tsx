import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// ─── Dark mode hook ────────────────────────────────────────────────────────────

function useDark(): boolean {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  useEffect(() => {
    const obs = new MutationObserver(() => setDark(document.documentElement.classList.contains("dark")));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

// ─── Tokens ────────────────────────────────────────────────────────────────────

interface Tok { bg: string; card: string; border: string; accent: string; accentSoft: string; text: string; muted: string; dim: string; }

const DARK: Tok = { bg: "#0D0F14", card: "#12151D", border: "#1F2333", accent: "#7B5FFF", accentSoft: "#7B5FFF18", text: "#E2E6F0", muted: "#6B7280", dim: "#3E4255" };
const LIGHT: Tok = { bg: "#F4F5F9", card: "#FFFFFF", border: "#E5E7EB", accent: "#6D4FF0", accentSoft: "#6D4FF012", text: "#111827", muted: "#6B7280", dim: "#9CA3AF" };

// ─── Icons ─────────────────────────────────────────────────────────────────────

function Svg({ c, size = 16 }: { c: React.ReactNode; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>{c}</svg>;
}

const IcoGit    = () => <Svg c={<><circle cx="4" cy="4" r="1.8" stroke="currentColor" strokeWidth="1.3"/><circle cx="4" cy="12" r="1.8" stroke="currentColor" strokeWidth="1.3"/><circle cx="12" cy="4" r="1.8" stroke="currentColor" strokeWidth="1.3"/><path d="M4 5.8v4.4M5.8 4h1.7a2.5 2.5 0 012.5 2.5V12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></>} />;
const IcoBlock  = () => <Svg c={<><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/><path d="M4.5 4.5l7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></>} />;
const IcoRisk   = () => <Svg c={<><path d="M8 3L1.5 13.5h13L8 3z" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinejoin="round"/><path d="M8 7v3M8 11.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></>} />;
const IcoFlow   = () => <Svg c={<><circle cx="3" cy="8" r="1.5" fill="currentColor" opacity=".7"/><circle cx="8" cy="3" r="1.5" fill="currentColor" opacity=".7"/><circle cx="13" cy="8" r="1.5" fill="currentColor" opacity=".7"/><circle cx="8" cy="13" r="1.5" fill="currentColor" opacity=".7"/><path d="M4.5 8h3M8 4.5v3M11.5 8h-3M8 11.5v-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></>} />;
const IcoCov    = () => <Svg c={<><rect x="1" y="10" width="3" height="4" rx="0.5" fill="currentColor" opacity=".7"/><rect x="6" y="6" width="3" height="8" rx="0.5" fill="currentColor" opacity=".85"/><rect x="11" y="3" width="3" height="11" rx="0.5" fill="currentColor"/><line x1="1" y1="14" x2="15" y2="14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></>} />;
const IcoMerge  = () => <Svg c={<><circle cx="4" cy="4" r="1.8" stroke="currentColor" strokeWidth="1.3"/><circle cx="4" cy="12" r="1.8" stroke="currentColor" strokeWidth="1.3"/><circle cx="12" cy="8" r="1.8" stroke="currentColor" strokeWidth="1.3"/><path d="M4 5.8v4.4M5.8 4a5 5 0 006.2 3.2M5.8 12a5 5 0 006.2-3.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></>} />;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function riskC(r: string) {
  const m: Record<string, string> = { low: "#22C55E", medium: "#F59E0B", high: "#F97316", critical: "#EF4444", none: "#6B7280", minor: "#F59E0B", major: "#F97316" };
  return m[r] ?? "#6B7280";
}

function Pill({ label, color, T }: { label: string; color: string; T: Tok }) {
  return <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: color + "20", color }}>{label}</span>;
}

function StatCard({ label, value, sub, color, T }: { label: string; value: string | number; sub?: string; color?: string; T: Tok }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 18px" }}>
      <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: color ?? T.text, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

// ─── PR card (compact) ─────────────────────────────────────────────────────────

function PRCard({ pr, T }: { pr: any; T: Tok }) {
  const statusColors: Record<string, string> = { open: "#3B82F6", merged: "#22C55E", blocked: "#EF4444", closed: "#6B7280" };
  const sc = statusColors[pr.status] ?? "#6B7280";
  const daysAgo = Math.round((Date.now() - new Date(pr.createdAt).getTime()) / 86_400_000);
  const rc = riskC(pr.riskLevel);

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderLeft: `3px solid ${rc}`, borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
        <div style={{ flex: 1 }}>
          <Link to={`/projects/${pr.projectId}`} style={{ fontSize: 10, color: T.accent, textDecoration: "none", fontWeight: 600, display: "block", marginBottom: 2 }}>
            {pr.projectName}
          </Link>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, lineHeight: 1.3 }}>
            #{pr.number} {pr.title}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
          <Pill label={pr.status} color={sc} T={T} />
          {!pr.mergeGatePass && <Pill label="blocked" color="#EF4444" T={T} />}
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", fontSize: 11, color: T.muted }}>
        <span style={{ color: rc, fontWeight: 700 }}>{Math.round(pr.regressionProbability * 100)}% regression risk</span>
        <span>·</span>
        <span style={{ color: pr.coverageDelta < 0 ? "#EF4444" : "#22C55E", fontWeight: 600 }}>
          {pr.coverageDelta >= 0 ? "+" : ""}{pr.coverageDelta?.toFixed(1)}% cov
        </span>
        <span>·</span>
        <span>{pr.author}</span>
        <span>·</span>
        <span>{daysAgo}d ago</span>
      </div>

      {pr.blockers?.length > 0 && (
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 2 }}>
          {pr.blockers.slice(0, 2).map((b: string, i: number) => (
            <div key={i} style={{ fontSize: 11, color: "#EF4444", display: "flex", gap: 4 }}><span>✗</span>{b}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab sections ──────────────────────────────────────────────────────────────

function RiskyPRsSection({ prs, T }: { prs: any[]; T: Tok }) {
  if (!prs?.length) return <Empty label="No high-risk PRs at this time." T={T} />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 12, color: T.muted }}>PRs with regression probability ≥ 50%, sorted by risk</div>
      {prs.map((pr, i) => <PRCard key={i} pr={pr} T={T} />)}
    </div>
  );
}

function BlockedPRsSection({ prs, T }: { prs: any[]; T: Tok }) {
  if (!prs?.length) return <Empty label="No blocked PRs — all merge gates are passing." T={T} />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 12, color: T.muted }}>PRs blocked by merge gate failures</div>
      {prs.map((pr, i) => <PRCard key={i} pr={pr} T={T} />)}
    </div>
  );
}

function CoverageDropSection({ prs, T }: { prs: any[]; T: Tok }) {
  if (!prs?.length) return <Empty label="No PRs causing significant coverage drops." T={T} />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 12, color: T.muted }}>PRs that would reduce coverage by more than 5%</div>
      {prs.map((pr, i) => <PRCard key={i} pr={pr} T={T} />)}
    </div>
  );
}

function CriticalFlowsSection({ prs, T }: { prs: any[]; T: Tok }) {
  if (!prs?.length) return <Empty label="No PRs impacting 2+ critical flows." T={T} />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 12, color: T.muted }}>PRs touching 2 or more critical flows</div>
      {prs.map((pr, i) => <PRCard key={i} pr={pr} T={T} />)}
    </div>
  );
}

function Empty({ label, T }: { label: string; T: Tok }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "40px 24px", textAlign: "center", color: T.muted, fontSize: 13 }}>
      {label}
    </div>
  );
}

// ─── Tabs ──────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "risky",   label: "Risky PRs",         icon: <IcoRisk /> },
  { id: "blocked", label: "Blocked",            icon: <IcoBlock /> },
  { id: "coverage",label: "Coverage Drops",     icon: <IcoCov /> },
  { id: "flows",   label: "Critical Flows",     icon: <IcoFlow /> },
] as const;

type TabId = typeof TABS[number]["id"];

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function DevWorkflowPage() {
  const dark = useDark();
  const T    = dark ? DARK : LIGHT;
  const [data, setData]           = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("risky");

  useEffect(() => {
    fetch("/org/workflow/dashboard")
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text }}>
      {/* Header */}
      <div style={{ padding: "28px 32px 20px", borderBottom: `1px solid ${T.border}`, background: T.card }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: T.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", color: T.accent }}>
            <IcoGit />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: T.text, margin: 0, lineHeight: 1.2 }}>Developer Workflow</h1>
            <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>PR impact analysis, merge gates, and code risk across all projects</p>
          </div>
        </div>
      </div>

      {loading && (
        <div style={{ padding: "80px 0", textAlign: "center", color: T.muted }}>Loading dashboard…</div>
      )}

      {!loading && !data && (
        <div style={{ padding: "80px 32px", textAlign: "center", color: T.muted }}>
          No workflow data available. Projects need at least one scan to generate PR analysis.
        </div>
      )}

      {!loading && data && (
        <>
          {/* Summary strip */}
          <div style={{ padding: "20px 32px", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
            <StatCard label="Total PRs"      value={data.summary.totalPRs}           T={T} />
            <StatCard label="Open"           value={data.summary.open}    color="#3B82F6"  T={T} />
            <StatCard label="Blocked"        value={data.summary.blocked} color={data.summary.blocked > 0 ? "#EF4444" : "#22C55E"} T={T} />
            <StatCard label="Avg Regression Risk" value={`${data.summary.avgRegressionRisk}%`}
              color={data.summary.avgRegressionRisk >= 50 ? "#EF4444" : data.summary.avgRegressionRisk >= 30 ? "#F59E0B" : "#22C55E"} T={T} />
            <StatCard label="Total Insights" value={data.summary.totalInsights} T={T} />
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 2, padding: "0 32px", borderBottom: `1px solid ${T.border}`, background: T.card, overflowX: "auto" }}>
            {TABS.map(tab => {
              const active = activeTab === tab.id;
              const count =
                tab.id === "risky"   ? data.riskyPRs?.length :
                tab.id === "blocked" ? data.blockedPRs?.length :
                tab.id === "coverage"? data.coverageDropPRs?.length :
                data.affectingCriticalFlowsPRs?.length;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "13px 14px", border: "none",
                  borderBottom: `2px solid ${active ? T.accent : "transparent"}`,
                  background: "transparent", cursor: "pointer",
                  color: active ? T.accent : T.muted,
                  fontSize: 13, fontWeight: active ? 700 : 500,
                  whiteSpace: "nowrap", transition: "color 0.15s, border-color 0.15s",
                }}>
                  <span style={{ color: active ? T.accent : T.muted, display: "flex" }}>{tab.icon}</span>
                  {tab.label}
                  {count > 0 && (
                    <span style={{
                      padding: "1px 6px", borderRadius: 99, fontSize: 10, fontWeight: 700,
                      background: active ? T.accent : T.border,
                      color: active ? "#fff" : T.muted,
                    }}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div style={{ padding: "24px 32px", maxWidth: 1100 }}>
            {activeTab === "risky"    && <RiskyPRsSection    prs={data.riskyPRs}                    T={T} />}
            {activeTab === "blocked"  && <BlockedPRsSection  prs={data.blockedPRs}                  T={T} />}
            {activeTab === "coverage" && <CoverageDropSection prs={data.coverageDropPRs}             T={T} />}
            {activeTab === "flows"    && <CriticalFlowsSection prs={data.affectingCriticalFlowsPRs} T={T} />}
          </div>
        </>
      )}
    </div>
  );
}
