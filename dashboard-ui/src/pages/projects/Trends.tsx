import { useState, useEffect } from "react";
import { useColors } from "@/hooks/useColors";
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import {
  fetchTrendsOverview, fetchTrendsCoverage, fetchTrendsRisk,
  fetchTrendsStability, fetchTrendsTests, fetchTrendsAI, fetchTrendsFlows,
  DATE_RANGE_OPTIONS,
  type TrendPoint, type TrendsOverview, type TrendsCoverage,
  type TrendsRisk, type TrendsStability, type TrendsTests,
  type TrendsAI, type TrendsFlows, type DateRange,
} from "@/api/trends";

// ─── Fixed palette (not theme-dependent) ──────────────────────────────────────

const C = {
  purple: "#7B2FF7",
  cyan:   "#2FF7D1",
  blue:   "#448AFF",
  green:  "#66BB6A",
  orange: "#FFA726",
  red:    "#EF5350",
  pink:   "#E91E63",
  indigo: "#5C6BC0",
};

// ─── Data helpers ─────────────────────────────────────────────────────────────

function merge(named: Record<string, TrendPoint[]>): Record<string, any>[] {
  const keys = Object.keys(named);
  if (!keys.length) return [];
  const base = named[keys[0]];
  return base.map((pt, i) => {
    const row: Record<string, any> = { date: pt.date };
    keys.forEach(k => { row[k] = named[k]?.[i]?.value ?? 0; });
    return row;
  });
}

function fmtDate(date: string, days: number): string {
  const d = new Date(date);
  if (days <= 7)  return d.toLocaleDateString("en-US", { weekday: "short" });
  if (days <= 30) return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function thinned(data: Record<string, any>[], days: number): Record<string, any>[] {
  if (days <= 14) return data;
  const step = days <= 30 ? 2 : 3;
  return data.filter((_, i) => i % step === 0 || i === data.length - 1);
}

// ─── Chart helpers (accept colors as params — not hooks) ──────────────────────

function chartTT(surface: string, border: string, text: string) {
  return {
    contentStyle: { background: surface, border: `1px solid ${border}`, borderRadius: 8, fontSize: 12 },
    labelStyle: { fontWeight: 600, color: text },
  };
}

function xAxisEl(days: number, tickColor: string) {
  return (
    <XAxis
      dataKey="date"
      tickFormatter={(v: string) => fmtDate(v, days)}
      tick={{ fontSize: 11, fill: tickColor }}
      interval="preserveStartEnd"
    />
  );
}

function yAxisEl(unit = "", tickColor: string) {
  return <YAxis tick={{ fontSize: 11, fill: tickColor }} width={unit ? 42 : 36} tickFormatter={(v: number) => `${v}${unit}`} />;
}

function gridEl(strokeColor: string) {
  return <CartesianGrid strokeDasharray="3 3" stroke={strokeColor} />;
}

// ─── Shared UI primitives (each calls useColors internally) ───────────────────

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
  return (
    <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: TXT2, fontSize: 13 }}>
      Loading…
    </div>
  );
}

// ─── KPI tile ─────────────────────────────────────────────────────────────────

function KpiTile({ label, value, unit = "", delta, invert = false, color }:
  { label: string; value: number; unit?: string; delta?: number; invert?: boolean; color?: string }) {
  const { TXT2, P } = useColors();
  const c = color ?? P;
  const good = invert ? (delta ?? 0) <= 0 : (delta ?? 0) >= 0;
  return (
    <Card style={{ flex: 1, minWidth: 130, padding: "16px 18px" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: TXT2, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: c, lineHeight: 1 }}>
        {typeof value === "number" ? Math.round(value * 10) / 10 : value}
        <span style={{ fontSize: 13, fontWeight: 400, color: TXT2, marginLeft: 2 }}>{unit}</span>
      </div>
      {delta !== undefined && (
        <div style={{ fontSize: 11, marginTop: 6, color: good ? C.green : C.red, fontWeight: 600 }}>
          {delta >= 0 ? "▲" : "▼"} {Math.abs(Math.round(delta * 10) / 10)}{unit} vs 7d ago
        </div>
      )}
    </Card>
  );
}

// ─── Chart wrapper ────────────────────────────────────────────────────────────

function ChartCard({ title, height = 220, children }: { title: string; height?: number; children: React.ReactNode }) {
  return (
    <Card style={{ marginTop: 16 }}>
      <SH>{title}</SH>
      <div style={{ height }}>{children}</div>
    </Card>
  );
}

// ─── Gradient defs ────────────────────────────────────────────────────────────

function Defs({ id, color }: { id: string; color: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%"  stopColor={color} stopOpacity={0.28} />
        <stop offset="95%" stopColor={color} stopOpacity={0} />
      </linearGradient>
    </defs>
  );
}

// ─── Section: Overview ────────────────────────────────────────────────────────

function OverviewSection({ projectId, days }: { projectId: string; days: number }) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: textLight } = useColors();
  const [data, setData] = useState<TrendsOverview | null>(null);
  useEffect(() => { setData(null); fetchTrendsOverview(projectId, days).then(setData).catch(() => {}); }, [projectId, days]);
  if (!data) return <Spinner />;

  const { kpis, series } = data;
  const TT = chartTT(surface, border, text);

  const qualityData = thinned(merge({ coverage: series.coverage, passRate: series.passRate, riskScore: series.riskScore }), days);
  const flakyData   = thinned(merge({ flakyCount: series.flakyCount }), days);

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 4 }}>
        <KpiTile label="Coverage"    value={kpis.coverage.value}   unit="%" delta={kpis.coverage.delta}   color={C.purple} />
        <KpiTile label="Pass Rate"   value={kpis.passRate.value}   unit="%" delta={kpis.passRate.delta}   color={C.green} />
        <KpiTile label="Risk Score"  value={kpis.riskScore.value}  unit="%" delta={kpis.riskScore.delta}  color={C.red}   invert />
        <KpiTile label="Total Tests" value={kpis.testsTotal.value}           delta={kpis.testsTotal.delta} color={C.blue} />
        <KpiTile label="AI Actions"  value={kpis.aiActions.value}                                          color={C.cyan} />
      </div>

      <ChartCard title="Quality Indicators Over Time" height={260}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={qualityData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            {gridEl(border)}
            {xAxisEl(days, textLight)}
            {yAxisEl("%", textLight)}
            <Tooltip {...TT} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line dataKey="coverage"  name="Coverage %"   stroke={C.purple} strokeWidth={2} dot={false} />
            <Line dataKey="passRate"  name="Pass Rate %"  stroke={C.green}  strokeWidth={2} dot={false} />
            <Line dataKey="riskScore" name="Risk Score %"  stroke={C.red}    strokeWidth={2} dot={false} strokeDasharray="5 3" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Flaky Test Count" height={180}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={flakyData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <Defs id="flakyGrad" color={C.orange} />
            {gridEl(border)}
            {xAxisEl(days, textLight)}
            {yAxisEl("", textLight)}
            <Tooltip {...TT} />
            <Area dataKey="flakyCount" name="Flaky Tests" stroke={C.orange} fill="url(#flakyGrad)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

// ─── Section: Coverage ────────────────────────────────────────────────────────

function CoverageSection({ projectId, days }: { projectId: string; days: number }) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: textLight } = useColors();
  const [data, setData] = useState<TrendsCoverage | null>(null);
  useEffect(() => { setData(null); fetchTrendsCoverage(projectId, days).then(setData).catch(() => {}); }, [projectId, days]);
  if (!data) return <Spinner />;

  const { current, series } = data;
  const TT = chartTT(surface, border, text);

  const multiData = thinned(merge({ requirements: series.requirements, ui: series.ui, api: series.api, flows: series.flows, endpoints: series.endpoints }), days);
  const reqData   = thinned(merge({ requirements: series.requirements }), days);

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 4 }}>
        <KpiTile label="Requirements" value={current.requirements} unit="%" color={C.purple} />
        <KpiTile label="UI Pages"     value={current.ui}           unit="%" color={C.blue} />
        <KpiTile label="API"          value={current.api}          unit="%" color={C.cyan} />
        <KpiTile label="Flows"        value={current.flows}        unit="%" color={C.green} />
        <KpiTile label="Endpoints"    value={current.endpoints}    unit="%" color={C.indigo} />
      </div>

      <ChartCard title="Coverage by Area" height={280}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={multiData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            {gridEl(border)}
            {xAxisEl(days, textLight)}
            {yAxisEl("%", textLight)}
            <Tooltip {...TT} formatter={(v: any) => [`${v}%`]} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line dataKey="requirements" name="Requirements" stroke={C.purple} strokeWidth={2} dot={false} />
            <Line dataKey="ui"           name="UI Pages"     stroke={C.blue}   strokeWidth={2} dot={false} />
            <Line dataKey="api"          name="API"          stroke={C.cyan}   strokeWidth={2} dot={false} />
            <Line dataKey="flows"        name="Flows"        stroke={C.green}  strokeWidth={2} dot={false} />
            <Line dataKey="endpoints"    name="Endpoints"    stroke={C.indigo} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Requirements Coverage (Area)" height={200}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={reqData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <Defs id="covGrad" color={C.purple} />
            {gridEl(border)}
            {xAxisEl(days, textLight)}
            {yAxisEl("%", textLight)}
            <Tooltip {...TT} formatter={(v: any) => [`${v}%`, "Coverage"]} />
            <Area dataKey="requirements" name="Requirements Coverage" stroke={C.purple} fill="url(#covGrad)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

// ─── Section: Risk ────────────────────────────────────────────────────────────

function RiskSection({ projectId, days }: { projectId: string; days: number }) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: textLight } = useColors();
  const [data, setData] = useState<TrendsRisk | null>(null);
  useEffect(() => { setData(null); fetchTrendsRisk(projectId, days).then(setData).catch(() => {}); }, [projectId, days]);
  if (!data) return <Spinner />;

  const { current, series } = data;
  const TT = chartTT(surface, border, text);

  const scoreData    = thinned(merge({ score: series.score }), days);
  const uncoverData  = thinned(merge({ highUncovered: series.highUncovered, criticalUncovered: series.criticalUncovered }), days);

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 4 }}>
        <KpiTile label="Risk Score"           value={current.score}            unit="%" color={C.red}    invert />
        <KpiTile label="High-Pri Uncovered"   value={current.highUncovered}              color={C.orange} invert />
        <KpiTile label="Critical Uncovered"   value={current.criticalUncovered}          color={C.red}    invert />
      </div>

      <ChartCard title="Risk Score Over Time" height={240}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={scoreData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <Defs id="riskGrad" color={C.red} />
            {gridEl(border)}
            {xAxisEl(days, textLight)}
            {yAxisEl("%", textLight)}
            <Tooltip {...TT} formatter={(v: any) => [`${v}%`, "Risk Score"]} />
            <Area dataKey="score" name="Risk Score" stroke={C.red} fill="url(#riskGrad)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Uncovered High-Priority Requirements" height={200}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={uncoverData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            {gridEl(border)}
            {xAxisEl(days, textLight)}
            {yAxisEl("", textLight)}
            <Tooltip {...TT} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line dataKey="highUncovered"     name="High Priority" stroke={C.orange} strokeWidth={2} dot={false} />
            <Line dataKey="criticalUncovered" name="Critical"      stroke={C.red}    strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

// ─── Section: Stability ───────────────────────────────────────────────────────

function StabilitySection({ projectId, days }: { projectId: string; days: number }) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: textLight } = useColors();
  const [data, setData] = useState<TrendsStability | null>(null);
  useEffect(() => { setData(null); fetchTrendsStability(projectId, days).then(setData).catch(() => {}); }, [projectId, days]);
  if (!data) return <Spinner />;

  const { current, series } = data;
  const TT = chartTT(surface, border, text);

  const rateData  = thinned(merge({ passRate: series.passRate, failureRate: series.failureRate }), days);
  const flakyData = thinned(merge({ flakyCount: series.flakyCount }), days);
  const frateData = thinned(merge({ flakyRate: series.flakyRate }), days);

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 4 }}>
        <KpiTile label="Pass Rate"     value={current.passRate}    unit="%" color={C.green} />
        <KpiTile label="Failure Rate"  value={current.failureRate} unit="%" color={C.red}    invert />
        <KpiTile label="Flaky Tests"   value={current.flakyCount}            color={C.orange} invert />
        <KpiTile label="Flakiness Rate" value={current.flakyRate} unit="%" color={C.orange} invert />
      </div>

      <ChartCard title="Pass Rate vs Failure Rate" height={260}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rateData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            {gridEl(border)}
            {xAxisEl(days, textLight)}
            {yAxisEl("%", textLight)}
            <Tooltip {...TT} formatter={(v: any) => [`${v}%`]} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line dataKey="passRate"    name="Pass Rate %"    stroke={C.green} strokeWidth={2.5} dot={false} />
            <Line dataKey="failureRate" name="Failure Rate %" stroke={C.red}   strokeWidth={2}   dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <Card>
          <SH>Flaky Test Count</SH>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={flakyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <Defs id="flakyGrad2" color={C.orange} />
                {gridEl(border)}
                {xAxisEl(days, textLight)}
                {yAxisEl("", textLight)}
                <Tooltip {...TT} />
                <Area dataKey="flakyCount" name="Flaky Tests" stroke={C.orange} fill="url(#flakyGrad2)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <SH>Flakiness Rate</SH>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={frateData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <Defs id="frateGrad" color={C.pink} />
                {gridEl(border)}
                {xAxisEl(days, textLight)}
                {yAxisEl("%", textLight)}
                <Tooltip {...TT} formatter={(v: any) => [`${v}%`, "Flakiness"]} />
                <Area dataKey="flakyRate" name="Flakiness Rate" stroke={C.pink} fill="url(#frateGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Section: Tests ───────────────────────────────────────────────────────────

function TestsSection({ projectId, days }: { projectId: string; days: number }) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: textLight } = useColors();
  const [data, setData] = useState<TrendsTests | null>(null);
  useEffect(() => { setData(null); fetchTrendsTests(projectId, days).then(setData).catch(() => {}); }, [projectId, days]);
  if (!data) return <Spinner />;

  const { current, series } = data;
  const TT = chartTT(surface, border, text);

  const totalData    = thinned(merge({ total: series.total }), days);
  const activityData = thinned(merge({ added: series.added, healed: series.healed, regenerated: series.regenerated }), days);

  const sumSeries = (s: TrendPoint[]) => Math.round(s.reduce((a, p) => a + p.value, 0));

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 4 }}>
        <KpiTile label="Total Tests"      value={current.total}              color={C.blue} />
        <KpiTile label="Added (Period)"   value={sumSeries(series.added)}    color={C.green} />
        <KpiTile label="Healed (Period)"  value={sumSeries(series.healed)}   color={C.cyan} />
        <KpiTile label="Regenerated"      value={sumSeries(series.regenerated)} color={C.purple} />
      </div>

      <ChartCard title="Total Test Suite Size" height={220}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={totalData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <Defs id="testsGrad" color={C.blue} />
            {gridEl(border)}
            {xAxisEl(days, textLight)}
            {yAxisEl("", textLight)}
            <Tooltip {...TT} />
            <Area dataKey="total" name="Total Tests" stroke={C.blue} fill="url(#testsGrad)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Tests Added / Healed / Regenerated Per Day" height={220}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={activityData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            {gridEl(border)}
            {xAxisEl(days, textLight)}
            {yAxisEl("", textLight)}
            <Tooltip {...TT} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="added"       name="Added"       fill={C.green}  radius={[2, 2, 0, 0]} maxBarSize={14} />
            <Bar dataKey="healed"      name="Healed"      fill={C.cyan}   radius={[2, 2, 0, 0]} maxBarSize={14} />
            <Bar dataKey="regenerated" name="Regenerated" fill={C.purple} radius={[2, 2, 0, 0]} maxBarSize={14} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

// ─── Section: AI Impact ───────────────────────────────────────────────────────

function AISection({ projectId, days }: { projectId: string; days: number }) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: textLight, P } = useColors();
  const [data, setData] = useState<TrendsAI | null>(null);
  useEffect(() => { setData(null); fetchTrendsAI(projectId, days).then(setData).catch(() => {}); }, [projectId, days]);
  if (!data) return <Spinner />;

  const { current, periodTotals, series } = data;
  const TT = chartTT(surface, border, text);

  const sugData   = thinned(merge({ sugCreated: series.sugCreated, sugApplied: series.sugApplied }), days);
  const healData  = thinned(merge({ healCreated: series.healCreated, healApplied: series.healApplied }), days);
  const deltaData = thinned(merge({ coverageDelta: series.coverageDelta }), days);

  const insight = current.applyRate >= 60
    ? `High adoption — ${current.applyRate}% of suggestions applied. Auto-Heal is actively reducing flakiness.`
    : current.applyRate >= 30
    ? `Moderate adoption — ${current.applyRate}% applied. Enable low-risk auto-apply in AI settings to increase throughput.`
    : `Low adoption — ${current.applyRate}% applied. Review the pending suggestions queue to unlock coverage gains.`;

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <KpiTile label="Suggestion Apply Rate" value={current.applyRate}          unit="%" color={C.purple} />
        <KpiTile label="Heal Apply Rate"       value={current.healRate}            unit="%" color={C.cyan} />
        <KpiTile label="Suggestions (Period)"  value={periodTotals.sugCreated}              color={C.blue} />
        <KpiTile label="Heals (Period)"        value={periodTotals.healCreated}              color={C.green} />
      </div>

      <div style={{
        padding: "12px 16px", borderRadius: 10, marginBottom: 4,
        background: `${C.purple}10`, border: `1px solid ${C.purple}30`,
        fontSize: 13, color: text, lineHeight: 1.6,
      }}>
        <span style={{ fontWeight: 700, color: P }}>AI Impact · </span>{insight}
      </div>

      <ChartCard title="Suggestions — Created vs Applied" height={220}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sugData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            {gridEl(border)}
            {xAxisEl(days, textLight)}
            {yAxisEl("", textLight)}
            <Tooltip {...TT} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="sugCreated" name="Created" fill={`${C.purple}70`} radius={[2, 2, 0, 0]} maxBarSize={14} />
            <Bar dataKey="sugApplied" name="Applied" fill={C.purple}        radius={[2, 2, 0, 0]} maxBarSize={14} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Auto-Heal — Triggered vs Applied" height={220}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={healData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            {gridEl(border)}
            {xAxisEl(days, textLight)}
            {yAxisEl("", textLight)}
            <Tooltip {...TT} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="healCreated" name="Triggered" fill={`${C.cyan}70`} radius={[2, 2, 0, 0]} maxBarSize={14} />
            <Bar dataKey="healApplied" name="Applied"   fill={C.cyan}        radius={[2, 2, 0, 0]} maxBarSize={14} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Coverage Delta Driven by AI Actions" height={180}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={deltaData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <Defs id="aiCovGrad" color={C.cyan} />
            {gridEl(border)}
            {xAxisEl(days, textLight)}
            {yAxisEl("pp", textLight)}
            <Tooltip {...TT} formatter={(v: any) => [`+${v}pp`, "Coverage gain"]} />
            <Area dataKey="coverageDelta" name="Coverage delta" stroke={C.cyan} fill="url(#aiCovGrad)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

// ─── Section: Flows & Endpoints ───────────────────────────────────────────────

function FlowsSection({ projectId, days }: { projectId: string; days: number }) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: textLight } = useColors();
  const [data, setData] = useState<TrendsFlows | null>(null);
  useEffect(() => { setData(null); fetchTrendsFlows(projectId, days).then(setData).catch(() => {}); }, [projectId, days]);
  if (!data) return <Spinner />;

  const { current, series } = data;
  const TT = chartTT(surface, border, text);

  const healthData  = thinned(merge({ health: series.health }), days);
  const failureData = thinned(merge({ flowFailures: series.flowFailures, endpointFailures: series.endpointFailures }), days);

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 4 }}>
        <KpiTile label="Health Score"            value={Math.round(current.healthScore)}    unit="%" color={C.green} />
        <KpiTile label="Total Flows"             value={current.flowsTotal}                           color={C.blue} />
        <KpiTile label="Flows with Failures"     value={current.flowsWithFailures}                    color={C.red}    invert />
        <KpiTile label="Endpoints with Failures" value={current.endpointsWithFailures}               color={C.orange} invert />
      </div>

      <ChartCard title="Flow & Endpoint Health Score" height={240}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={healthData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <Defs id="healthGrad" color={C.green} />
            {gridEl(border)}
            {xAxisEl(days, textLight)}
            {yAxisEl("%", textLight)}
            <Tooltip {...TT} formatter={(v: any) => [`${v}%`, "Health Score"]} />
            <Area dataKey="health" name="Health Score" stroke={C.green} fill="url(#healthGrad)" strokeWidth={2.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Failing Flows & Endpoints Over Time" height={200}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={failureData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            {gridEl(border)}
            {xAxisEl(days, textLight)}
            {yAxisEl("", textLight)}
            <Tooltip {...TT} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line dataKey="flowFailures"     name="Flows with failures"     stroke={C.red}    strokeWidth={2} dot={false} />
            <Line dataKey="endpointFailures" name="Endpoints with failures" stroke={C.orange} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

// ─── Tab nav ──────────────────────────────────────────────────────────────────

type TrendTab = "overview" | "coverage" | "risk" | "stability" | "tests" | "ai" | "flows";

const TABS: { id: TrendTab; label: string; icon: string }[] = [
  { id: "overview",  label: "Overview",          icon: "📊" },
  { id: "coverage",  label: "Coverage",           icon: "📈" },
  { id: "risk",      label: "Risk",               icon: "🔥" },
  { id: "stability", label: "Stability",          icon: "🛡️" },
  { id: "tests",     label: "Test Suite",         icon: "🧪" },
  { id: "ai",        label: "AI Impact",          icon: "🤖" },
  { id: "flows",     label: "Flows & Endpoints",  icon: "🌐" },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function Trends({ projectId }: { projectId: string }) {
  const { BDR: border, TXT: text, TXT2: textLight, P, BG: bg, CARD: surface } = useColors();
  const [tab, setTab]     = useState<TrendTab>("overview");
  const [range, setRange] = useState<DateRange>("30d");

  const days = DATE_RANGE_OPTIONS.find(o => o.value === range)?.days ?? 30;

  function renderTab() {
    const p = { projectId, days };
    switch (tab) {
      case "overview":  return <OverviewSection  {...p} />;
      case "coverage":  return <CoverageSection  {...p} />;
      case "risk":      return <RiskSection      {...p} />;
      case "stability": return <StabilitySection {...p} />;
      case "tests":     return <TestsSection     {...p} />;
      case "ai":        return <AISection        {...p} />;
      case "flows":     return <FlowsSection     {...p} />;
      default:          return null;
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: text }}>Trends</h2>
          <div style={{ fontSize: 13, color: textLight, marginTop: 2 }}>Time-series analytics — quality, stability & AI impact over time</div>
        </div>
        {/* Date range */}
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

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 2, borderBottom: `2px solid ${border}`, marginBottom: 24, overflowX: "auto" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "10px 16px",
              border: "none", background: "transparent",
              color: tab === t.id ? P : textLight,
              fontWeight: tab === t.id ? 700 : 500, fontSize: 13, cursor: "pointer",
              borderBottom: `2px solid ${tab === t.id ? P : "transparent"}`,
              marginBottom: -2, whiteSpace: "nowrap", transition: "color 0.15s",
            }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {renderTab()}
    </div>
  );
}
