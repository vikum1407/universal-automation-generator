import { useColors } from "@/hooks/useColors";
import { useState, useEffect } from "react";
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { fetchTimelineProjects, type TimelineProject } from "@/api/timeline";
import {
  fetchTrendsOverview,
  DATE_RANGE_OPTIONS,
  type TrendsOverview, type DateRange, type TrendPoint,
} from "@/api/trends";

// ─── Fixed accent palette ─────────────────────────────────────────────────────

const C = {
  purple: "#7B2FF7", cyan: "#2FF7D1", blue: "#448AFF",
  green:  "#66BB6A", orange: "#FFA726", red: "#EF5350",
  pink:   "#E91E63", indigo: "#5C6BC0", teal: "#26A69A",
};

const PROJECT_COLORS = [C.purple, C.blue, C.green, C.orange, C.cyan, C.pink, C.indigo, C.teal, C.red];

// ─── Chart helpers (parameterized — plain functions, no hooks) ────────────────

function chartTT(surface: string, border: string, text: string) {
  return {
    contentStyle: { background: surface, border: `1px solid ${border}`, borderRadius: 8, fontSize: 12 },
    labelStyle: { fontWeight: 600, color: text },
  };
}

function gridEl(stroke: string) {
  return <CartesianGrid strokeDasharray="3 3" stroke={stroke} />;
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const { CARD: bg, BDR: border } = useColors();
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 14, padding: "20px 24px", ...style }}>
      {children}
    </div>
  );
}

function SH({ children }: { children: React.ReactNode }) {
  const { TXT2 } = useColors();
  return (
    <div style={{ fontSize: 12, fontWeight: 700, color: TXT2, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
      {children}
    </div>
  );
}

function Spinner() {
  const { TXT2 } = useColors();
  return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 240, color: TXT2, fontSize: 13 }}>Loading…</div>;
}

// ─── KPI Tile ─────────────────────────────────────────────────────────────────

function KpiTile({ label, value, unit = "", delta, invert = false, color, sub }:
  { label: string; value: number; unit?: string; delta?: number; invert?: boolean; color?: string; sub?: string }) {
  const { TXT2, P } = useColors();
  const c = color ?? P;
  const good = invert ? (delta ?? 0) <= 0 : (delta ?? 0) >= 0;
  return (
    <Card style={{ flex: 1, minWidth: 140, padding: "16px 18px" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: TXT2, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: c, lineHeight: 1 }}>
        {Math.round(value * 10) / 10}
        <span style={{ fontSize: 13, fontWeight: 400, color: TXT2, marginLeft: 2 }}>{unit}</span>
      </div>
      {delta !== undefined && (
        <div style={{ fontSize: 11, marginTop: 5, color: good ? C.green : C.red, fontWeight: 600 }}>
          {delta >= 0 ? "▲" : "▼"} {Math.abs(Math.round(delta * 10) / 10)}{unit} vs prev period
        </div>
      )}
      {sub && <div style={{ fontSize: 11, color: TXT2, marginTop: 4 }}>{sub}</div>}
    </Card>
  );
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

function avgSeries(all: TrendPoint[][]): TrendPoint[] {
  if (!all.length) return [];
  const len = Math.min(...all.map(s => s.length));
  return all[0].slice(0, len).map((pt, i) => ({
    date: pt.date,
    value: Math.round((all.reduce((sum, s) => sum + (s[i]?.value ?? 0), 0) / all.length) * 10) / 10,
  }));
}

function fmtDate(d: string, days: number) {
  const dt = new Date(d);
  if (days <= 7) return dt.toLocaleDateString("en-US", { weekday: "short" });
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtDateTick(days: number) {
  return (v: string) => fmtDate(v, days);
}

function thin(data: any[], days: number) {
  if (days <= 14) return data;
  const step = days <= 30 ? 2 : 3;
  return data.filter((_, i) => i % step === 0 || i === data.length - 1);
}

// ─── Project comparison bar chart ─────────────────────────────────────────────

function ComparisonChart({
  title, projects, data, metric, unit = "", color,
}: {
  title: string;
  projects: { id: string; name: string }[];
  data: Record<string, number>;
  metric: string;
  unit?: string;
  color: string;
}) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: textLight } = useColors();
  const TT = chartTT(surface, border, text);

  const bars = projects
    .map(p => ({ name: p.name.length > 14 ? p.name.slice(0, 12) + "…" : p.name, value: data[p.id] ?? 0 }))
    .sort((a, b) => b.value - a.value);

  return (
    <Card>
      <SH>{title}</SH>
      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bars} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
            {gridEl(border)}
            <XAxis type="number" tick={{ fontSize: 11, fill: textLight }} tickFormatter={(v: number) => `${v}${unit}`} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: textLight }} width={100} />
            <Tooltip {...TT} formatter={(v: any) => [`${v}${unit}`, metric]} />
            <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ExecutionTrendsPanel() {
  const [range, setRange]       = useState<DateRange>("30d");
  const [projects, setProjects] = useState<TimelineProject[]>([]);
  const [overviews, setOverviews] = useState<Record<string, TrendsOverview>>({});
  const [loading, setLoading]   = useState(true);

  const { CARD: surface, BDR: border, TXT: text, TXT2: textLight, BG: bg, P } = useColors();
  const TT = chartTT(surface, border, text);

  const days = DATE_RANGE_OPTIONS.find(o => o.value === range)?.days ?? 30;

  useEffect(() => {
    setLoading(true);
    setOverviews({});
    fetchTimelineProjects()
      .then(async (projs) => {
        setProjects(projs);
        const results = await Promise.allSettled(
          projs.slice(0, 10).map(p =>
            fetchTrendsOverview(p.id, days).then(d => ({ id: p.id, data: d }))
          )
        );
        const map: Record<string, TrendsOverview> = {};
        results.forEach(r => { if (r.status === "fulfilled") map[r.value.id] = r.value.data; });
        setOverviews(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days]);

  // ── Aggregated metrics ──────────────────────────────────────────────────────

  const loaded = Object.values(overviews);
  const n = Math.max(1, loaded.length);

  const avgKpi = (key: keyof TrendsOverview["kpis"]) =>
    Math.round((loaded.reduce((s, o) => s + o.kpis[key].value, 0) / n) * 10) / 10;
  const avgDelta = (key: keyof TrendsOverview["kpis"]) =>
    Math.round((loaded.reduce((s, o) => s + o.kpis[key].delta, 0) / n) * 10) / 10;

  const covMap:  Record<string, number> = {};
  const passMap: Record<string, number> = {};
  const riskMap: Record<string, number> = {};
  const testsMap: Record<string, number> = {};
  Object.entries(overviews).forEach(([id, o]) => {
    covMap[id]   = o.kpis.coverage.value;
    passMap[id]  = o.kpis.passRate.value;
    riskMap[id]  = o.kpis.riskScore.value;
    testsMap[id] = o.kpis.testsTotal.value;
  });

  const covSeries  = avgSeries(loaded.map(o => o.series.coverage));
  const passSeries = avgSeries(loaded.map(o => o.series.passRate));
  const riskSeries = avgSeries(loaded.map(o => o.series.riskScore));
  const flakySeries = avgSeries(loaded.map(o => o.series.flakyCount));

  const visibleProjects = projects.slice(0, 8);
  const multiCovData: Record<string, any>[] = (() => {
    if (!visibleProjects.length) return [];
    const firstSeries = overviews[visibleProjects[0]?.id]?.series?.coverage ?? [];
    return firstSeries.map((pt, i) => {
      const row: Record<string, any> = { date: pt.date };
      visibleProjects.forEach(p => {
        row[p.id] = overviews[p.id]?.series?.coverage?.[i]?.value ?? null;
      });
      return row;
    });
  })();

  const thinnedCov  = thin(covSeries.map((p, i) => ({ date: p.date, coverage: p.value, passRate: passSeries[i]?.value ?? 0, riskScore: riskSeries[i]?.value ?? 0 })), days);
  const thinnedFlaky = thin(flakySeries.map(p => ({ date: p.date, flakyCount: p.value })), days);
  const thinnedMulti = thin(multiCovData, days);

  const healthRows = visibleProjects.map(p => ({
    p,
    coverage: covMap[p.id] ?? 0,
    passRate: passMap[p.id] ?? 0,
    risk: riskMap[p.id] ?? 0,
    tests: testsMap[p.id] ?? 0,
  })).sort((a, b) => b.coverage - a.coverage);

  if (loading) return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: text, margin: "0 0 8px" }}>Org Trends</h1>
      <p style={{ color: textLight, fontSize: 13, marginBottom: 24 }}>Cross-project quality analytics</p>
      <Spinner />
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: text }}>Org Trends</h1>
          <p style={{ margin: "4px 0 0", color: textLight, fontSize: 13 }}>
            Cross-project quality analytics · {projects.length} project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: 4, background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: 4 }}>
          {DATE_RANGE_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setRange(opt.value)}
              style={{
                padding: "6px 14px", borderRadius: 6, border: "none",
                background: range === opt.value ? P : "transparent",
                color: range === opt.value ? "#fff" : textLight,
                cursor: "pointer", fontSize: 13, fontWeight: range === opt.value ? 700 : 400,
                transition: "background 0.15s",
              }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Org KPIs */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <KpiTile label="Avg Coverage"  value={avgKpi("coverage")}   unit="%" delta={avgDelta("coverage")}   color={C.purple} sub={`across ${n} projects`} />
        <KpiTile label="Avg Pass Rate" value={avgKpi("passRate")}   unit="%" delta={avgDelta("passRate")}   color={C.green}  sub={`across ${n} projects`} />
        <KpiTile label="Avg Risk Score" value={avgKpi("riskScore")} unit="%" delta={avgDelta("riskScore")}  color={C.red}    invert sub={`across ${n} projects`} />
        <KpiTile label="Total Tests"   value={loaded.reduce((s, o) => s + o.kpis.testsTotal.value, 0)} color={C.blue}  sub="org total" />
        <KpiTile label="AI Actions"    value={loaded.reduce((s, o) => s + o.kpis.aiActions.value, 0)}  color={C.cyan}  sub="this period" />
      </div>

      {/* Aggregate quality trends */}
      <Card style={{ marginBottom: 16 }}>
        <SH>Org-Wide Quality Trends (Averaged)</SH>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={thinnedCov} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              {gridEl(border)}
              <XAxis dataKey="date" tickFormatter={fmtDateTick(days)} tick={{ fontSize: 11, fill: textLight }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: textLight }} width={40} tickFormatter={(v: number) => `${v}%`} />
              <Tooltip {...TT} formatter={(v: any) => [`${v}%`]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line dataKey="coverage"  name="Avg Coverage %"   stroke={C.purple} strokeWidth={2.5} dot={false} />
              <Line dataKey="passRate"  name="Avg Pass Rate %"  stroke={C.green}  strokeWidth={2}   dot={false} />
              <Line dataKey="riskScore" name="Avg Risk Score %"  stroke={C.red}    strokeWidth={2}   dot={false} strokeDasharray="5 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Coverage per project (multi-line) */}
      {thinnedMulti.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <SH>Coverage per Project Over Time</SH>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={thinnedMulti} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                {gridEl(border)}
                <XAxis dataKey="date" tickFormatter={fmtDateTick(days)} tick={{ fontSize: 11, fill: textLight }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: textLight }} width={40} tickFormatter={(v: number) => `${v}%`} />
                <Tooltip {...TT} formatter={(v: any) => (v !== null ? [`${v}%`] : ["N/A"])} />
                <Legend wrapperStyle={{ fontSize: 11 }} formatter={(val: string) => {
                  const p = visibleProjects.find(x => x.id === val);
                  return p ? (p.name.length > 16 ? p.name.slice(0, 14) + "…" : p.name) : val;
                }} />
                {visibleProjects.map((p, i) => (
                  <Line key={p.id} dataKey={p.id} name={p.id} stroke={PROJECT_COLORS[i % PROJECT_COLORS.length]} strokeWidth={1.5} dot={false} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Org flaky trend */}
      <Card style={{ marginBottom: 16 }}>
        <SH>Avg Flaky Test Count (Org-Wide)</SH>
        <div style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={thinnedFlaky} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="flakyOrgGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.orange} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={C.orange} stopOpacity={0} />
                </linearGradient>
              </defs>
              {gridEl(border)}
              <XAxis dataKey="date" tickFormatter={fmtDateTick(days)} tick={{ fontSize: 11, fill: textLight }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: textLight }} width={36} />
              <Tooltip {...TT} />
              <Area dataKey="flakyCount" name="Avg Flaky Tests" stroke={C.orange} fill="url(#flakyOrgGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Project comparison charts */}
      {healthRows.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <ComparisonChart title="Coverage by Project" projects={healthRows.map(r => r.p)} data={covMap}  metric="Coverage"  unit="%" color={C.purple} />
          <ComparisonChart title="Pass Rate by Project" projects={healthRows.map(r => r.p)} data={passMap} metric="Pass Rate" unit="%" color={C.green} />
          <ComparisonChart title="Risk Score by Project" projects={healthRows.map(r => r.p)} data={riskMap}  metric="Risk"    unit="%" color={C.red} />
          <ComparisonChart title="Test Count by Project" projects={healthRows.map(r => r.p)} data={testsMap} metric="Tests"            color={C.blue} />
        </div>
      )}

      {/* Project health table */}
      {healthRows.length > 0 && (
        <Card>
          <SH>Project Health Matrix</SH>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${border}` }}>
                {["Project", "Type", "Coverage", "Pass Rate", "Risk", "Tests"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "6px 12px", fontSize: 11, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {healthRows.map(({ p, coverage, passRate, risk, tests }) => (
                <tr key={p.id} style={{ borderBottom: `1px solid ${border}` }}>
                  <td style={{ padding: "10px 12px", fontWeight: 600, color: text }}>{p.name}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 4, fontWeight: 700, background: `${p.type === "ui" ? C.purple : p.type === "api" ? C.blue : C.orange}18`, color: p.type === "ui" ? C.purple : p.type === "api" ? C.blue : C.orange }}>
                      {p.type.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: `${C.purple}20`, borderRadius: 3 }}>
                        <div style={{ width: `${coverage}%`, height: "100%", background: C.purple, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontWeight: 600, color: C.purple, minWidth: 34 }}>{coverage}%</span>
                    </div>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ fontWeight: 600, color: passRate >= 80 ? C.green : passRate >= 60 ? C.orange : C.red }}>{passRate}%</span>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ fontWeight: 600, color: risk <= 30 ? C.green : risk <= 60 ? C.orange : C.red }}>{risk}%</span>
                  </td>
                  <td style={{ padding: "10px 12px", color: textLight }}>{tests}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
