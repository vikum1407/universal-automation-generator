import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";

// ─── Dark mode hook ────────────────────────────────────────────────────────────

function useDarkMode(): boolean {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setDark(document.documentElement.classList.contains("dark"))
    );
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

// ─── Tokens ────────────────────────────────────────────────────────────────────

interface Tok {
  bg: string; card: string; border: string; accent: string;
  accentSoft: string; text: string; muted: string; dim: string;
  green: string; greenSoft: string; red: string; redSoft: string;
  yellow: string; yellowSoft: string; orange: string; orangeSoft: string;
}

const DARK: Tok = {
  bg: "#0D0F14", card: "#12151D", border: "#1F2333",
  accent: "#7B5FFF", accentSoft: "#7B5FFF18",
  text: "#E2E6F0", muted: "#6B7280", dim: "#3E4255",
  green: "#22C55E", greenSoft: "#22C55E18",
  red: "#EF4444", redSoft: "#EF444418",
  yellow: "#F59E0B", yellowSoft: "#F59E0B18",
  orange: "#F97316", orangeSoft: "#F9731618",
};

const LIGHT: Tok = {
  bg: "#F4F5F9", card: "#FFFFFF", border: "#E5E7EB",
  accent: "#6D4FF0", accentSoft: "#6D4FF012",
  text: "#111827", muted: "#6B7280", dim: "#9CA3AF",
  green: "#16A34A", greenSoft: "#16A34A12",
  red: "#DC2626", redSoft: "#DC262612",
  yellow: "#D97706", yellowSoft: "#D9770618",
  orange: "#EA580C", orangeSoft: "#EA580C18",
};

// ─── SVG Icons ─────────────────────────────────────────────────────────────────

function Ico({ children, size = 16 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
      xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      {children}
    </svg>
  );
}

function IcoHotspot() {
  return <Ico>
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M8 4v4l2.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <circle cx="8" cy="8" r="1.5" fill="currentColor" opacity=".6"/>
  </Ico>;
}

function IcoEndpoints() {
  return <Ico>
    <rect x="1.5" y="5.5" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.3"/>
    <rect x="9.5" y="5.5" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M6.5 8h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </Ico>;
}

function IcoFlows() {
  return <Ico>
    <circle cx="3" cy="8" r="1.5" fill="currentColor" opacity=".7"/>
    <circle cx="8" cy="3" r="1.5" fill="currentColor" opacity=".7"/>
    <circle cx="13" cy="8" r="1.5" fill="currentColor" opacity=".7"/>
    <circle cx="8" cy="13" r="1.5" fill="currentColor" opacity=".7"/>
    <path d="M4.5 8h3M8 4.5v3M11.5 8h-3M8 11.5v-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </Ico>;
}

function IcoClusters() {
  return <Ico>
    <circle cx="5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
    <circle cx="11" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
    <circle cx="8" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M7 5h2M6 7l2 3M10 7l-2 3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity=".5"/>
  </Ico>;
}

function IcoTeams() {
  return <Ico>
    <circle cx="6" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M2 14c0-2.2 1.8-4 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <circle cx="11" cy="5.5" r="2" stroke="currentColor" strokeWidth="1.2" opacity=".7"/>
    <path d="M13.5 14c0-1.7-1.2-3.2-3-3.7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity=".7"/>
  </Ico>;
}

function IcoInsights() {
  return <Ico>
    <path d="M8 2C5.8 2 4 3.8 4 6c0 1.5.8 2.8 2 3.5V11h4V9.5C11.2 8.8 12 7.5 12 6c0-2.2-1.8-4-4-4z"
      fill="currentColor" opacity=".85"/>
    <rect x="5.5" y="12" width="5" height="1.5" rx=".75" fill="currentColor" opacity=".6"/>
    <rect x="6.5" y="13.5" width="3" height="1" rx=".5" fill="currentColor" opacity=".35"/>
  </Ico>;
}

function IcoArrow() {
  return <Ico size={12}>
    <path d="M4 8h8M8 5l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </Ico>;
}

// ─── Severity/status helpers ───────────────────────────────────────────────────

function severityColor(sev: string, T: Tok) {
  if (sev === "critical") return T.red;
  if (sev === "high")     return T.orange;
  if (sev === "medium")   return T.yellow;
  return T.green;
}

function severityBg(sev: string, T: Tok) {
  if (sev === "critical") return T.redSoft;
  if (sev === "high")     return T.orangeSoft;
  if (sev === "medium")   return T.yellowSoft;
  return T.greenSoft;
}

function readinessColor(status: string, T: Tok) {
  if (status === "ready")    return T.green;
  if (status === "at-risk")  return T.yellow;
  return T.red;
}

function badgeColor(badge: string, T: Tok) {
  if (badge === "gold")             return "#EAB308";
  if (badge === "silver")           return "#9CA3AF";
  if (badge === "bronze")           return "#B45309";
  return T.red;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 8px", borderRadius: 99,
      fontSize: 11, fontWeight: 600,
      color, background: bg,
    }}>{label}</span>
  );
}

function ScoreBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  return (
    <div style={{ position: "relative", height: 5, borderRadius: 3, background: color + "20", overflow: "hidden", minWidth: 60 }}>
      <div style={{
        position: "absolute", inset: 0, right: `${100 - Math.min(100, (value / max) * 100)}%`,
        background: color, borderRadius: 3,
        transition: "right 0.4s cubic-bezier(.4,0,.2,1)",
      }} />
    </div>
  );
}

function StatCard({ label, value, sub, color, T }: {
  label: string; value: string | number; sub?: string; color?: string; T: Tok;
}) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 12, padding: "16px 18px",
      display: "flex", flexDirection: "column", gap: 4,
    }}>
      <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: color ?? T.text, lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: T.muted }}>{sub}</div>}
    </div>
  );
}

// ─── Section: Hotspots ────────────────────────────────────────────────────────

function HotspotsSection({ T }: { T: Tok }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/org/intelligence/hotspots")
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <Loader T={T} />;
  if (!data)   return <Empty label="Could not load hotspot data." T={T} />;

  const { summary, projectHotspots, extremes } = data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Summary strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <StatCard label="Total Projects"   value={summary.totalProjects} T={T} />
        <StatCard label="Not Ready"        value={summary.notReady}      color={T.red}    T={T} />
        <StatCard label="At Risk"          value={summary.atRisk}        color={T.yellow} T={T} />
        <StatCard label="Org Avg Risk"     value={`${summary.avgRisk}%`} color={summary.avgRisk > 50 ? T.red : summary.avgRisk > 30 ? T.yellow : T.green} T={T} />
      </div>

      {/* Extremes */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        {[
          { label: "Highest Risk", items: extremes.worstRisk,     unit: "% risk",    color: T.red    },
          { label: "Most Failing",  items: extremes.worstFailure,  unit: "% failure", color: T.orange },
          { label: "Most Flaky",    items: extremes.mostFlaky,     unit: " flaky",    color: T.yellow },
          { label: "Least Coverage",items: extremes.leastCoverage, unit: "% covered", color: T.muted  },
        ].map(block => (
          <div key={block.label} style={{
            background: T.card, border: `1px solid ${T.border}`,
            borderRadius: 12, padding: "14px 16px",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
              {block.label}
            </div>
            {(block.items ?? []).map((item: any, i: number) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                  background: i === 0 ? block.color : T.dim,
                }} />
                <Link to={`/projects/${item.projectId}`} style={{ color: T.text, fontSize: 13, flex: 1, textDecoration: "none", fontWeight: 500 }}>
                  {item.name}
                </Link>
                <span style={{ fontSize: 13, fontWeight: 700, color: block.color }}>
                  {item.value}{block.unit}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Full project hotspot table */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, fontSize: 13, fontWeight: 700, color: T.text }}>
          All Projects by Heat Score
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {["Project", "Heat", "Risk", "Failure", "Flaky", "Coverage", "Status"].map(h => (
                  <th key={h} style={{ padding: "8px 14px", textAlign: "left", color: T.muted, fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(projectHotspots ?? []).map((p: any, i: number) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = T.bg}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                  <td style={{ padding: "10px 14px" }}>
                    <Link to={`/projects/${p.projectId}`} style={{ color: T.text, textDecoration: "none", fontWeight: 500 }}>
                      {p.projectName}
                    </Link>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{
                        width: Math.min(60, Math.round((p.heatScore / 100) * 60)),
                        height: 6, borderRadius: 3,
                        background: p.heatScore > 60 ? T.red : p.heatScore > 35 ? T.yellow : T.green,
                      }} />
                      <span style={{ fontWeight: 700, color: p.heatScore > 60 ? T.red : p.heatScore > 35 ? T.yellow : T.green }}>
                        {p.heatScore}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px", color: p.riskScore > 50 ? T.red : T.text }}>{p.riskScore}%</td>
                  <td style={{ padding: "10px 14px", color: p.failureRate > 20 ? T.orange : T.text }}>{p.failureRate}%</td>
                  <td style={{ padding: "10px 14px", color: p.flakyCount >= 3 ? T.yellow : T.text }}>{p.flakyCount}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <ScoreBar value={p.reqCoverage} color={p.reqCoverage < 60 ? T.red : p.reqCoverage < 75 ? T.yellow : T.green} />
                      <span style={{ color: T.muted, fontSize: 11 }}>{p.reqCoverage}%</span>
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <Pill
                      label={p.readinessStatus}
                      color={readinessColor(p.readinessStatus, T)}
                      bg={readinessColor(p.readinessStatus, T) + "18"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Section: Shared Endpoints ────────────────────────────────────────────────

function SharedEndpointsSection({ T }: { T: Tok }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/org/intelligence/shared-endpoints")
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <Loader T={T} />;
  if (!data)   return <Empty label="Could not load shared endpoint data." T={T} />;

  const { endpoints, totalShared } = data;

  if (totalShared === 0) {
    return (
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "40px 24px", textAlign: "center", color: T.muted }}>
        No shared endpoints detected across projects yet. Shared endpoints appear when 2+ projects expose the same API path.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 13, color: T.muted }}>
        {totalShared} endpoint{totalShared !== 1 ? "s" : ""} shared across multiple projects
      </div>

      {(endpoints ?? []).map((ep: any, i: number) => {
        const isOpen = expanded === ep.key;
        const methodColor = ep.method === "GET" ? T.green : ep.method === "POST" ? T.accent : ep.method === "DELETE" ? T.red : T.yellow;
        return (
          <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
            <button
              onClick={() => setExpanded(isOpen ? null : ep.key)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "14px 16px", background: "transparent", border: "none",
                cursor: "pointer", textAlign: "left",
              }}
            >
              <span style={{
                padding: "2px 7px", borderRadius: 5, fontSize: 11, fontWeight: 800,
                background: methodColor + "22", color: methodColor, minWidth: 42, textAlign: "center",
              }}>{ep.method}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: T.text, fontFamily: "monospace" }}>
                {ep.path}
              </span>
              <span style={{ fontSize: 12, color: T.muted, flexShrink: 0 }}>
                {ep.projectCount} project{ep.projectCount !== 1 ? "s" : ""}
              </span>
              <span style={{ color: T.muted, transition: "transform 0.2s", transform: isOpen ? "rotate(90deg)" : "none" }}>
                <IcoArrow />
              </span>
            </button>
            {isOpen && (
              <div style={{ borderTop: `1px solid ${T.border}`, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
                {(ep.projects ?? []).map((proj: any, j: number) => (
                  <div key={j} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.accent, flexShrink: 0 }} />
                    <Link to={`/projects/${proj.projectId}`} style={{ color: T.text, textDecoration: "none", fontWeight: 500, flex: 1 }}>
                      {proj.projectName}
                    </Link>
                    {proj.rawUrl && (
                      <span style={{ color: T.dim, fontSize: 11, fontFamily: "monospace", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {proj.rawUrl}
                      </span>
                    )}
                    {proj.status && (
                      <Pill label={proj.status} color={T.muted} bg={T.border} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Section: Shared Flows ────────────────────────────────────────────────────

function SharedFlowsSection({ T }: { T: Tok }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/org/intelligence/shared-flows")
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <Loader T={T} />;
  if (!data)   return <Empty label="Could not load shared flow data." T={T} />;

  const { flows, totalShared } = data;

  if (totalShared === 0) {
    return (
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "40px 24px", textAlign: "center", color: T.muted }}>
        No shared flows found across projects. Shared flows appear when multiple projects have flows or tags with matching names.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 13, color: T.muted }}>
        {totalShared} flow pattern{totalShared !== 1 ? "s" : ""} shared across multiple projects
      </div>
      {(flows ?? []).map((flow: any, i: number) => {
        const isOpen = expanded === flow.normName;
        return (
          <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
            <button
              onClick={() => setExpanded(isOpen ? null : flow.normName)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "14px 16px", background: "transparent", border: "none",
                cursor: "pointer", textAlign: "left",
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.accent, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: T.text }}>
                {flow.displayName}
              </span>
              <span style={{ fontSize: 12, color: T.muted, flexShrink: 0 }}>
                {flow.projectCount} project{flow.projectCount !== 1 ? "s" : ""}
              </span>
              <span style={{ color: T.muted, transition: "transform 0.2s", transform: isOpen ? "rotate(90deg)" : "none" }}>
                <IcoArrow />
              </span>
            </button>
            {isOpen && (
              <div style={{ borderTop: `1px solid ${T.border}`, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
                {(flow.projects ?? []).map((proj: any, j: number) => (
                  <div key={j} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.dim, flexShrink: 0 }} />
                    <Link to={`/projects/${proj.projectId}`} style={{ color: T.text, textDecoration: "none", fontWeight: 500, flex: 1 }}>
                      {proj.projectName}
                    </Link>
                    {proj.stepCount > 0 && (
                      <span style={{ fontSize: 11, color: T.muted }}>{proj.stepCount} steps</span>
                    )}
                    {proj.coverage != null && (
                      <Pill label={`${proj.coverage}% covered`} color={proj.coverage >= 70 ? T.green : T.yellow} bg={(proj.coverage >= 70 ? T.green : T.yellow) + "18"} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Section: Risk Clusters ───────────────────────────────────────────────────

function RiskClustersSection({ T }: { T: Tok }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/org/intelligence/risk-clusters")
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <Loader T={T} />;
  if (!data)   return <Empty label="Could not load risk cluster data." T={T} />;

  const { clusters } = data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {(clusters ?? []).map((c: any, i: number) => {
        const isOpen = expanded === c.domain;
        const clr = severityColor(c.clusterRisk, T);
        const bg  = severityBg(c.clusterRisk, T);
        return (
          <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
            <button
              onClick={() => setExpanded(isOpen ? null : c.domain)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "14px 16px", background: "transparent", border: "none",
                cursor: "pointer", textAlign: "left",
              }}
            >
              <Pill label={c.clusterRisk} color={clr} bg={bg} />
              <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: T.text, textTransform: "capitalize" }}>
                {c.domain.replace(/-/g, " ")}
              </span>
              <div style={{ display: "flex", gap: 16, fontSize: 12, color: T.muted }}>
                <span>{c.projectCount} projects</span>
                <span>Avg risk <strong style={{ color: c.avgRisk > 50 ? T.red : T.text }}>{c.avgRisk}%</strong></span>
                <span>Avg pass <strong style={{ color: c.avgPassRate < 70 ? T.orange : T.text }}>{c.avgPassRate}%</strong></span>
                {c.totalCritical > 0 && <span style={{ color: T.red }}>{c.totalCritical} critical</span>}
              </div>
              <span style={{ color: T.muted, transition: "transform 0.2s", transform: isOpen ? "rotate(90deg)" : "none" }}>
                <IcoArrow />
              </span>
            </button>
            {isOpen && (
              <div style={{ borderTop: `1px solid ${T.border}`, padding: "14px 16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {(c.projects ?? []).map((p: any, j: number) => (
                    <div key={j} style={{ display: "grid", gridTemplateColumns: "1fr 70px 70px 70px 80px 90px", gap: 8, alignItems: "center", fontSize: 12 }}>
                      <Link to={`/projects/${p.projectId}`} style={{ color: T.text, textDecoration: "none", fontWeight: 500 }}>
                        {p.projectName}
                      </Link>
                      <div>
                        <div style={{ fontSize: 10, color: T.muted, marginBottom: 2 }}>Risk</div>
                        <span style={{ fontWeight: 600, color: p.riskScore > 50 ? T.red : T.text }}>{p.riskScore}%</span>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: T.muted, marginBottom: 2 }}>Pass</div>
                        <span style={{ fontWeight: 600, color: p.passRate < 70 ? T.orange : T.text }}>{p.passRate}%</span>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: T.muted, marginBottom: 2 }}>Coverage</div>
                        <span style={{ fontWeight: 600 }}>{p.reqCoverage}%</span>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: T.muted, marginBottom: 2 }}>Flaky</div>
                        <span style={{ fontWeight: 600, color: p.flakyCount >= 3 ? T.yellow : T.text }}>{p.flakyCount}</span>
                      </div>
                      <Pill
                        label={p.readinessStatus}
                        color={readinessColor(p.readinessStatus, T)}
                        bg={readinessColor(p.readinessStatus, T) + "18"}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Section: Teams ───────────────────────────────────────────────────────────

function TeamsSection({ T }: { T: Tok }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("qualityScore");

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/org/intelligence/teams?sortBy=${sort}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [sort]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Loader T={T} />;
  if (!data)   return <Empty label="Could not load team data." T={T} />;

  const { teams, orgAverage } = data;

  const SORTS = [
    { key: "qualityScore", label: "Quality Score" },
    { key: "passRate",     label: "Pass Rate"     },
    { key: "riskScore",    label: "Risk Score"    },
    { key: "coverage",     label: "Coverage"      },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Org averages */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <StatCard label="Org Quality Avg" value={orgAverage.qualityScore} sub="out of 100" color={orgAverage.qualityScore >= 70 ? T.green : T.yellow} T={T} />
        <StatCard label="Avg Pass Rate"   value={`${orgAverage.passRate}%`} T={T} />
        <StatCard label="Avg Coverage"    value={`${orgAverage.coverage}%`} T={T} />
        <StatCard label="Avg Risk Score"  value={`${orgAverage.riskScore}%`} color={orgAverage.riskScore > 50 ? T.red : orgAverage.riskScore > 30 ? T.yellow : T.green} T={T} />
      </div>

      {/* Sort pills */}
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <span style={{ fontSize: 12, color: T.muted, marginRight: 4 }}>Sort by:</span>
        {SORTS.map(s => (
          <button key={s.key}
            onClick={() => setSort(s.key)}
            style={{
              padding: "4px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600,
              border: `1px solid ${sort === s.key ? T.accent : T.border}`,
              background: sort === s.key ? T.accentSoft : "transparent",
              color: sort === s.key ? T.accent : T.muted,
              cursor: "pointer",
            }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Team cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
        {(teams ?? []).map((t: any, i: number) => (
          <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <Link to={`/projects/${t.projectId}`} style={{ color: T.text, textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
                  {t.projectName}
                </Link>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{t.projectType} project</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <Pill
                  label={t.badge.replace("-", " ")}
                  color={badgeColor(t.badge, T)}
                  bg={badgeColor(t.badge, T) + "20"}
                />
                <Pill
                  label={t.readinessStatus}
                  color={readinessColor(t.readinessStatus, T)}
                  bg={readinessColor(t.readinessStatus, T) + "18"}
                />
              </div>
            </div>

            {/* Quality score bar */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12 }}>
                <span style={{ color: T.muted }}>Quality Score</span>
                <span style={{ fontWeight: 700, color: t.qualityScore >= 70 ? T.green : t.qualityScore >= 50 ? T.yellow : T.red }}>
                  {t.qualityScore}
                </span>
              </div>
              <ScoreBar value={t.qualityScore} color={t.qualityScore >= 70 ? T.green : t.qualityScore >= 50 ? T.yellow : T.red} />
            </div>

            {/* Metric grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
              {[
                { label: "Pass Rate",  value: `${t.metrics.passRate}%`,    warn: t.metrics.passRate < 70   },
                { label: "Coverage",   value: `${t.metrics.reqCoverage}%`, warn: t.metrics.reqCoverage < 60 },
                { label: "Risk",       value: `${t.metrics.riskScore}%`,   warn: t.metrics.riskScore > 50  },
                { label: "Failure",    value: `${t.metrics.failureRate}%`,  warn: t.metrics.failureRate > 15 },
                { label: "Flaky",      value: `${t.metrics.flakyCount}`,    warn: t.metrics.flakyCount >= 3  },
                { label: "Tests",      value: `${t.metrics.testsTotal}`,    warn: false },
              ].map((m, mi) => (
                <div key={mi} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: T.muted, marginBottom: 2 }}>{m.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: m.warn ? T.orange : T.text }}>{m.value}</div>
                </div>
              ))}
            </div>

            {/* Strengths / Weaknesses */}
            {(t.strengths.length > 0 || t.weaknesses.length > 0) && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
                {t.strengths.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.green, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Strengths</div>
                    {t.strengths.map((s: string, si: number) => (
                      <div key={si} style={{ fontSize: 11, color: T.muted, marginBottom: 2 }}>• {s}</div>
                    ))}
                  </div>
                )}
                {t.weaknesses.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.red, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Needs Work</div>
                    {t.weaknesses.map((w: string, wi: number) => (
                      <div key={wi} style={{ fontSize: 11, color: T.muted, marginBottom: 2 }}>• {w}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section: Org Insights ────────────────────────────────────────────────────

function OrgInsightsSection({ T }: { T: Tok }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/org/intelligence/insights")
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <Loader T={T} />;
  if (!data)   return <Empty label="Could not load intelligence data." T={T} />;

  const { insights, criticalCount, highCount, totalInsights } = data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 10 }}>
        <Pill label={`${criticalCount} critical`} color={T.red}    bg={T.redSoft}    />
        <Pill label={`${highCount} high`}          color={T.orange}  bg={T.orangeSoft} />
        <Pill label={`${totalInsights} total`}     color={T.muted}   bg={T.border}     />
      </div>

      {totalInsights === 0 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "40px 24px", textAlign: "center", color: T.muted }}>
          No cross-project intelligence patterns detected yet. Add more projects and scan data to surface insights.
        </div>
      )}

      {(insights ?? []).map((insight: any, i: number) => {
        const clr = severityColor(insight.severity, T);
        const bg  = severityBg(insight.severity, T);
        const isPositive = insight.type === "positive-pattern";
        return (
          <div key={i} style={{
            background: T.card,
            border: `1px solid ${isPositive ? T.greenSoft : T.border}`,
            borderLeft: `3px solid ${clr}`,
            borderRadius: 12, padding: "16px 18px",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
              <Pill label={insight.severity} color={clr} bg={bg} />
              <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 99, background: T.border, color: T.muted, fontWeight: 600 }}>
                {insight.type.replace(/-/g, " ")}
              </span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 6 }}>{insight.title}</div>
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 10, lineHeight: 1.5 }}>{insight.detail}</div>

            {insight.affectedProjects?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
                {insight.affectedProjects.map((name: string, j: number) => (
                  <span key={j} style={{
                    padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 500,
                    background: T.accentSoft, color: T.accent,
                  }}>{name}</span>
                ))}
              </div>
            )}

            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 12, color: clr, fontWeight: 600,
            }}>
              <span style={{ opacity: 0.6 }}>Recommended action:</span>
              {insight.action}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Utility components ────────────────────────────────────────────────────────

function Loader({ T }: { T: Tok }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "48px 0", color: T.muted, fontSize: 13 }}>
      Loading…
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

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { id: "hotspots",  label: "Hotspots",         icon: <IcoHotspot />,   desc: "Projects ranked by quality heat" },
  { id: "endpoints", label: "Shared Endpoints",  icon: <IcoEndpoints />, desc: "API endpoints across projects" },
  { id: "flows",     label: "Shared Flows",      icon: <IcoFlows />,     desc: "Flow patterns across projects" },
  { id: "clusters",  label: "Risk Clusters",     icon: <IcoClusters />,  desc: "Domain-based risk groupings" },
  { id: "teams",     label: "Team Quality",      icon: <IcoTeams />,     desc: "Per-project quality profiles" },
  { id: "insights",  label: "Org Insights",      icon: <IcoInsights />,  desc: "Cross-project intelligence" },
] as const;

type TabId = typeof TABS[number]["id"];

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function OrgIntelligencePage() {
  const dark = useDarkMode();
  const T    = dark ? DARK : LIGHT;
  const [activeTab, setActiveTab] = useState<TabId>("hotspots");

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text }}>

      {/* Header */}
      <div style={{
        padding: "28px 32px 20px",
        borderBottom: `1px solid ${T.border}`,
        background: T.card,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: T.accentSoft,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: T.accent,
          }}>
            <IcoClusters />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: T.text, margin: 0, lineHeight: 1.2 }}>
              Cross-Project Intelligence
            </h1>
            <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>
              Org-wide quality patterns, shared risk surfaces, and team health
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 2, padding: "0 32px",
        borderBottom: `1px solid ${T.border}`,
        background: T.card, overflowX: "auto",
      }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "13px 14px",
                border: "none", borderBottom: `2px solid ${isActive ? T.accent : "transparent"}`,
                background: "transparent", cursor: "pointer",
                color: isActive ? T.accent : T.muted,
                fontSize: 13, fontWeight: isActive ? 700 : 500,
                whiteSpace: "nowrap",
                transition: "color 0.15s, border-color 0.15s",
              }}
            >
              <span style={{ color: isActive ? T.accent : T.muted, display: "flex" }}>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ padding: "24px 32px", maxWidth: 1200 }}>
        <div style={{ fontSize: 12, color: T.dim, marginBottom: 16 }}>
          {TABS.find(t => t.id === activeTab)?.desc}
        </div>

        {activeTab === "hotspots"  && <HotspotsSection T={T} />}
        {activeTab === "endpoints" && <SharedEndpointsSection T={T} />}
        {activeTab === "flows"     && <SharedFlowsSection T={T} />}
        {activeTab === "clusters"  && <RiskClustersSection T={T} />}
        {activeTab === "teams"     && <TeamsSection T={T} />}
        {activeTab === "insights"  && <OrgInsightsSection T={T} />}
      </div>
    </div>
  );
}
