import { useEffect, useState, useCallback } from "react";
import { theme } from "@/theme";
import { useColors } from "@/hooks/useColors";
import type { TabId } from "@/dashboard/pages/projects/layout/ProjectSidebar";

const API = "http://localhost:3000";

// ─── Theme ────────────────────────────────────────────────────────────────────

// ─── Colour palette ───────────────────────────────────────────────────────────

const C = {
  green:  "#4CAF50",  greenBg:  "#4CAF5018",
  yellow: "#FF9800",  yellowBg: "#FF980018",
  red:    "#EF5350",  redBg:    "#EF535018",
  blue:   "#448AFF",  blueBg:   "#448AFF18",
  purple: "#9C27B0",  purpleBg: "#9C27B018",
  gray:   "#9E9E9E",  grayBg:   "#9E9E9E18",
};

// ─── HeatMap tabs ─────────────────────────────────────────────────────────────

type HMTab = "coverage" | "flows" | "endpoints" | "risk" | "ai" | "trends";

const TABS: { id: HMTab; label: string; icon: string }[] = [
  { id: "coverage",  label: "Coverage",    icon: "◉" },
  { id: "flows",     label: "Flows",       icon: "⟳" },
  { id: "endpoints", label: "Endpoints",   icon: "⚡" },
  { id: "risk",      label: "Risk",        icon: "▲" },
  { id: "ai",        label: "AI Activity", icon: "✦" },
  { id: "trends",    label: "Trends",      icon: "〰" },
];

// ─── Status colours ───────────────────────────────────────────────────────────

function coverageColor(item: any): string {
  if (item.aiGenerated && !item.covered) return C.blue;
  if (item.covered) return C.green;
  if (item.partial)  return C.yellow;
  return C.red;
}

function flowColor(status: string): string {
  return status === "passed" ? C.green
    : status === "failed"  ? C.red
    : status === "flaky"   ? C.yellow
    : status === "skipped" ? C.gray
    : "#d0d0d0";
}

function endpointColor(status: string): string {
  return status === "healthy"         ? C.green
    : status === "slow"               ? C.yellow
    : status === "failing"            ? C.red
    : status === "schema-mismatch"    ? C.purple
    : C.gray;
}

function riskColor(level: string): string {
  return level === "critical" ? C.red
    : level === "high"        ? "#FF7043"
    : level === "medium"      ? C.yellow
    : C.green;
}

function trendColor(delta: number): string {
  if (delta <= 0) return "#e8e8e8";
  if (delta === 1) return "#c6e48b";
  if (delta === 2) return "#7bc96f";
  if (delta === 3) return "#239a3b";
  return "#196127";
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && text && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 6px)", left: "50%",
          transform: "translateX(-50%)", zIndex: 9999,
          background: "#1a1a2e", color: "#fff",
          padding: "5px 10px", borderRadius: 6,
          fontSize: 11, whiteSpace: "nowrap", pointerEvents: "none",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}>{text}</div>
      )}
    </div>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────

function DetailDrawer({ item, mode, onClose, onNavigate, CARD, BDR, TXT, TXT2 }: {
  item: any; mode: HMTab; onClose: () => void;
  onNavigate?: (tab: TabId) => void;
  CARD: string; BDR: string; TXT: string; TXT2: string;
}) {
  const { P } = useColors();
  if (!item) return null;

  const rows: { label: string; value: string | number | null }[] = [];

  if (mode === "coverage") {
    rows.push(
      { label: "Type",             value: item.type },
      { label: "Risk Level",       value: item.riskLevel },
      { label: "Business Priority", value: item.businessPriority },
      { label: "Covered",          value: item.covered ? "Yes" : "No" },
      { label: "Test Count",       value: item.coveredBy?.length ?? 0 },
      { label: "UI Coverage",      value: item.coverageDimensions?.ui ? "✓" : "✕" },
      { label: "API Coverage",     value: item.coverageDimensions?.api ? "✓" : "✕" },
      { label: "Hybrid Coverage",  value: item.coverageDimensions?.hybrid ? "✓" : "✕" },
    );
  } else if (mode === "flows") {
    rows.push(
      { label: "URL",         value: item.url ?? "—" },
      { label: "Last Status", value: item.lastStatus },
      { label: "Flaky Count", value: item.flakyCount },
      { label: "Runs",        value: item.runs?.length ?? 0 },
    );
  } else if (mode === "endpoints") {
    rows.push(
      { label: "Method",        value: item.method },
      { label: "Path",          value: item.path },
      { label: "Status",        value: item.status },
      { label: "Response Time", value: item.responseTime ? `${item.responseTime}ms` : "—" },
      { label: "Group",         value: item.group },
      { label: "Last Seen",     value: item.lastSeen ? new Date(item.lastSeen).toLocaleString() : "—" },
    );
  } else if (mode === "risk") {
    rows.push(
      { label: "Risk Level",        value: item.riskLevel },
      { label: "Risk Score",        value: `${Math.round(item.riskScore * 100)}%` },
      { label: "Covered",           value: item.covered ? "Yes" : "No" },
      { label: "Business Priority", value: item.businessPriority },
      { label: "Type",              value: item.type },
    );
  } else if (mode === "ai") {
    rows.push(
      { label: "Suggestions",    value: item.suggestions },
      { label: "Applied",        value: item.applied },
      { label: "Heals",          value: item.heals },
      { label: "Heals Applied",  value: item.healApplied },
    );
  }

  const TAB_NAV: Partial<Record<HMTab, TabId>> = {
    coverage: "rtm", flows: "flows", endpoints: "flows",
    risk: "rtm", ai: "suggestions",
  };

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0, width: 380,
      background: CARD, borderLeft: `1px solid ${BDR}`,
      boxShadow: "-8px 0 32px rgba(0,0,0,0.12)",
      zIndex: 200, display: "flex", flexDirection: "column",
      animation: "slideIn 0.2s ease",
    }}>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${BDR}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: TXT, lineHeight: 1.4, wordBreak: "break-word" }}>
            {item.label ?? item.flowName ?? item.path ?? item.id}
          </div>
          <div style={{ fontSize: 11, color: TXT2, marginTop: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {mode.replace("-", " ")}
          </div>
        </div>
        <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", color: TXT2, fontSize: 18, flexShrink: 0 }}>✕</button>
      </div>

      {/* Rows */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map(r => (
            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${BDR}` }}>
              <span style={{ fontSize: 12, color: TXT2 }}>{r.label}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: TXT }}>{r.value ?? "—"}</span>
            </div>
          ))}
        </div>

        {/* Flow run history */}
        {mode === "flows" && item.runs?.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: TXT2, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Run History</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {item.runs.map((r: any, i: number) => (
                <Tooltip key={i} text={`${r.status} — ${new Date(r.timestamp).toLocaleDateString()}`}>
                  <div style={{ width: 28, height: 28, borderRadius: 4, background: flowColor(r.status), cursor: "default" }} />
                </Tooltip>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer action */}
      {onNavigate && TAB_NAV[mode] && (
        <div style={{ padding: "14px 20px", borderTop: `1px solid ${BDR}` }}>
          <button
            onClick={() => onNavigate(TAB_NAV[mode]!)}
            style={{
              width: "100%", padding: "9px", borderRadius: 8,
              background: P, color: "#fff",
              border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
            }}
          >
            Open in {TAB_NAV[mode]?.toUpperCase()} →
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function Legend({ items }: { items: { color: string; label: string }[] }) {
  const { TXT2 } = useColors();
  return (
    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
      {items.map(it => (
        <div key={it.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 12, height: 12, borderRadius: 2, background: it.color, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: TXT2 }}>{it.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Summary stat ─────────────────────────────────────────────────────────────

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  const { TXT, TXT2, CARD, BDR } = useColors();
  return (
    <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, padding: "12px 16px", textAlign: "center", minWidth: 90 }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: color ?? TXT }}>{value}</div>
      <div style={{ fontSize: 11, color: TXT2, marginTop: 2 }}>{label}</div>
    </div>
  );
}

// ─── 1. Coverage HeatMap view ─────────────────────────────────────────────────

function CoverageView({ projectId, onSelect }: { projectId: string; onSelect: (item: any) => void }) {
  const { P, CARD, BDR, TXT, TXT2 } = useColors();
  const [data, setData] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`${API}/projects/${projectId}/heatmap/coverage`)
      .then(r => r.json()).then(setData).catch(() => setData([]));
  }, [projectId]);

  const filtered = data.filter(d => {
    if (search && !d.label.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "covered")   return d.covered;
    if (filter === "uncovered") return !d.covered;
    if (filter === "high-risk") return d.riskLevel === "high" || d.riskLevel === "critical";
    return true;
  });

  const covered   = data.filter(d => d.covered).length;
  const uncovered = data.filter(d => !d.covered).length;
  const highRisk  = data.filter(d => (d.riskLevel === "high" || d.riskLevel === "critical") && !d.covered).length;

  const DIMS = ["ui", "api", "hybrid", "flow"] as const;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Stat label="Total"     value={data.length} />
        <Stat label="Covered"   value={covered}   color={C.green} />
        <Stat label="Uncovered" value={uncovered} color={C.red} />
        <Stat label="High-Risk Gaps" value={highRisk} color="#FF7043" />
      </div>

      <Legend items={[
        { color: C.green,  label: "Fully covered" },
        { color: C.yellow, label: "Partial" },
        { color: C.red,    label: "Uncovered" },
        { color: C.blue,   label: "AI-generated" },
      ]} />

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search requirements…"
          style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${BDR}`, fontSize: 12, background: CARD, color: TXT, width: 200 }}
        />
        {["all", "covered", "uncovered", "high-risk"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600,
            border: `1px solid ${filter === f ? P : BDR}`,
            background: filter === f ? `${P}18` : CARD,
            color: filter === f ? P : TXT2, cursor: "pointer",
          }}>{f.replace("-", " ")}</button>
        ))}
      </div>

      {/* Matrix header */}
      <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 12, overflow: "hidden" }}>
        {/* Column headers */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr repeat(4, 80px)", gap: 0, background: `${P}08`, borderBottom: `1px solid ${BDR}`, padding: "8px 16px" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: TXT2, textTransform: "uppercase", letterSpacing: "0.07em" }}>Requirement</span>
          {DIMS.map(d => (
            <span key={d} style={{ fontSize: 11, fontWeight: 700, color: TXT2, textTransform: "uppercase", letterSpacing: "0.07em", textAlign: "center" }}>{d}</span>
          ))}
        </div>

        {/* Rows */}
        <div style={{ maxHeight: 500, overflowY: "auto" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: TXT2, fontSize: 13 }}>No requirements found</div>
          ) : filtered.map((item, i) => {
            const rowColor = coverageColor(item);
            return (
              <div key={item.id}
                onClick={() => onSelect(item)}
                style={{
                  display: "grid", gridTemplateColumns: "1fr repeat(4, 80px)",
                  gap: 0, padding: "9px 16px", cursor: "pointer",
                  borderBottom: i < filtered.length - 1 ? `1px solid ${BDR}` : "none",
                  borderLeft: `3px solid ${rowColor}`,
                  background: "transparent",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = `${rowColor}08`)}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: rowColor, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: TXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
                  {(item.riskLevel === "high" || item.riskLevel === "critical") && (
                    <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: C.redBg, color: C.red, fontWeight: 700, flexShrink: 0 }}>
                      {item.riskLevel.toUpperCase()}
                    </span>
                  )}
                </div>
                {DIMS.map(d => {
                  const ok = item.coverageDimensions?.[d];
                  return (
                    <div key={d} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: 4,
                        background: ok ? C.green : `${C.gray}30`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, color: ok ? "#fff" : C.gray,
                      }}>
                        {ok ? "✓" : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── 2. Flow Stability HeatMap ────────────────────────────────────────────────

function FlowsView({ projectId, onSelect }: { projectId: string; onSelect: (item: any) => void }) {
  const { P, CARD, BDR, TXT, TXT2 } = useColors();
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API}/projects/${projectId}/heatmap/flows`)
      .then(r => r.json()).then(setData).catch(() => setData([]));
  }, [projectId]);

  const stable  = data.filter(d => d.lastStatus === "passed").length;
  const failing  = data.filter(d => d.lastStatus === "failed").length;
  const flaky    = data.filter(d => d.lastStatus === "flaky").length;
  const notRun   = data.filter(d => d.lastStatus === "not-run" || !d.hasTests).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Stat label="Flows"   value={data.length} />
        <Stat label="Stable"  value={stable}  color={C.green} />
        <Stat label="Failing" value={failing} color={C.red} />
        <Stat label="Flaky"   value={flaky}   color={C.yellow} />
        <Stat label="No Tests" value={notRun} color={C.gray} />
      </div>

      <Legend items={[
        { color: C.green,  label: "Passed" },
        { color: C.red,    label: "Failed" },
        { color: C.yellow, label: "Flaky" },
        { color: C.gray,   label: "Skipped" },
        { color: "#d0d0d0", label: "Not run" },
      ]} />

      {/* Grid */}
      <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "8px 16px 8px", borderBottom: `1px solid ${BDR}`, background: `${P}08` }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: TXT2, textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Flow — Last 8 runs →
          </span>
        </div>
        <div style={{ maxHeight: 520, overflowY: "auto" }}>
          {data.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: TXT2, fontSize: 13 }}>No flows discovered yet</div>
          ) : data.map((flow, i) => (
            <div key={flow.flowId}
              onClick={() => onSelect(flow)}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "8px 16px",
                cursor: "pointer", borderBottom: i < data.length - 1 ? `1px solid ${BDR}` : "none",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = `${P}06`)}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              {/* Flow name */}
              <div style={{ width: 200, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12, color: TXT }}>
                {flow.flowName}
              </div>
              {/* Status indicator */}
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: flowColor(flow.lastStatus), flexShrink: 0 }} />
              {/* Run cells */}
              <div style={{ display: "flex", gap: 4, flex: 1 }}>
                {flow.runs.length === 0 ? (
                  <span style={{ fontSize: 11, color: C.gray, fontStyle: "italic" }}>no runs</span>
                ) : flow.runs.map((r: any, ri: number) => (
                  <Tooltip key={ri} text={`${r.status} — ${new Date(r.timestamp).toLocaleDateString()}`}>
                    <div style={{
                      width: 24, height: 24, borderRadius: 4,
                      background: flowColor(r.status), cursor: "pointer",
                      transition: "transform 0.1s",
                    }}
                      onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.2)")}
                      onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                    />
                  </Tooltip>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 3. Endpoint Health HeatMap ───────────────────────────────────────────────

function EndpointsView({ projectId, onSelect }: { projectId: string; onSelect: (item: any) => void }) {
  const { P, CARD, BDR, TXT, TXT2 } = useColors();
  const [data, setData] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetch(`${API}/projects/${projectId}/heatmap/endpoints`)
      .then(r => r.json()).then(setData).catch(() => setData([]));
  }, [projectId]);

  const counts = {
    healthy: data.filter(d => d.status === "healthy").length,
    slow: data.filter(d => d.status === "slow").length,
    failing: data.filter(d => d.status === "failing").length,
    "schema-mismatch": data.filter(d => d.status === "schema-mismatch").length,
  };

  const filtered = filterStatus === "all" ? data : data.filter(d => d.status === filterStatus);

  const METHOD_COLOR: Record<string, string> = {
    GET: "#4CAF50", POST: "#448AFF", PUT: "#FF9800", PATCH: "#9C27B0", DELETE: "#EF5350",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Stat label="Total"          value={data.length} />
        <Stat label="Healthy"        value={counts.healthy}              color={C.green} />
        <Stat label="Slow"           value={counts.slow}                 color={C.yellow} />
        <Stat label="Failing"        value={counts.failing}              color={C.red} />
        <Stat label="Schema Errors"  value={counts["schema-mismatch"]}   color={C.purple} />
      </div>

      <Legend items={[
        { color: C.green,  label: "Healthy" },
        { color: C.yellow, label: "Slow (>2s)" },
        { color: C.red,    label: "Failing" },
        { color: C.purple, label: "Schema mismatch" },
      ]} />

      {/* Filter chips */}
      <div style={{ display: "flex", gap: 8 }}>
        {["all", "failing", "slow", "schema-mismatch", "healthy"].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{
            padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer",
            border: `1px solid ${filterStatus === s ? endpointColor(s === "all" ? "healthy" : s) : BDR}`,
            background: filterStatus === s ? `${endpointColor(s === "all" ? "healthy" : s)}18` : CARD,
            color: filterStatus === s ? endpointColor(s === "all" ? "healthy" : s) : TXT2,
          }}>{s.replace("-", " ")}</button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "8px 16px", borderBottom: `1px solid ${BDR}`, background: `${P}08`, display: "grid", gridTemplateColumns: "80px 1fr 120px 100px" }}>
          {["Method", "Path", "Status", "Response"].map(h => (
            <span key={h} style={{ fontSize: 11, fontWeight: 700, color: TXT2, textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</span>
          ))}
        </div>
        <div style={{ maxHeight: 480, overflowY: "auto" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: TXT2, fontSize: 13 }}>No endpoints found</div>
          ) : filtered.map((ep, i) => {
            const sc = endpointColor(ep.status);
            return (
              <div key={ep.endpointId}
                onClick={() => onSelect(ep)}
                style={{
                  display: "grid", gridTemplateColumns: "80px 1fr 120px 100px",
                  padding: "9px 16px", cursor: "pointer",
                  borderBottom: i < filtered.length - 1 ? `1px solid ${BDR}` : "none",
                  borderLeft: `3px solid ${sc}`,
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = `${sc}08`)}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <span style={{ fontSize: 11, fontWeight: 800, color: METHOD_COLOR[ep.method] ?? TXT, fontFamily: "monospace" }}>{ep.method}</span>
                <span style={{ fontSize: 12, color: TXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace" }}>{ep.path}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: sc }} />
                  <span style={{ fontSize: 11, color: sc, fontWeight: 600 }}>{ep.status.replace("-", " ")}</span>
                </div>
                <span style={{ fontSize: 11, color: TXT2 }}>{ep.responseTime ? `${ep.responseTime}ms` : "—"}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── 4. Risk HeatMap ──────────────────────────────────────────────────────────

function RiskView({ projectId, onSelect }: { projectId: string; onSelect: (item: any) => void }) {
  const { CARD, BDR, TXT, TXT2 } = useColors();
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API}/projects/${projectId}/heatmap/risk`)
      .then(r => r.json()).then(setData).catch(() => setData([]));
  }, [projectId]);

  const LEVELS = ["critical", "high", "medium", "low"] as const;
  const groups = LEVELS.map(l => ({ level: l, items: data.filter(d => d.riskLevel === l) }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {LEVELS.map(l => (
          <Stat key={l} label={l} value={data.filter(d => d.riskLevel === l).length} color={riskColor(l)} />
        ))}
      </div>
      <Legend items={[
        { color: C.red,    label: "Critical" },
        { color: "#FF7043", label: "High" },
        { color: C.yellow, label: "Medium" },
        { color: C.green,  label: "Low" },
      ]} />

      {groups.filter(g => g.items.length > 0).map(group => (
        <div key={group.level}>
          <div style={{ fontSize: 11, fontWeight: 700, color: riskColor(group.level), textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
            {group.level} — {group.items.length} item{group.items.length !== 1 ? "s" : ""}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 8 }}>
            {group.items.map(item => {
              const rc = riskColor(item.riskLevel);
              return (
                <div key={item.id}
                  onClick={() => onSelect(item)}
                  style={{
                    background: CARD, border: `1px solid ${rc}30`, borderLeft: `3px solid ${rc}`,
                    borderRadius: 8, padding: "10px 14px", cursor: "pointer",
                    transition: "box-shadow 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 4px 12px ${rc}20`)}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color: TXT, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.label}
                  </div>
                  {/* Risk intensity bar */}
                  <div style={{ height: 4, borderRadius: 2, background: `${rc}20` }}>
                    <div style={{ height: "100%", borderRadius: 2, background: rc, width: `${item.riskScore * 100}%`, transition: "width 0.5s" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                    <span style={{ fontSize: 10, color: TXT2 }}>{item.covered ? "✓ Covered" : "✕ Uncovered"}</span>
                    <span style={{ fontSize: 10, color: rc, fontWeight: 700 }}>{Math.round(item.riskScore * 100)}% risk</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {data.length === 0 && (
        <div style={{ padding: 32, textAlign: "center", color: TXT2, fontSize: 13 }}>No RTM data available</div>
      )}
    </div>
  );
}

// ─── 5. AI Activity HeatMap ───────────────────────────────────────────────────

function AIView({ projectId, onSelect }: { projectId: string; onSelect: (item: any) => void }) {
  const { P, CARD, BDR, TXT, TXT2 } = useColors();
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API}/projects/${projectId}/heatmap/ai`)
      .then(r => r.json()).then(setData).catch(() => setData([]));
  }, [projectId]);

  const totalSuggestions = data.reduce((s, d) => s + d.suggestions, 0);
  const totalApplied     = data.reduce((s, d) => s + d.applied, 0);
  const totalHeals       = data.reduce((s, d) => s + d.heals, 0);

  const maxActivity = Math.max(...data.map(d => d.suggestions + d.heals), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Stat label="Suggestions"   value={totalSuggestions} color={C.blue} />
        <Stat label="Applied"       value={totalApplied}     color={C.green} />
        <Stat label="Auto-Heals"    value={totalHeals}       color={C.purple} />
      </div>
      <Legend items={[
        { color: C.blue,   label: "AI Suggested" },
        { color: C.green,  label: "Applied" },
        { color: C.purple, label: "Auto-Healed" },
        { color: C.gray,   label: "No activity" },
      ]} />

      <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px 80px 100px", padding: "8px 16px", borderBottom: `1px solid ${BDR}`, background: `${P}08` }}>
          {["Requirement", "Suggest.", "Applied", "Heals", "Heal OK", "Activity"].map(h => (
            <span key={h} style={{ fontSize: 11, fontWeight: 700, color: TXT2, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</span>
          ))}
        </div>
        <div style={{ maxHeight: 480, overflowY: "auto" }}>
          {data.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: TXT2, fontSize: 13 }}>No AI activity recorded</div>
          ) : data.map((item, i) => {
            const activity = item.suggestions + item.heals;
            const intensity = activity / maxActivity;
            const barColor = item.heals > 0 ? C.purple : item.applied > 0 ? C.green : C.blue;
            return (
              <div key={item.id}
                onClick={() => onSelect(item)}
                style={{
                  display: "grid", gridTemplateColumns: "1fr 80px 80px 80px 80px 100px",
                  padding: "9px 16px", cursor: "pointer",
                  borderBottom: i < data.length - 1 ? `1px solid ${BDR}` : "none",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = `${C.blue}06`)}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <span style={{ fontSize: 12, color: TXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
                <span style={{ fontSize: 12, color: item.suggestions > 0 ? C.blue : TXT2, textAlign: "center" }}>{item.suggestions}</span>
                <span style={{ fontSize: 12, color: item.applied > 0 ? C.green : TXT2, textAlign: "center" }}>{item.applied}</span>
                <span style={{ fontSize: 12, color: item.heals > 0 ? C.purple : TXT2, textAlign: "center" }}>{item.heals}</span>
                <span style={{ fontSize: 12, color: item.healApplied > 0 ? C.green : TXT2, textAlign: "center" }}>{item.healApplied}</span>
                {/* Activity bar */}
                <div style={{ display: "flex", alignItems: "center", paddingLeft: 4 }}>
                  <div style={{ height: 8, borderRadius: 4, background: `${barColor}20`, width: "100%", overflow: "hidden" }}>
                    <div style={{ height: "100%", background: barColor, width: `${intensity * 100}%`, borderRadius: 4, transition: "width 0.5s" }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── 6. Trend HeatMap (GitHub-style) ─────────────────────────────────────────

function TrendsView({ projectId }: { projectId: string }) {
  const { CARD, BDR, TXT, TXT2 } = useColors();
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API}/projects/${projectId}/heatmap/trends`)
      .then(r => r.json()).then(setData).catch(() => setData([]));
  }, [projectId]);

  const maxCount = Math.max(...data.flatMap(m => m.values.map((v: any) => v.count)), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Legend items={[
        { color: "#e8e8e8", label: "No activity" },
        { color: "#c6e48b", label: "Low" },
        { color: "#7bc96f", label: "Medium" },
        { color: "#239a3b", label: "High" },
        { color: "#196127", label: "Peak" },
      ]} />

      <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 12, padding: "16px 20px", overflowX: "auto" }}>
        {data.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: TXT2, fontSize: 13 }}>No history data available</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Week labels */}
            {data[0] && (
              <div style={{ display: "flex", gap: 6, paddingLeft: 120 }}>
                {data[0].values.map((v: any, i: number) => (
                  <div key={i} style={{ width: 22, fontSize: 9, color: TXT2, textAlign: "center", flexShrink: 0 }}>
                    {new Date(v.timestamp).toLocaleDateString("en", { month: "short", day: "numeric" })}
                  </div>
                ))}
              </div>
            )}

            {/* Metric rows */}
            {data.map(metric => (
              <div key={metric.metric} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 110, flexShrink: 0, fontSize: 12, fontWeight: 600, color: TXT, textAlign: "right" }}>
                  {metric.label}
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {metric.values.map((v: any, i: number) => {
                    const intensity = v.count / maxCount;
                    const lvl = intensity === 0 ? 0 : intensity < 0.25 ? 1 : intensity < 0.5 ? 2 : intensity < 0.75 ? 3 : 4;
                    const colors = ["#e8e8e8", "#c6e48b", "#7bc96f", "#239a3b", "#196127"];
                    return (
                      <Tooltip key={i} text={`${v.count} events — w/o ${new Date(v.timestamp).toLocaleDateString()}`}>
                        <div style={{
                          width: 22, height: 22, borderRadius: 3,
                          background: colors[lvl],
                          cursor: "default", flexShrink: 0,
                          transition: "transform 0.1s",
                        }}
                          onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.3)")}
                          onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                        />
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

interface Props {
  projectId: string;
  onNavigate?: (tab: TabId) => void;
}

export default function HeatMapPage({ projectId, onNavigate }: Props) {
  const { P, CARD, BDR, TXT, TXT2 } = useColors();
  const [activeTab, setActiveTab] = useState<HMTab>("coverage");
  const [selected, setSelected] = useState<any>(null);
  const [selectedMode, setSelectedMode] = useState<HMTab>("coverage");

  const select = useCallback((item: any, mode: HMTab) => {
    setSelected(item);
    setSelectedMode(mode);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "4px 0 32px", position: "relative" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: TXT }}>HeatMap</h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: TXT2 }}>
            Multi-dimensional quality matrix — coverage, stability, risk, and AI activity
          </p>
        </div>
      </div>

      {/* ── Tab bar ────────────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", gap: 4, padding: "4px",
        background: CARD, border: `1px solid ${BDR}`, borderRadius: 12,
        width: "fit-content",
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: activeTab === t.id ? 700 : 500,
            background: activeTab === t.id ? `${P}14` : "transparent",
            color: activeTab === t.id ? P : TXT2,
            transition: "all 0.15s",
          }}>
            <span style={{ fontSize: 14 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Active HeatMap ──────────────────────────────────────────────────── */}
      {activeTab === "coverage"  && <CoverageView  projectId={projectId} onSelect={item => select(item, "coverage")} />}
      {activeTab === "flows"     && <FlowsView     projectId={projectId} onSelect={item => select(item, "flows")} />}
      {activeTab === "endpoints" && <EndpointsView projectId={projectId} onSelect={item => select(item, "endpoints")} />}
      {activeTab === "risk"      && <RiskView      projectId={projectId} onSelect={item => select(item, "risk")} />}
      {activeTab === "ai"        && <AIView        projectId={projectId} onSelect={item => select(item, "ai")} />}
      {activeTab === "trends"    && <TrendsView    projectId={projectId} />}

      {/* ── Backdrop ───────────────────────────────────────────────────────── */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.2)", zIndex: 199 }}
        />
      )}

      {/* ── Detail drawer ──────────────────────────────────────────────────── */}
      {selected && (
        <DetailDrawer
          item={selected} mode={selectedMode}
          onClose={() => setSelected(null)}
          onNavigate={onNavigate}
          CARD={CARD} BDR={BDR} TXT={TXT} TXT2={TXT2}
        />
      )}
    </div>
  );
}
