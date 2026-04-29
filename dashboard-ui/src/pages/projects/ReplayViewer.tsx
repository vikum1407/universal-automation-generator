import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { useColors } from "@/hooks/useColors";
import type {
  TestRun, TestRunResult, ReplaySummary, RunComparison, RunStatus, ResultStatus,
} from "@/api/replay";
import {
  fetchRuns, fetchRun, fetchReplaySummary, fetchCompare,
  runAll, runSingle,
  RUN_STATUS_COLOR, RESULT_STATUS_COLOR, TRIGGER_COLOR, TRIGGER_ICON, fmtDuration,
} from "@/api/replay";

// ── Shared helpers ────────────────────────────────────────────────────────────

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
      background: `${color}22`, color,
    }}>{label}</span>
  );
}

function StatusDot({ status, size = 8 }: { status: RunStatus | ResultStatus | string; size?: number }) {
  const color = (RUN_STATUS_COLOR as any)[status] ?? (RESULT_STATUS_COLOR as any)[status] ?? "#90A4AE";
  return (
    <span style={{
      display: "inline-block", width: size, height: size, borderRadius: "50%",
      background: color, flexShrink: 0, boxShadow: `0 0 5px ${color}66`,
    }} />
  );
}

function formatTestName(name: string): string {
  if (!name) return name;
  if (name.includes(" ") && !name.endsWith(".spec.ts")) return name;
  return name.replace(/\.spec\.ts$/, "").replace(/[-_]+/g, " ").replace(/\b\w/g, c => c.toUpperCase()).trim();
}

// ── Summary tiles ─────────────────────────────────────────────────────────────

function SummaryBar({
  summary, running, onRunAll,
}: { summary: ReplaySummary; running: boolean; onRunAll: () => void }) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: textLight, P: primary } = useColors();

  const lastStatusColor = summary.lastRunStatus ? RUN_STATUS_COLOR[summary.lastRunStatus] : "#90A4AE";

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Run bar */}
      <div style={{
        padding: "10px 16px", borderRadius: 12, marginBottom: 12,
        background: surface, border: `1px solid ${border}`,
        display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
      }}>
        <button onClick={onRunAll} disabled={running} style={{
          padding: "8px 20px", borderRadius: 9, border: "none",
          background: running ? "#9e7de0" : primary,
          color: "#fff", fontWeight: 700, fontSize: 13,
          cursor: running ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <span>{running ? "⏳" : "▶"}</span>
          {running ? "Running suite…" : "Run Full Suite"}
        </button>
        {summary.lastRunAt && (
          <span style={{ fontSize: 12, color: textLight }}>
            Last run: {new Date(summary.lastRunAt).toLocaleString()}
          </span>
        )}
        {running && (
          <span style={{ fontSize: 12, color: primary, fontWeight: 500 }}>
            Executing all tests — this may take a minute…
          </span>
        )}
      </div>

      {/* Tiles */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {[
          {
            icon: "📋", label: "Total Runs", value: summary.totalRuns,
            sub: `${summary.last24hRuns} in last 24h`, color: primary,
          },
          {
            icon: summary.lastRunStatus === "passed" ? "✅" : summary.lastRunStatus === "failed" ? "❌" : "🔄",
            label: "Last Run",
            value: summary.lastRunStatus ? summary.lastRunStatus.toUpperCase() : "—",
            color: lastStatusColor,
          },
          {
            icon: "📈", label: "Pass Rate", value: `${summary.passRate}%`,
            color: summary.passRate >= 80 ? "#66BB6A" : summary.passRate >= 50 ? "#FFA726" : "#EF5350",
            sub: "All-time",
          },
          {
            icon: "⏱️", label: "Avg Duration",
            value: summary.avgDurationMs ? fmtDuration(summary.avgDurationMs) : "—",
            color: "#42A5F5", sub: "Per run",
          },
          {
            icon: "⚡", label: "Flaky Tests",
            value: summary.flakyTests,
            color: summary.flakyTests > 0 ? "#FFA726" : "#66BB6A",
            sub: "Detected",
          },
        ].map(({ icon, label, value, sub, color }) => (
          <div key={label} style={{
            flex: "1 1 120px", minWidth: 0, padding: "14px 16px", borderRadius: 14,
            background: surface, border: `1px solid ${border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}>
            <div style={{ fontSize: 20, marginBottom: 5 }}>{icon}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: text, marginTop: 4 }}>{label}</div>
            {sub && <div style={{ fontSize: 10, color: textLight, marginTop: 2 }}>{sub}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Runs list table ───────────────────────────────────────────────────────────

function RunsTable({
  runs, selectedId, compareIds, onSelect, onToggleCompare,
}: {
  runs: TestRun[];
  selectedId: string | null;
  compareIds: [string | null, string | null];
  onSelect: (r: TestRun) => void;
  onToggleCompare: (id: string) => void;
}) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: textLight, P: primary, dark: isDark } = useColors();

  if (!runs.length) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: textLight, fontSize: 13 }}>
        No runs yet — click "Run Full Suite" to create the first run.
      </div>
    );
  }

  return (
    <div style={{ borderRadius: 14, border: `1px solid ${border}`, background: surface, overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${border}` }}>
            {["", "Run", "Trigger", "Status", "Tests", "Duration", "Environment", "Started", "Actions"].map(h => (
              <th key={h} style={{
                padding: "10px 14px", textAlign: "left",
                fontSize: 10, fontWeight: 700, color: textLight,
                textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap",
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {runs.map(run => {
            const selected = run.id === selectedId;
            const inCompare = compareIds.includes(run.id);
            const statusColor = RUN_STATUS_COLOR[run.status];
            const trigColor = TRIGGER_COLOR[run.triggeredBy];

            return (
              <tr
                key={run.id}
                onClick={() => onSelect(run)}
                style={{
                  cursor: "pointer",
                  background: selected ? (isDark ? "#1e1230" : "#f0eaff") : "transparent",
                  borderLeft: `3px solid ${selected ? primary : inCompare ? "#FFA726" : "transparent"}`,
                  transition: "background 0.1s",
                }}
                onMouseEnter={e => {
                  if (!selected) (e.currentTarget as HTMLTableRowElement).style.background =
                    isDark ? "#1a1a2e" : "#fafafa";
                }}
                onMouseLeave={e => {
                  if (!selected) (e.currentTarget as HTMLTableRowElement).style.background = "transparent";
                }}
              >
                {/* Compare checkbox */}
                <td style={{ padding: "11px 8px 11px 14px" }} onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={inCompare}
                    onChange={() => onToggleCompare(run.id)}
                    style={{ cursor: "pointer", accentColor: "#FFA726" }}
                    title="Select for comparison"
                  />
                </td>
                {/* Label */}
                <td style={{ padding: "11px 14px", maxWidth: 180 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {run.label}
                  </div>
                  <div style={{ fontSize: 10, color: textLight, fontFamily: "monospace", marginTop: 1 }}>
                    {run.id.slice(0, 20)}…
                  </div>
                </td>
                {/* Trigger */}
                <td style={{ padding: "11px 14px" }}>
                  <span style={{ fontSize: 13 }}>{TRIGGER_ICON[run.triggeredBy]}</span>
                  <span style={{ fontSize: 11, color: trigColor, marginLeft: 4, fontWeight: 600 }}>
                    {run.triggeredBy}
                  </span>
                </td>
                {/* Status */}
                <td style={{ padding: "11px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <StatusDot status={run.status} />
                    <Badge label={run.status.toUpperCase()} color={statusColor} />
                  </div>
                </td>
                {/* Tests summary */}
                <td style={{ padding: "11px 14px" }}>
                  <div style={{ fontSize: 11, color: text }}>
                    <span style={{ color: "#66BB6A", fontWeight: 700 }}>{run.summary.passed}</span>
                    <span style={{ color: textLight }}>/</span>
                    <span style={{ color: run.summary.failed > 0 ? "#EF5350" : textLight, fontWeight: 700 }}>{run.summary.failed}</span>
                    <span style={{ color: textLight }}>/{run.summary.total}</span>
                  </div>
                  <div style={{ fontSize: 9, color: textLight }}>pass/fail/total</div>
                </td>
                {/* Duration */}
                <td style={{ padding: "11px 14px", whiteSpace: "nowrap" }}>
                  <span style={{ fontSize: 11, color: textLight }}>{fmtDuration(run.durationMs)}</span>
                </td>
                {/* Environment */}
                <td style={{ padding: "11px 14px" }}>
                  <span style={{ fontSize: 11, color: textLight }}>{run.environment}</span>
                </td>
                {/* Started */}
                <td style={{ padding: "11px 14px", whiteSpace: "nowrap" }}>
                  <span style={{ fontSize: 11, color: textLight }}>{new Date(run.startedAt).toLocaleString()}</span>
                </td>
                {/* Actions */}
                <td style={{ padding: "11px 14px" }} onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => onSelect(run)}
                    style={{
                      padding: "4px 10px", borderRadius: 6,
                      border: `1px solid ${border}`, background: "transparent",
                      color: text, fontSize: 10, cursor: "pointer",
                    }}
                  >
                    View →
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Run detail panel ──────────────────────────────────────────────────────────

function RunDetailPanel({
  run, loadingId, onClose, onRunSingle,
}: {
  run: TestRun | null;
  loadingId: string | null;
  onClose: () => void;
  onRunSingle: (testId: string) => void;
}) {
  const [selectedResult, setSelectedResult] = useState<TestRunResult | null>(null);
  const [showStdout, setShowStdout] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ResultStatus | "all">("all");

  useEffect(() => { setSelectedResult(null); setStatusFilter("all"); }, [run?.id]);

  if (!run) return null;

  const { CARD: surface, BDR: border, TXT: text, TXT2: textLight, BG: bg, P: primary, dark: isDark } = useColors();
  const codeBg = isDark ? "#0d0d1a" : "#1a1a2e";

  const results = run.results ?? [];
  const filtered = results.filter(r => statusFilter === "all" || r.status === statusFilter);

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.18)" }} />

      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: selectedResult ? 880 : 520, zIndex: 50,
        background: surface, borderLeft: `1px solid ${border}`,
        display: "flex", flexDirection: "column",
        boxShadow: "-4px 0 28px rgba(0,0,0,0.14)",
        transition: "width 0.2s",
      }}>
        {/* Header */}
        <div style={{ padding: "16px 20px 12px", borderBottom: `1px solid ${border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}>
              <Badge label={run.status.toUpperCase()} color={RUN_STATUS_COLOR[run.status]} />
              <span style={{ fontSize: 13, color: TRIGGER_COLOR[run.triggeredBy], fontWeight: 600 }}>
                {TRIGGER_ICON[run.triggeredBy]} {run.triggeredBy}
              </span>
              <span style={{ fontSize: 11, color: textLight }}>{run.environment}</span>
            </div>
            <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 17, color: textLight, padding: "2px 6px" }}>✕</button>
          </div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: primary }}>{run.label}</h3>
          <div style={{ fontSize: 11, color: textLight, marginTop: 3 }}>
            {new Date(run.startedAt).toLocaleString()} · {fmtDuration(run.durationMs)}
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Left: results list */}
          <div style={{
            width: selectedResult ? 320 : "100%", flexShrink: 0,
            borderRight: selectedResult ? `1px solid ${border}` : "none",
            display: "flex", flexDirection: "column", overflow: "hidden",
          }}>
            {/* Summary row */}
            <div style={{ padding: "10px 16px", borderBottom: `1px solid ${border}`, display: "flex", gap: 16, flexShrink: 0 }}>
              {[
                { label: "Passed", v: run.summary.passed, color: "#66BB6A" },
                { label: "Failed", v: run.summary.failed, color: "#EF5350" },
                { label: "Total", v: run.summary.total, color: primary },
                { label: "Duration", v: fmtDuration(run.durationMs), color: textLight },
              ].map(({ label, v, color }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color }}>{v}</div>
                  <div style={{ fontSize: 9, color: textLight, textTransform: "uppercase" }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Filter */}
            <div style={{ padding: "8px 16px", borderBottom: `1px solid ${border}`, flexShrink: 0 }}>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                style={{
                  padding: "5px 10px", borderRadius: 6, border: `1px solid ${border}`,
                  background: isDark ? surface : "#fff", color: text, fontSize: 12, width: "100%",
                }}
              >
                <option value="all">All Results ({results.length})</option>
                <option value="failed">Failed ({results.filter(r => r.status === "failed").length})</option>
                <option value="passed">Passed ({results.filter(r => r.status === "passed").length})</option>
                <option value="skipped">Skipped ({results.filter(r => r.status === "skipped").length})</option>
              </select>
            </div>

            {/* Test results */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {filtered.length === 0 && (
                <div style={{ padding: 24, textAlign: "center", color: textLight, fontSize: 12 }}>
                  No results match.
                </div>
              )}
              {filtered.map(result => {
                const rColor = RESULT_STATUS_COLOR[result.status];
                const isSelected = selectedResult?.id === result.id;
                const isLoading = loadingId === `replay-${result.testId}`;
                return (
                  <div
                    key={result.id}
                    onClick={() => setSelectedResult(prev => prev?.id === result.id ? null : result)}
                    style={{
                      padding: "10px 16px", borderBottom: `1px solid ${border}`,
                      cursor: "pointer",
                      background: isSelected ? (isDark ? "#1e1230" : "#f0eaff") : "transparent",
                      borderLeft: `3px solid ${isSelected ? primary : "transparent"}`,
                      transition: "background 0.1s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <StatusDot status={result.status} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {formatTestName(result.testId)}
                        </div>
                        <div style={{ fontSize: 10, color: textLight, fontFamily: "monospace" }}>{result.testFileName}</div>
                      </div>
                      <div style={{ flexShrink: 0, textAlign: "right" }}>
                        <div style={{ fontSize: 10, color: rColor, fontWeight: 700 }}>{result.status}</div>
                        <div style={{ fontSize: 10, color: textLight }}>{fmtDuration(result.durationMs)}</div>
                      </div>
                    </div>
                    {result.requirements.length > 0 && (
                      <div style={{ fontSize: 10, color: textLight, marginTop: 3, paddingLeft: 16 }}>
                        📋 {result.requirements[0]}{result.requirements.length > 1 ? ` +${result.requirements.length - 1}` : ""}
                      </div>
                    )}
                    {/* Quick replay button */}
                    <div style={{ marginTop: 6, paddingLeft: 16 }} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => onRunSingle(result.testId)}
                        disabled={!!loadingId}
                        style={{
                          padding: "3px 9px", borderRadius: 5, border: "none",
                          background: isLoading ? "#9e7de0" : primary,
                          color: "#fff", fontSize: 10, fontWeight: 700,
                          cursor: loadingId ? "not-allowed" : "pointer",
                        }}
                      >
                        {isLoading ? "⏳" : "▶ Replay"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: result detail */}
          {selectedResult && (
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {/* Result header */}
              <div style={{ padding: "14px 16px", borderBottom: `1px solid ${border}`, flexShrink: 0 }}>
                <div style={{ display: "flex", gap: 7, alignItems: "center", marginBottom: 6 }}>
                  <StatusDot status={selectedResult.status} size={10} />
                  <Badge label={selectedResult.status.toUpperCase()} color={RESULT_STATUS_COLOR[selectedResult.status]} />
                  {selectedResult.retries > 0 && <Badge label={`${selectedResult.retries} retries`} color="#FFA726" />}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: primary }}>
                  {formatTestName(selectedResult.testId)}
                </div>
                <div style={{ fontSize: 10, color: textLight, fontFamily: "monospace", marginTop: 2 }}>
                  {selectedResult.testFileName} · {fmtDuration(selectedResult.durationMs)}
                </div>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 14 }}>

                {/* Requirements */}
                {selectedResult.requirements.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
                      Linked Requirements
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {selectedResult.requirements.map((req, i) => (
                        <div key={i} style={{ padding: "7px 10px", borderRadius: 7, background: bg, border: `1px solid ${border}`, fontSize: 11, color: text, display: "flex", gap: 7 }}>
                          <span>📋</span><span>{req}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error */}
                {selectedResult.errorMessage && (
                  <div style={{
                    padding: "10px 14px", borderRadius: 8,
                    background: isDark ? "#1a0000" : "#fff5f5",
                    border: `1px solid ${isDark ? "#3a0000" : "#FFCDD2"}`,
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#EF5350", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
                      ❌ Error
                    </div>
                    <div style={{ fontSize: 12, color: "#EF5350", lineHeight: 1.6 }}>
                      {selectedResult.errorMessage}
                    </div>
                    {selectedResult.errorStack && (
                      <pre style={{
                        marginTop: 8, padding: "8px 10px", borderRadius: 6,
                        background: isDark ? "#0d0000" : "#fff", fontSize: 10,
                        color: isDark ? "#ff8a80" : "#c62828", overflowX: "auto",
                        whiteSpace: "pre-wrap", maxHeight: 160, lineHeight: 1.5,
                      }}>
                        {selectedResult.errorStack}
                      </pre>
                    )}
                  </div>
                )}

                {/* Stdout log */}
                {selectedResult.stdout && (
                  <div>
                    <button
                      onClick={() => setShowStdout(v => !v)}
                      style={{
                        width: "100%", padding: "8px 12px", borderRadius: 8,
                        border: `1px solid ${border}`, background: "transparent",
                        color: text, fontSize: 12, fontWeight: 600,
                        cursor: "pointer", textAlign: "left",
                        display: "flex", justifyContent: "space-between",
                      }}
                    >
                      <span>📋 Execution Logs</span>
                      <span>{showStdout ? "▲" : "▼"}</span>
                    </button>
                    {showStdout && (
                      <pre style={{
                        marginTop: 6, padding: "10px 12px", borderRadius: 8,
                        background: codeBg, border: `1px solid ${border}`,
                        fontSize: 10, color: isDark ? "#a0d0a0" : "#d0f0d0",
                        overflowX: "auto", whiteSpace: "pre-wrap",
                        maxHeight: 260, lineHeight: 1.6,
                      }}>
                        {selectedResult.stdout || "No output captured."}
                      </pre>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                    Actions
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      onClick={() => onRunSingle(selectedResult.testId)}
                      style={{
                        padding: "8px 14px", borderRadius: 8, border: "none",
                        background: primary, color: "#fff",
                        fontWeight: 600, fontSize: 12, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 6,
                      }}
                    >
                      ▶ Replay Test
                    </button>
                    {selectedResult.status === "failed" && (
                      <button style={{
                        padding: "8px 14px", borderRadius: 8,
                        border: `1px solid ${border}`, background: "transparent",
                        color: text, fontWeight: 600, fontSize: 12, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 6,
                      }}>
                        🩹 Send to Auto-Heal
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Compare view ──────────────────────────────────────────────────────────────

function CompareView({
  comparison, onClose,
}: { comparison: RunComparison; onClose: () => void }) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: textLight, BG: bg, P: primary, dark: isDark } = useColors();

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.2)" }} />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: 680, zIndex: 50,
        background: surface, borderLeft: `1px solid ${border}`,
        display: "flex", flexDirection: "column",
        boxShadow: "-4px 0 28px rgba(0,0,0,0.14)",
        overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{ padding: "16px 20px 12px", borderBottom: `1px solid ${border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: primary }}>
              Run Comparison
            </h3>
            <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 17, color: textLight }}>✕</button>
          </div>

          {/* Run headers */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[comparison.runA, comparison.runB].map((run, i) => (
              <div key={i} style={{ padding: "10px 12px", borderRadius: 8, background: bg, border: `1px solid ${border}` }}>
                <div style={{ fontSize: 10, color: textLight, textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>
                  {i === 0 ? "Run A (Base)" : "Run B (Compare)"}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: text }}>{run.label}</div>
                <div style={{ fontSize: 11, marginTop: 4, display: "flex", gap: 8 }}>
                  <Badge label={run.status.toUpperCase()} color={RUN_STATUS_COLOR[run.status]} />
                  <span style={{ color: textLight }}>{new Date(run.startedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Summary diff */}
          <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
            {[
              { icon: "🔴", label: "New Failures", value: comparison.newFailures, color: "#EF5350" },
              { icon: "🟢", label: "Fixed Tests", value: comparison.fixedTests, color: "#66BB6A" },
              { icon: "⚪", label: "Unchanged", value: comparison.unchanged, color: textLight },
            ].map(({ icon, label, value, color }) => (
              <div key={label} style={{ flex: 1, padding: "10px 12px", borderRadius: 8, background: bg, border: `1px solid ${border}`, textAlign: "center" }}>
                <div style={{ fontSize: 18 }}>{icon}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
                <div style={{ fontSize: 10, color: textLight, textTransform: "uppercase", fontWeight: 700 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Diff table */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
            Test Diff ({comparison.diff.length} tests)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {comparison.diff.map(entry => {
              const rowBg = entry.broken ? (isDark ? "#1a0000" : "#fff5f5")
                : entry.fixed ? (isDark ? "#001a00" : "#f5fff5")
                : "transparent";
              const icon = entry.broken ? "🔴" : entry.fixed ? "🟢" : "⚪";
              const colorA = (RESULT_STATUS_COLOR as any)[entry.statusA] ?? "#90A4AE";
              const colorB = (RESULT_STATUS_COLOR as any)[entry.statusB] ?? "#90A4AE";
              const dDelta = entry.durationDelta;
              return (
                <div key={entry.fileName} style={{
                  padding: "10px 12px", borderRadius: 8,
                  background: rowBg,
                  border: `1px solid ${entry.changed ? (entry.broken ? "#EF5350" : "#66BB6A") : border}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {formatTestName(entry.testId)}
                      </div>
                      <div style={{ fontSize: 10, color: textLight, fontFamily: "monospace" }}>{entry.fileName}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                      <Badge label={entry.statusA} color={colorA} />
                      <span style={{ color: textLight, fontSize: 12 }}>→</span>
                      <Badge label={entry.statusB} color={colorB} />
                    </div>
                    {dDelta !== 0 && (
                      <span style={{ fontSize: 10, color: dDelta > 0 ? "#EF5350" : "#66BB6A", fontWeight: 700, flexShrink: 0 }}>
                        {dDelta > 0 ? "+" : ""}{fmtDuration(Math.abs(dDelta))}
                      </span>
                    )}
                  </div>
                  {entry.errorB && entry.broken && (
                    <div style={{ fontSize: 11, color: "#EF5350", marginTop: 6, paddingLeft: 22 }}>
                      {entry.errorB.slice(0, 120)}{entry.errorB.length > 120 ? "…" : ""}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ReplayViewer({ projectId }: { projectId: string; testName?: string }) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: textLight, P: primary, dark: isDark } = useColors();

  const [runs, setRuns] = useState<TestRun[]>([]);
  const [summary, setSummary] = useState<ReplaySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<TestRun | null>(null);
  const [fullRun, setFullRun] = useState<TestRun | null>(null);
  const [compareIds, setCompareIds] = useState<[string | null, string | null]>([null, null]);
  const [comparison, setComparison] = useState<RunComparison | null>(null);
  const [statusFilter, setStatusFilter] = useState<RunStatus | "all">("all");

  const load = useCallback(async () => {
    try {
      const [r, s] = await Promise.all([
        fetchRuns(projectId),
        fetchReplaySummary(projectId),
      ]);
      setRuns(Array.isArray(r) ? r : []);
      setSummary(s);
    } catch {
      setRuns([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const handleRunAll = async () => {
    setRunning(true);
    const tid = toast.loading("Running full test suite…", { duration: 120000 });
    try {
      const result = await runAll(projectId);
      if (result.status === "passed") {
        toast.success(`All ${result.summary.total} tests passed!`, { id: tid, duration: 4000 });
      } else if (result.status === "partial") {
        toast.error(`${result.summary.failed} of ${result.summary.total} tests failed.`, { id: tid, duration: 5000 });
      } else {
        toast.error("Test suite failed.", { id: tid, duration: 4000 });
      }
      await load();
    } catch {
      toast.error("Run failed.", { id: tid });
    } finally {
      setRunning(false);
    }
  };

  const handleRunSingle = async (testId: string) => {
    const key = `replay-${testId}`;
    setLoadingId(key);
    const tid = toast.loading(`Replaying "${formatTestName(testId)}"…`);
    try {
      const result = await runSingle(projectId, testId);
      const testResult = result.results?.[0];
      if (testResult?.status === "passed") {
        toast.success(`"${formatTestName(testId)}" passed.`, { id: tid, duration: 4000 });
      } else {
        toast.error(`"${formatTestName(testId)}" failed.`, { id: tid, duration: 4000 });
      }
      await load();
    } catch {
      toast.error("Replay failed.", { id: tid });
    } finally {
      setLoadingId(null);
    }
  };

  const handleSelectRun = async (run: TestRun) => {
    if (selectedRun?.id === run.id) { setSelectedRun(null); setFullRun(null); return; }
    setSelectedRun(run);
    try {
      const full = await fetchRun(projectId, run.id);
      setFullRun(full);
    } catch {
      setFullRun(run);
    }
  };

  const handleToggleCompare = (id: string) => {
    setCompareIds(prev => {
      if (prev[0] === id) return [null, prev[1]];
      if (prev[1] === id) return [prev[0], null];
      if (!prev[0]) return [id, prev[1]];
      if (!prev[1]) return [prev[0], id];
      return [id, prev[1]]; // replace A
    });
  };

  const handleCompare = async () => {
    if (!compareIds[0] || !compareIds[1]) return;
    const tid = toast.loading("Comparing runs…");
    try {
      const result = await fetchCompare(projectId, compareIds[0], compareIds[1]);
      setComparison(result);
      toast.dismiss(tid);
    } catch {
      toast.error("Comparison failed.", { id: tid });
    }
  };

  const filteredRuns = runs.filter(r => statusFilter === "all" || r.status === statusFilter);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
        <div style={{ textAlign: "center", color: textLight, fontSize: 13 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>▶</div>
          Loading replay history…
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", minWidth: 0 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: primary, fontSize: 20, fontWeight: 800 }}>
          Replay
        </h2>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: textLight }}>
          The execution cockpit — run tests, replay past runs, inspect failures, and compare results over time.
        </p>
      </div>

      {/* Summary */}
      {summary && (
        <SummaryBar summary={summary} running={running} onRunAll={handleRunAll} />
      )}

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as any)}
          style={{
            padding: "7px 12px", borderRadius: 8, border: `1px solid ${border}`,
            background: isDark ? surface : "#fff", color: text, fontSize: 12,
          }}
        >
          <option value="all">All Status</option>
          <option value="passed">Passed</option>
          <option value="failed">Failed</option>
          <option value="partial">Partial</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <span style={{ fontSize: 12, color: textLight }}>
          {filteredRuns.length} of {runs.length} run{runs.length !== 1 ? "s" : ""}
        </span>

        {/* Compare button */}
        {compareIds[0] && compareIds[1] && (
          <button
            onClick={handleCompare}
            style={{
              marginLeft: "auto", padding: "7px 16px", borderRadius: 8,
              border: "none", background: "#FFA726",
              color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            ⚖️ Compare Selected Runs
          </button>
        )}
        {(compareIds[0] || compareIds[1]) && !(compareIds[0] && compareIds[1]) && (
          <span style={{ marginLeft: "auto", fontSize: 12, color: "#FFA726", fontWeight: 500 }}>
            ☑ Select one more run to compare
          </span>
        )}
      </div>

      {/* Runs table */}
      <RunsTable
        runs={filteredRuns}
        selectedId={selectedRun?.id ?? null}
        compareIds={compareIds}
        onSelect={handleSelectRun}
        onToggleCompare={handleToggleCompare}
      />

      {/* Run detail panel */}
      {selectedRun && (
        <RunDetailPanel
          run={fullRun ?? selectedRun}
          loadingId={loadingId}
          onClose={() => { setSelectedRun(null); setFullRun(null); }}
          onRunSingle={handleRunSingle}
        />
      )}

      {/* Compare view */}
      {comparison && (
        <CompareView comparison={comparison} onClose={() => setComparison(null)} />
      )}
    </div>
  );
}
