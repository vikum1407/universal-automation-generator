import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { theme } from "@/theme";
import type { TestItem, TestSummary, TestView, TestStatus, TestType } from "@/api/tests";
import {
  fetchTests, fetchTestSummary,
  runAllTests, runSingleTest, healTest, regenerateTest,
  STATUS_COLOR, TYPE_COLOR,
} from "@/api/tests";
import TestSummaryBar from "./TestSummaryBar";
import TestDeepView from "./TestDeepView";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatName(name: string): string {
  if (!name) return name;
  // Already readable (has spaces, not a slug/filename)
  if (name.includes(" ") && !name.includes(".spec.ts")) return name;
  return name
    .replace(/\.spec\.ts$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

// ── View icons ────────────────────────────────────────────────────────────────

const VIEWS: { id: TestView; label: string; icon: string }[] = [
  { id: "list", label: "List", icon: "☰" },
  { id: "tree", label: "Tree", icon: "🌲" },
  { id: "requirement", label: "Requirements", icon: "📋" },
  { id: "risk", label: "Risk", icon: "🎯" },
];

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
      background: `${color}22`, color,
    }}>
      {label}
    </span>
  );
}

function StabilityDot({ score }: { score: number }) {
  const color = score >= 75 ? "#66BB6A" : score >= 50 ? "#FFA726" : "#EF5350";
  return (
    <span title={`Stability: ${score}%`} style={{
      display: "inline-block", width: 8, height: 8, borderRadius: "50%",
      background: color, flexShrink: 0, boxShadow: `0 0 5px ${color}88`,
    }} />
  );
}

// ── List View ─────────────────────────────────────────────────────────────────

function TestListView({
  tests, selectedId, actionLoadingId, onSelect, onAction,
}: {
  tests: TestItem[];
  selectedId: string | null;
  actionLoadingId: string | null;
  onSelect: (t: TestItem) => void;
  onAction: (t: TestItem, action: string) => void;
}) {
  const isDark = theme.mode === "dark";
  const surface = isDark ? theme.colors.darkSurface : theme.colors.background;
  const border = isDark ? theme.colors.darkBorder : theme.colors.border;
  const text = isDark ? theme.colors.darkText : theme.colors.textDark;
  const textLight = isDark ? theme.colors.darkTextLight : theme.colors.textLight;

  if (!tests.length) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: textLight, fontSize: 13 }}>
        No tests match the current filters.
      </div>
    );
  }

  return (
    <div style={{ borderRadius: 14, border: `1px solid ${border}`, background: surface, overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${border}` }}>
            {["Test Name", "Type", "Status", "Requirements", "Stability", "Risk", "AI", "Actions"].map(h => (
              <th key={h} style={{
                padding: "10px 14px", textAlign: "left",
                fontSize: 10, fontWeight: 700, color: textLight,
                textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap",
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tests.map(t => {
            const selected = t.id === selectedId;
            const isActionLoading = actionLoadingId?.startsWith(t.id) ?? false;
            return (
              <tr
                key={t.id}
                onClick={() => onSelect(t)}
                style={{
                  cursor: "pointer",
                  background: selected ? (isDark ? "#1e1230" : "#f0eaff") : "transparent",
                  borderLeft: `3px solid ${selected ? theme.colors.primary : "transparent"}`,
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
                {/* Name */}
                <td style={{ padding: "11px 14px", maxWidth: 220 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 600, color: text,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200,
                  }} title={formatName(t.name)}>{formatName(t.name)}</div>
                  <div style={{ fontSize: 10, color: textLight, fontFamily: "monospace", marginTop: 1 }}>
                    {t.fileName}
                  </div>
                </td>
                {/* Type */}
                <td style={{ padding: "11px 14px" }}>
                  <Badge label={t.type.toUpperCase()} color={TYPE_COLOR[t.type] ?? "#888"} />
                </td>
                {/* Status */}
                <td style={{ padding: "11px 14px" }}>
                  <Badge label={t.status.toUpperCase()} color={STATUS_COLOR[t.status]} />
                </td>
                {/* Requirements */}
                <td style={{ padding: "11px 14px", maxWidth: 160 }}>
                  {t.requirements.length > 0 ? (
                    <span style={{ fontSize: 11, color: textLight }} title={t.requirements.join(", ")}>
                      {t.requirements.length} req{t.requirements.length !== 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, color: isDark ? "#444" : "#ccc" }}>—</span>
                  )}
                </td>
                {/* Stability */}
                <td style={{ padding: "11px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <StabilityDot score={t.stabilityScore} />
                    <span style={{ fontSize: 11, color: textLight }}>{t.stabilityScore}%</span>
                  </div>
                </td>
                {/* Risk */}
                <td style={{ padding: "11px 14px" }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: t.riskScore >= 75 ? "#EF5350" : t.riskScore >= 50 ? "#FFA726" : "#66BB6A",
                  }}>
                    {t.riskScore >= 75 ? "High" : t.riskScore >= 50 ? "Med" : "Low"}
                  </span>
                </td>
                {/* AI */}
                <td style={{ padding: "11px 14px" }}>
                  {t.aiSuggestions > 0 ? (
                    <span style={{
                      padding: "2px 7px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                      background: "#9C27B022", color: "#9C27B0",
                    }}>{t.aiSuggestions}</span>
                  ) : (
                    <span style={{ fontSize: 11, color: isDark ? "#444" : "#ccc" }}>—</span>
                  )}
                </td>
                {/* Actions */}
                <td style={{ padding: "11px 14px" }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: "flex", gap: 5 }}>
                    <button
                      onClick={() => !isActionLoading && onAction(t, "run")}
                      disabled={isActionLoading}
                      title="Run test"
                      style={{
                        padding: "4px 10px", borderRadius: 6, border: "none",
                        background: isActionLoading ? "#9e7de0" : theme.colors.primary,
                        color: "#fff", fontSize: 11, fontWeight: 700,
                        cursor: isActionLoading ? "not-allowed" : "pointer",
                      }}
                    >
                      {isActionLoading ? "⏳" : "▶ Run"}
                    </button>
                    <button
                      onClick={() => onSelect(t)}
                      style={{
                        padding: "4px 8px", borderRadius: 6,
                        border: `1px solid ${border}`, background: "transparent",
                        color: text, fontSize: 11, cursor: "pointer",
                      }}
                    >
                      View →
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Tree View ─────────────────────────────────────────────────────────────────

function TestTreeView({
  tests, selectedId, actionLoadingId, onSelect, onAction,
}: {
  tests: TestItem[];
  selectedId: string | null;
  actionLoadingId: string | null;
  onSelect: (t: TestItem) => void;
  onAction: (t: TestItem, action: string) => void;
}) {
  const isDark = theme.mode === "dark";
  const surface = isDark ? theme.colors.darkSurface : theme.colors.background;
  const border = isDark ? theme.colors.darkBorder : theme.colors.border;
  const text = isDark ? theme.colors.darkText : theme.colors.textDark;
  const textLight = isDark ? theme.colors.darkTextLight : theme.colors.textLight;

  const uiTests = tests.filter(t => t.type === "ui");
  const apiTests = tests.filter(t => t.type === "api");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["ui", "api"]));

  const toggle = (key: string) => setExpandedGroups(prev => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });

  const renderGroup = (label: string, key: string, items: TestItem[], icon: string, color: string) => {
    const expanded = expandedGroups.has(key);
    return (
      <div key={key} style={{ marginBottom: 8 }}>
        <button
          onClick={() => toggle(key)}
          style={{
            width: "100%", padding: "10px 14px", borderRadius: 10,
            border: `1px solid ${border}`, background: surface,
            display: "flex", alignItems: "center", gap: 10,
            cursor: "pointer",
          }}
        >
          <span style={{ fontSize: 16 }}>{icon}</span>
          <span style={{ flex: 1, textAlign: "left", fontWeight: 700, color, fontSize: 13 }}>
            {label}
          </span>
          <span style={{ fontSize: 11, color: textLight }}>{items.length} test{items.length !== 1 ? "s" : ""}</span>
          <span style={{ color: textLight, fontSize: 12 }}>{expanded ? "▲" : "▼"}</span>
        </button>

        {expanded && items.length > 0 && (
          <div style={{ paddingLeft: 16, marginTop: 4, display: "flex", flexDirection: "column", gap: 4 }}>
            {items.map(t => {
              const isSelected = t.id === selectedId;
              const isActionLoading = actionLoadingId?.startsWith(t.id) ?? false;
              return (
                <div
                  key={t.id}
                  onClick={() => onSelect(t)}
                  style={{
                    padding: "9px 14px", borderRadius: 8,
                    border: `1px solid ${isSelected ? theme.colors.primary : border}`,
                    background: isSelected ? (isDark ? "#1e1230" : "#f0eaff") : surface,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                    transition: "background 0.1s",
                  }}
                >
                  <span style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: STATUS_COLOR[t.status], flexShrink: 0,
                    boxShadow: `0 0 4px ${STATUS_COLOR[t.status]}88`,
                  }} />
                  <span style={{ flex: 1, fontSize: 12, color: text, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {formatName(t.name)}
                  </span>
                  <span style={{ fontSize: 10, color: textLight, fontFamily: "monospace", flexShrink: 0 }}>
                    {t.fileName}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); !isActionLoading && onAction(t, "run"); }}
                    disabled={isActionLoading}
                    style={{
                      padding: "3px 9px", borderRadius: 6, border: "none",
                      background: isActionLoading ? "#9e7de0" : theme.colors.primary,
                      color: "#fff", fontSize: 10, fontWeight: 700,
                      cursor: isActionLoading ? "not-allowed" : "pointer", flexShrink: 0,
                    }}
                  >
                    {isActionLoading ? "⏳" : "▶"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {expanded && items.length === 0 && (
          <div style={{ padding: "12px 16px", color: textLight, fontSize: 12, fontStyle: "italic" }}>
            No {label.toLowerCase()} match current filters.
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {renderGroup("UI Tests", "ui", uiTests, "🖥️", TYPE_COLOR.ui)}
      {renderGroup("API Tests", "api", apiTests, "🔌", TYPE_COLOR.api)}
    </div>
  );
}

// ── Requirement View ──────────────────────────────────────────────────────────

function TestRequirementView({
  tests, selectedId, onSelect,
}: {
  tests: TestItem[];
  selectedId: string | null;
  onSelect: (t: TestItem) => void;
}) {
  const isDark = theme.mode === "dark";
  const surface = isDark ? theme.colors.darkSurface : theme.colors.background;
  const border = isDark ? theme.colors.darkBorder : theme.colors.border;
  const text = isDark ? theme.colors.darkText : theme.colors.textDark;
  const textLight = isDark ? theme.colors.darkTextLight : theme.colors.textLight;

  // Group tests by first requirement
  const groups: Record<string, TestItem[]> = {};
  for (const t of tests) {
    const key = t.requirements[0] || "Unmapped Tests";
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {Object.entries(groups).map(([req, reqTests]) => (
        <div key={req} style={{ borderRadius: 12, border: `1px solid ${border}`, background: surface, overflow: "hidden" }}>
          <div style={{
            padding: "10px 16px", background: isDark ? "#1a1230" : "#f5eeff",
            borderBottom: `1px solid ${border}`,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 14 }}>📋</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: theme.colors.primary, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {req}
            </span>
            <span style={{ fontSize: 11, color: textLight }}>{reqTests.length} test{reqTests.length !== 1 ? "s" : ""}</span>
          </div>
          {reqTests.map(t => (
            <div
              key={t.id}
              onClick={() => onSelect(t)}
              style={{
                padding: "9px 16px", display: "flex", alignItems: "center", gap: 10,
                cursor: "pointer", borderBottom: `1px solid ${border}`,
                background: t.id === selectedId ? (isDark ? "#1e1230" : "#f0eaff") : "transparent",
                transition: "background 0.1s",
              }}
            >
              <span style={{
                width: 7, height: 7, borderRadius: "50%",
                background: STATUS_COLOR[t.status], flexShrink: 0,
              }} />
              <span style={{ fontSize: 12, color: text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {formatName(t.name)}
              </span>
              <Badge label={t.type.toUpperCase()} color={TYPE_COLOR[t.type]} />
              <Badge label={t.status} color={STATUS_COLOR[t.status]} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Risk View ─────────────────────────────────────────────────────────────────

function TestRiskView({ tests, selectedId, onSelect }: {
  tests: TestItem[]; selectedId: string | null; onSelect: (t: TestItem) => void;
}) {
  const isDark = theme.mode === "dark";
  const border = isDark ? theme.colors.darkBorder : theme.colors.border;
  const surface = isDark ? theme.colors.darkSurface : theme.colors.background;
  const text = isDark ? theme.colors.darkText : theme.colors.textDark;

  const sorted = [...tests].sort((a, b) => b.riskScore - a.riskScore);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {sorted.map(t => {
        const riskColor = t.riskScore >= 75 ? "#EF5350" : t.riskScore >= 50 ? "#FFA726" : "#66BB6A";
        return (
          <div
            key={t.id}
            onClick={() => onSelect(t)}
            style={{
              padding: "12px 16px", borderRadius: 10,
              border: `1px solid ${t.id === selectedId ? theme.colors.primary : border}`,
              background: t.id === selectedId ? (isDark ? "#1e1230" : "#f0eaff") : surface,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
              transition: "background 0.1s",
            }}
          >
            {/* Risk bar */}
            <div style={{ width: 40, textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: riskColor }}>{t.riskScore}</div>
              <div style={{ fontSize: 9, color: riskColor, fontWeight: 700, textTransform: "uppercase" }}>risk</div>
            </div>
            <div style={{ width: 4, height: 36, borderRadius: 2, background: riskColor, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {formatName(t.name)}
              </div>
              <div style={{ fontSize: 10, color: riskColor, marginTop: 2 }}>
                {t.riskScore >= 75 ? "High Risk" : t.riskScore >= 50 ? "Moderate Risk" : "Low Risk"} · {t.status}
              </div>
            </div>
            <Badge label={t.type.toUpperCase()} color={TYPE_COLOR[t.type]} />
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TestRunner({ projectId }: { projectId: string }) {
  const isDark = theme.mode === "dark";
  const text = isDark ? theme.colors.darkText : theme.colors.textDark;
  const textLight = isDark ? theme.colors.darkTextLight : theme.colors.textLight;
  const border = isDark ? theme.colors.darkBorder : theme.colors.border;
  const surface = isDark ? theme.colors.darkSurface : theme.colors.background;

  const [tests, setTests] = useState<TestItem[]>([]);
  const [summary, setSummary] = useState<TestSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TestItem | null>(null);
  const [activeView, setActiveView] = useState<TestView>("list");
  const [runningAll, setRunningAll] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TestType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<TestStatus | "all">("all");

  const load = useCallback(async () => {
    try {
      const [t, s] = await Promise.all([fetchTests(projectId), fetchTestSummary(projectId)]);
      setTests(Array.isArray(t) ? t : []);
      setSummary(s);
    } catch {
      setTests([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const handleRunAll = async () => {
    setRunningAll(true);
    const tid = toast.loading("Running all tests… this may take a minute.", { duration: 60000 });
    try {
      const result = await runAllTests(projectId);
      if (result.status === "passed") {
        toast.success(`All tests passed!`, { id: tid, duration: 4000 });
      } else {
        const failCount = result.failures?.length || 1;
        toast.error(`${failCount} test${failCount !== 1 ? "s" : ""} failed. Check results.`, { id: tid, duration: 5000 });
      }
      await load();
    } catch {
      toast.error("Failed to run tests.", { id: tid });
    } finally {
      setRunningAll(false);
    }
  };

  const handleAction = async (test: TestItem, action: string) => {
    const loadingKey = `${test.id}-${action}`;
    setActionLoadingId(loadingKey);

    const displayName = formatName(test.name);
    const messages: Record<string, { loading: string; success: string }> = {
      run: { loading: `Running "${displayName}"…`, success: `Test "${displayName}" completed.` },
      heal: { loading: `Healing "${displayName}"…`, success: `Test healed successfully.` },
      regenerate: { loading: `Regenerating "${displayName}"…`, success: `Test regenerated from requirement.` },
    };

    const msg = messages[action] ?? { loading: "Working…", success: "Done." };
    const tid = toast.loading(msg.loading);

    try {
      let result: any;
      if (action === "run") result = await runSingleTest(projectId, test.id);
      else if (action === "heal") result = await healTest(projectId, test.id);
      else if (action === "regenerate") result = await regenerateTest(projectId, test.id);

      if (action === "run") {
        if (result?.status === "passed") {
          toast.success(`"${displayName}" passed.`, { id: tid, duration: 4000 });
        } else {
          toast.error(`"${displayName}" failed.`, { id: tid, duration: 4000 });
        }
      } else {
        toast.success(msg.success, { id: tid, duration: 4000 });
      }

      await load();
      if (selected?.id === test.id) {
        setSelected(prev => {
          const updated = tests.find(t => t.id === prev?.id);
          return updated ?? prev;
        });
      }
    } catch {
      toast.error(`Action failed — check the project output directory.`, { id: tid, duration: 4000 });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter logic
  const filtered = tests.filter(t => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) &&
        !t.fileName.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== "all" && t.type !== typeFilter) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
        <div style={{ textAlign: "center", color: textLight, fontSize: 13 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🧪</div>
          Loading tests…
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", minWidth: 0 }}>
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: theme.colors.primary, fontSize: 20, fontWeight: 800 }}>
          Tests
        </h2>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: textLight }}>
          The execution hub — run, inspect, heal, and track all automation tests.
        </p>
      </div>

      {/* Summary bar */}
      {summary && (
        <TestSummaryBar summary={summary} running={runningAll} onRun={handleRunAll} />
      )}

      {/* No tests state */}
      {tests.length === 0 && (
        <div style={{
          textAlign: "center", padding: "60px 20px",
          color: textLight, fontSize: 13,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🧪</div>
          <h3 style={{ margin: "0 0 8px", color: theme.colors.primary }}>No Tests Yet</h3>
          <p style={{ maxWidth: 360, margin: "0 auto", lineHeight: 1.6 }}>
            Generate tests from the AI Suggestions tab or run a project scan to create your first test suite.
          </p>
        </div>
      )}

      {/* Explorer */}
      {tests.length > 0 && (
        <>
          {/* Toolbar */}
          <div style={{
            display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center",
            marginBottom: 14,
          }}>
            {/* Search */}
            <input
              placeholder="Search tests…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: "1 1 180px", padding: "7px 12px", borderRadius: 8,
                border: `1px solid ${border}`, background: isDark ? surface : "#fff",
                color: text, fontSize: 12, outline: "none",
              }}
            />

            {/* Type filter */}
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as any)}
              style={{
                padding: "7px 12px", borderRadius: 8, border: `1px solid ${border}`,
                background: isDark ? surface : "#fff", color: text, fontSize: 12,
              }}
            >
              <option value="all">All Types</option>
              <option value="ui">UI</option>
              <option value="api">API</option>
            </select>

            {/* Status filter */}
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
              <option value="not-run">Not Run</option>
            </select>

            <span style={{ fontSize: 12, color: textLight, whiteSpace: "nowrap" }}>
              {filtered.length} of {tests.length} test{tests.length !== 1 ? "s" : ""}
            </span>

            {/* View switcher */}
            <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
              {VIEWS.map(v => (
                <button
                  key={v.id}
                  onClick={() => setActiveView(v.id)}
                  title={v.label}
                  style={{
                    padding: "6px 12px", borderRadius: 8,
                    border: `1px solid ${activeView === v.id ? theme.colors.primary : border}`,
                    background: activeView === v.id
                      ? `${theme.colors.primary}20` : "transparent",
                    color: activeView === v.id ? theme.colors.primary : text,
                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 5,
                  }}
                >
                  <span>{v.icon}</span>
                  <span>{v.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active view */}
          {activeView === "list" && (
            <TestListView
              tests={filtered}
              selectedId={selected?.id ?? null}
              actionLoadingId={actionLoadingId}
              onSelect={t => setSelected(prev => prev?.id === t.id ? null : t)}
              onAction={handleAction}
            />
          )}
          {activeView === "tree" && (
            <TestTreeView
              tests={filtered}
              selectedId={selected?.id ?? null}
              actionLoadingId={actionLoadingId}
              onSelect={t => setSelected(prev => prev?.id === t.id ? null : t)}
              onAction={handleAction}
            />
          )}
          {activeView === "requirement" && (
            <TestRequirementView
              tests={filtered}
              selectedId={selected?.id ?? null}
              onSelect={t => setSelected(prev => prev?.id === t.id ? null : t)}
            />
          )}
          {activeView === "risk" && (
            <TestRiskView
              tests={filtered}
              selectedId={selected?.id ?? null}
              onSelect={t => setSelected(prev => prev?.id === t.id ? null : t)}
            />
          )}
        </>
      )}

      {/* Deep view panel */}
      {selected && (
        <TestDeepView
          test={selected}
          actionLoadingId={actionLoadingId}
          onClose={() => setSelected(null)}
          onAction={handleAction}
        />
      )}
    </div>
  );
}
