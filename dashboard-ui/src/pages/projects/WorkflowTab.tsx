import { useState, useEffect, useCallback } from "react";
import { useColors } from "@/hooks/useColors";

// ─── Types ─────────────────────────────────────────────────────────────────────

type PRStatus   = "open" | "merged" | "blocked" | "closed";
type RImpact    = "none" | "minor" | "major" | "critical";
type RiskLevel  = "low" | "medium" | "high" | "critical";

interface PRRow {
  id: string; number: number; title: string; author: string; status: PRStatus;
  headBranch: string; linesAdded: number; linesRemoved: number;
  regressionProbability: number; readinessImpact: RImpact; coverageDelta: number;
  riskLevel: RiskLevel; mergeGatePass: boolean; insightCount: number; createdAt: string;
}

interface PRDetail {
  id: string; number: number; title: string; author: string; status: PRStatus;
  baseBranch: string; headBranch: string; linesAdded: number; linesRemoved: number;
  impact: {
    changedFiles: string[]; impactedRequirements: string[]; impactedTests: string[];
    impactedFlows: string[]; impactedEndpoints: string[];
    riskScoreDelta: number; coverageDelta: number; readinessImpact: RImpact;
    regressionProbability: number; riskLevel: RiskLevel;
    symbols: { name: string; type: string; location: string }[];
  };
  mergeGate: { pass: boolean; blockers: string[]; warnings: string[] };
  insights: { type: string; severity: string; message: string }[];
  requiredTests: string[]; suggestedTests: string[];
  annotation: string; createdAt: string; analyzedAt: string;
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

function Svg({ c, size = 16 }: { c: React.ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
      xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>{c}</svg>
  );
}

const IcoGit     = () => <Svg c={<><circle cx="4" cy="4" r="1.8" stroke="currentColor" strokeWidth="1.3"/><circle cx="4" cy="12" r="1.8" stroke="currentColor" strokeWidth="1.3"/><circle cx="12" cy="4" r="1.8" stroke="currentColor" strokeWidth="1.3"/><path d="M4 5.8v4.4M5.8 4h1.7a2.5 2.5 0 012.5 2.5V12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></>} />;
const IcoShield  = () => <Svg c={<><path d="M8 2L2 5v4c0 3.3 2.5 5.8 6 6.5 3.5-.7 6-3.2 6-6.5V5L8 2z" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinejoin="round"/><path d="M5.5 8.5l1.8 1.8L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></>} />;
const IcoAlert   = () => <Svg c={<><path d="M8 3L1.5 13.5h13L8 3z" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinejoin="round"/><path d="M8 7v3M8 11.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></>} />;
const IcoCopy    = () => <Svg c={<><rect x="5" y="5" width="8" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.3" fill="none"/><path d="M3 11V4a1 1 0 011-1h7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></>} />;
const IcoArrow   = ({ open }: { open: boolean }) => <Svg size={12} c={<path d={open ? "M4 10l4-4 4 4" : "M4 6l4 4 4-4"} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>} />;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function riskC(r: RiskLevel | string, alpha = "") {
  const m: Record<string, string> = { low: "#22C55E", medium: "#F59E0B", high: "#F97316", critical: "#EF4444", none: "#6B7280", minor: "#F59E0B", major: "#F97316" };
  return (m[r] ?? "#6B7280") + alpha;
}

function Pill({ label, color, size = "sm" }: { label: string; color: string; size?: "xs" | "sm" }) {
  return <span style={{ display: "inline-flex", alignItems: "center", padding: size === "xs" ? "1px 6px" : "2px 8px", borderRadius: 99, fontSize: size === "xs" ? 10 : 11, fontWeight: 600, background: color + "20", color }}>{label}</span>;
}

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <div style={{ width: 48, height: 4, borderRadius: 2, background: color + "20", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.min(100, value * 100)}%`, background: color }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color }}>{Math.round(value * 100)}%</span>
    </div>
  );
}

function statusConfig(s: PRStatus) {
  const m = { open: { color: "#3B82F6", label: "Open" }, merged: { color: "#22C55E", label: "Merged" }, blocked: { color: "#EF4444", label: "Blocked" }, closed: { color: "#6B7280", label: "Closed" } };
  return m[s] ?? m.open;
}

// ─── PR row ────────────────────────────────────────────────────────────────────

function PRRow({ pr, selected, onSelect, TXT, TXT2, BDR, CARD }: {
  pr: PRRow; selected: boolean; onSelect: () => void;
  TXT: string; TXT2: string; BDR: string; CARD: string;
}) {
  const sc = statusConfig(pr.status);
  const rc = riskC(pr.riskLevel);
  const daysAgo = Math.round((Date.now() - new Date(pr.createdAt).getTime()) / 86_400_000);

  return (
    <button onClick={onSelect} style={{
      width: "100%", display: "flex", alignItems: "center", gap: 12,
      padding: "11px 14px", border: "none", borderBottom: `1px solid ${BDR}`,
      background: selected ? rc + "08" : "transparent",
      cursor: "pointer", textAlign: "left",
      borderLeft: `3px solid ${selected ? rc : "transparent"}`,
      transition: "background 0.12s, border-color 0.12s",
    }}>
      {/* Status dot */}
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: sc.color, flexShrink: 0, boxShadow: pr.status === "blocked" ? `0 0 6px ${sc.color}88` : "none" }} />

      {/* Title + branch */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: TXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>
          #{pr.number} {pr.title}
        </div>
        <div style={{ fontSize: 11, color: TXT2, display: "flex", gap: 8 }}>
          <span style={{ fontFamily: "monospace" }}>{pr.headBranch}</span>
          <span>·</span>
          <span>{pr.author}</span>
          <span>·</span>
          <span>{daysAgo}d ago</span>
        </div>
      </div>

      {/* Metrics */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
        <MiniBar value={pr.regressionProbability} color={riskC(pr.riskLevel)} />
        <div style={{ textAlign: "right", minWidth: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: pr.coverageDelta >= 0 ? "#22C55E" : "#EF4444" }}>
            {pr.coverageDelta >= 0 ? "+" : ""}{pr.coverageDelta.toFixed(1)}%
          </div>
          <div style={{ fontSize: 10, color: TXT2 }}>cov</div>
        </div>
        <Pill label={sc.label} color={sc.color} size="xs" />
      </div>
    </button>
  );
}

// ─── PR detail panel ───────────────────────────────────────────────────────────

function PRDetailPanel({ pr, onClose, TXT, TXT2, BDR, CARD, P }: {
  pr: PRDetail; onClose: () => void;
  TXT: string; TXT2: string; BDR: string; CARD: string; P: string;
}) {
  const [annotationOpen, setAnnotationOpen] = useState(false);
  const [copied, setCopied]                 = useState(false);

  const copyAnnotation = () => {
    navigator.clipboard.writeText(pr.annotation).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const sc = statusConfig(pr.status);
  const rc = riskC(pr.riskLevel);

  const SEV_COLORS: Record<string, string> = { critical: "#EF4444", high: "#F97316", medium: "#F59E0B", low: "#22C55E" };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      {/* Header */}
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${BDR}`, display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
            <Pill label={sc.label} color={sc.color} />
            <Pill label={pr.impact.riskLevel} color={rc} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: TXT, lineHeight: 1.35 }}>#{pr.number} {pr.title}</div>
          <div style={{ fontSize: 11, color: TXT2, marginTop: 3, display: "flex", gap: 8 }}>
            <span style={{ fontFamily: "monospace", color: P }}>{pr.headBranch}</span>
            <span>→ {pr.baseBranch}</span>
            <span>·</span><span>{pr.author}</span>
          </div>
        </div>
      </div>

      {/* Merge gate banner */}
      <div style={{
        padding: "10px 16px",
        background: pr.mergeGate.pass ? "#22C55E10" : "#EF444410",
        borderBottom: `1px solid ${pr.mergeGate.pass ? "#22C55E30" : "#EF444430"}`,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ color: pr.mergeGate.pass ? "#22C55E" : "#EF4444", display: "flex" }}>
          {pr.mergeGate.pass ? <IcoShield /> : <IcoAlert />}
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: pr.mergeGate.pass ? "#22C55E" : "#EF4444" }}>
          {pr.mergeGate.pass ? "Merge gate passed" : `Merge blocked — ${pr.mergeGate.blockers.length} blocker${pr.mergeGate.blockers.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Key metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
          {[
            { label: "Regression Risk", value: `${Math.round(pr.impact.regressionProbability * 100)}%`, color: riskC(pr.impact.riskLevel) },
            { label: "Readiness Impact", value: pr.impact.readinessImpact, color: riskC(pr.impact.readinessImpact) },
            { label: "Coverage Delta", value: `${pr.impact.coverageDelta >= 0 ? "+" : ""}${pr.impact.coverageDelta.toFixed(1)}%`, color: pr.impact.coverageDelta >= 0 ? "#22C55E" : "#EF4444" },
            { label: "Risk Delta", value: `${pr.impact.riskScoreDelta >= 0 ? "+" : ""}${pr.impact.riskScoreDelta.toFixed(1)}`, color: pr.impact.riskScoreDelta > 0 ? "#F97316" : "#22C55E" },
          ].map((m, i) => (
            <div key={i} style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ fontSize: 10, color: TXT2, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>{m.label}</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Blockers + Warnings */}
        {pr.mergeGate.blockers.length > 0 && (
          <div style={{ background: "#EF444410", border: "1px solid #EF444430", borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#EF4444", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Blockers</div>
            {pr.mergeGate.blockers.map((b, i) => <div key={i} style={{ fontSize: 12, color: "#EF4444", marginBottom: 3 }}>✗ {b}</div>)}
          </div>
        )}
        {pr.mergeGate.warnings.length > 0 && (
          <div style={{ background: "#F59E0B10", border: "1px solid #F59E0B30", borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#F59E0B", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Warnings</div>
            {pr.mergeGate.warnings.map((w, i) => <div key={i} style={{ fontSize: 12, color: "#F59E0B", marginBottom: 3 }}>⚠ {w}</div>)}
          </div>
        )}

        {/* Insights */}
        {pr.insights.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: TXT2, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Code Insights</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {pr.insights.map((ins, i) => {
                const sc = SEV_COLORS[ins.severity] ?? "#6B7280";
                return (
                  <div key={i} style={{ background: sc + "0C", border: `1px solid ${sc}25`, borderLeft: `3px solid ${sc}`, borderRadius: 6, padding: "7px 10px", display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <Pill label={ins.severity} color={sc} size="xs" />
                    <span style={{ fontSize: 12, color: TXT }}>{ins.message}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Impact details */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: "Impacted Requirements", items: pr.impact.impactedRequirements, color: "#6D4FF0" },
            { label: "Impacted Tests",         items: pr.impact.impactedTests,         color: "#3B82F6" },
            { label: "Impacted Flows",          items: pr.impact.impactedFlows,          color: "#F97316" },
            { label: "Impacted Endpoints",      items: pr.impact.impactedEndpoints,      color: "#10B981" },
          ].map(block => block.items.length > 0 && (
            <div key={block.label} style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: TXT2, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{block.label} ({block.items.length})</div>
              {block.items.slice(0, 4).map((item, i) => (
                <div key={i} style={{ fontSize: 11, color: TXT, display: "flex", gap: 5, marginBottom: 3, alignItems: "flex-start" }}>
                  <span style={{ color: block.color, flexShrink: 0 }}>•</span>
                  <span style={{ fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item}</span>
                </div>
              ))}
              {block.items.length > 4 && <div style={{ fontSize: 11, color: TXT2 }}>+{block.items.length - 4} more</div>}
            </div>
          ))}
        </div>

        {/* Required / Suggested tests */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {pr.requiredTests.length > 0 && (
            <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#22C55E", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Required Tests</div>
              {pr.requiredTests.map((t, i) => <div key={i} style={{ fontSize: 11, color: TXT, fontFamily: "monospace", marginBottom: 3 }}>✅ {t}</div>)}
            </div>
          )}
          {pr.suggestedTests.length > 0 && (
            <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: P, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Suggested Tests</div>
              {pr.suggestedTests.map((t, i) => <div key={i} style={{ fontSize: 11, color: TXT, fontFamily: "monospace", marginBottom: 3 }}>💡 {t}</div>)}
            </div>
          )}
        </div>

        {/* Changed files + symbols */}
        {pr.impact.changedFiles.length > 0 && (
          <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: TXT2, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Changed Files ({pr.impact.changedFiles.length}) — <span style={{ color: "#22C55E" }}>+{pr.linesAdded}</span> / <span style={{ color: "#EF4444" }}>-{pr.linesRemoved}</span>
            </div>
            {pr.impact.changedFiles.map((f, i) => {
              const sym = pr.impact.symbols.find(s => s.location === f);
              return (
                <div key={i} style={{ fontSize: 11, color: TXT, fontFamily: "monospace", marginBottom: 4, display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ color: TXT2 }}>{f}</span>
                  {sym && <Pill label={sym.type} color="#6B7280" size="xs" />}
                </div>
              );
            })}
          </div>
        )}

        {/* PR Annotation */}
        <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 8, overflow: "hidden" }}>
          <button
            onClick={() => setAnnotationOpen(!annotationOpen)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 8,
              padding: "10px 12px", background: "transparent", border: "none",
              cursor: "pointer", textAlign: "left",
            }}
          >
            <span style={{ color: P, display: "flex" }}><IcoGit /></span>
            <span style={{ fontSize: 12, fontWeight: 700, color: TXT, flex: 1 }}>PR Annotation (GitHub / GitLab comment)</span>
            <button
              onClick={e => { e.stopPropagation(); copyAnnotation(); }}
              style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, border: `1px solid ${BDR}`, background: "transparent", cursor: "pointer", fontSize: 11, color: copied ? "#22C55E" : TXT2 }}
            >
              <IcoCopy /> {copied ? "Copied!" : "Copy"}
            </button>
            <IcoArrow open={annotationOpen} />
          </button>
          {annotationOpen && (
            <div style={{ borderTop: `1px solid ${BDR}`, padding: "12px", background: "#00000008", overflow: "auto", maxHeight: 300 }}>
              <pre style={{ fontSize: 11, color: TXT2, fontFamily: "monospace", margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                {pr.annotation}
              </pre>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function WorkflowTab({ projectId }: { projectId: string }) {
  const { P, BDR, CARD, TXT, TXT2 } = useColors();
  const [summary, setSummary]         = useState<any>(null);
  const [prs, setPRs]                 = useState<PRRow[]>([]);
  const [selectedPR, setSelectedPR]   = useState<PRDetail | null>(null);
  const [loading, setLoading]         = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusFilter, setStatusFilter]   = useState("all");
  const [reanalyzing, setReanalyzing]     = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const url = statusFilter !== "all"
      ? `/projects/${projectId}/workflow/prs?status=${statusFilter}`
      : `/projects/${projectId}/workflow/prs`;
    fetch(url)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setSummary(d); setPRs(d.prs ?? []); } setLoading(false); })
      .catch(() => setLoading(false));
  }, [projectId, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const selectPR = (pr: PRRow) => {
    if (selectedPR?.id === pr.id) { setSelectedPR(null); return; }
    setDetailLoading(true);
    fetch(`/projects/${projectId}/workflow/prs/${pr.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && !d.error) setSelectedPR(d); setDetailLoading(false); })
      .catch(() => setDetailLoading(false));
  };

  const reanalyze = () => {
    setReanalyzing(true);
    setSelectedPR(null);
    fetch(`/projects/${projectId}/workflow/analyze`, { method: "POST" })
      .then(() => { load(); setReanalyzing(false); })
      .catch(() => setReanalyzing(false));
  };

  const STATUSES = ["all", "open", "blocked", "merged", "closed"];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 0 16px", flexShrink: 0 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: P + "18", display: "flex", alignItems: "center", justifyContent: "center", color: P }}>
          <IcoGit />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: TXT }}>Developer Workflow</div>
          <div style={{ fontSize: 12, color: TXT2 }}>PR impact analysis, merge gates, and code risk</div>
        </div>
        {summary && (
          <div style={{ display: "flex", gap: 8, fontSize: 12 }}>
            {[
              { label: "Open",    value: summary.open,    color: "#3B82F6" },
              { label: "Blocked", value: summary.blocked, color: "#EF4444" },
              { label: "Merged",  value: summary.merged,  color: "#22C55E" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center", background: s.color + "10", border: `1px solid ${s.color}30`, borderRadius: 8, padding: "4px 10px" }}>
                <div style={{ fontWeight: 800, color: s.color, fontSize: 15, lineHeight: 1 }}>{s.value}</div>
                <div style={{ color: TXT2, fontSize: 10 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={reanalyze}
          disabled={reanalyzing}
          style={{
            padding: "7px 14px", borderRadius: 8, border: `1px solid ${BDR}`,
            background: "transparent", cursor: reanalyzing ? "default" : "pointer",
            fontSize: 12, fontWeight: 600, color: TXT2, opacity: reanalyzing ? 0.5 : 1,
          }}>
          {reanalyzing ? "Analyzing…" : "Re-analyze"}
        </button>
      </div>

      {/* Status filter */}
      <div style={{ display: "flex", gap: 4, marginBottom: 12, flexShrink: 0 }}>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{
            padding: "4px 11px", borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: "pointer",
            border: `1px solid ${statusFilter === s ? P : BDR}`,
            background: statusFilter === s ? P + "18" : "transparent",
            color: statusFilter === s ? P : TXT2,
          }}>{s === "all" ? "All PRs" : s.charAt(0).toUpperCase() + s.slice(1)}</button>
        ))}
      </div>

      {/* Split pane: list + detail */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: selectedPR ? "1fr 1fr" : "1fr", gap: 12, overflow: "hidden", minHeight: 0 }}>

        {/* PR list */}
        <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {loading ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: TXT2, fontSize: 13 }}>Loading PRs…</div>
          ) : prs.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center", color: TXT2, fontSize: 13 }}>No PRs found.</div>
          ) : (
            <div style={{ overflowY: "auto", flex: 1 }}>
              {prs.map(pr => (
                <PRRow key={pr.id} pr={pr} selected={selectedPR?.id === pr.id}
                  onSelect={() => selectPR(pr)} TXT={TXT} TXT2={TXT2} BDR={BDR} CARD={CARD} />
              ))}
            </div>
          )}
        </div>

        {/* PR detail */}
        {selectedPR && (
          <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, overflow: "hidden" }}>
            {detailLoading
              ? <div style={{ padding: "40px 0", textAlign: "center", color: TXT2 }}>Loading…</div>
              : <PRDetailPanel pr={selectedPR} onClose={() => setSelectedPR(null)} TXT={TXT} TXT2={TXT2} BDR={BDR} CARD={CARD} P={P} />
            }
          </div>
        )}
      </div>
    </div>
  );
}
