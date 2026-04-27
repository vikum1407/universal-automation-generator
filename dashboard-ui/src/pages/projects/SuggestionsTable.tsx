import { useState } from "react";
import { theme } from "@/theme";
import type { Suggestion, SuggestionType, RiskLevel } from "@/api/suggestions";
import { TYPE_COLOR, TYPE_LABEL, RISK_COLOR } from "@/api/suggestions";

// ── Filter bar ────────────────────────────────────────────────────────────────

const ALL_TYPES: Array<{ value: SuggestionType | "all"; label: string }> = [
  { value: "all", label: "All Types" },
  { value: "missing-test", label: "Missing Test" },
  { value: "improve-test", label: "Improve Test" },
  { value: "heal", label: "Auto-Heal" },
  { value: "rewrite-requirement", label: "Rewrite Req" },
  { value: "risk", label: "Risk" },
  { value: "stability", label: "Stability" },
  { value: "release", label: "Release" },
];

const ALL_RISKS: Array<{ value: RiskLevel | "all"; label: string }> = [
  { value: "all", label: "All Risk" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

function Select({
  value, onChange, options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const isDark = theme.mode === "dark";
  const border = isDark ? theme.colors.darkBorder : theme.colors.border;
  const bg = isDark ? theme.colors.darkSurface : "#fff";
  const text = isDark ? theme.colors.darkText : theme.colors.textDark;

  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        padding: "7px 12px", borderRadius: 8, border: `1px solid ${border}`,
        background: bg, color: text, fontSize: 12, fontWeight: 500,
        cursor: "pointer", outline: "none",
      }}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

const ACTION_IN_PROGRESS: Record<string, string> = {
  "generate-test": "Generating…",
  "heal":          "Healing…",
  "regenerate":    "Regenerating…",
  "rewrite":       "Rewriting…",
  "refactor":      "Refactoring…",
  "apply":         "Applying…",
};

// ── Table row ─────────────────────────────────────────────────────────────────

function SuggestionRow({
  suggestion, selected, applyingAction, onSelect, onApply, onDismiss,
}: {
  suggestion: Suggestion;
  selected: boolean;
  applyingAction: string | null;
  onSelect: () => void;
  onApply: (s: Suggestion, actionType: string, payload?: any) => void;
  onDismiss: (s: Suggestion) => void;
}) {
  const isDark = theme.mode === "dark";
  const border = isDark ? theme.colors.darkBorder : theme.colors.border;
  const text = isDark ? theme.colors.darkText : theme.colors.textDark;
  const textLight = isDark ? theme.colors.darkTextLight : theme.colors.textLight;
  const surface = isDark ? theme.colors.darkSurface : theme.colors.background;

  const typeColor = TYPE_COLOR[suggestion.type];
  const riskColor = RISK_COLOR[suggestion.riskLevel];
  const impactColor = suggestion.impact >= 80 ? "#EF5350" : suggestion.impact >= 60 ? "#FFA726" : "#66BB6A";

  const primaryAction = suggestion.actions[0];

  return (
    <tr
      onClick={onSelect}
      style={{
        cursor: "pointer",
        background: selected
          ? isDark ? "#1e1230" : "#f0eaff"
          : "transparent",
        borderLeft: selected ? `3px solid ${theme.colors.primary}` : "3px solid transparent",
        transition: "background 0.1s",
        opacity: suggestion.status === "dismissed" ? 0.45 : 1,
      }}
      onMouseEnter={e => {
        if (!selected) {
          (e.currentTarget as HTMLTableRowElement).style.background =
            isDark ? "#1a1a2e" : "#fafafa";
        }
      }}
      onMouseLeave={e => {
        if (!selected) {
          (e.currentTarget as HTMLTableRowElement).style.background = "transparent";
        }
      }}
    >
      {/* Type */}
      <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
        <span style={{
          padding: "3px 9px", borderRadius: 7, fontSize: 10, fontWeight: 700,
          background: `${typeColor}22`, color: typeColor,
        }}>
          {TYPE_LABEL[suggestion.type]}
        </span>
      </td>

      {/* Title */}
      <td style={{ padding: "12px 14px", maxWidth: 260 }}>
        <div style={{
          fontSize: 13, fontWeight: 600, color: text,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          maxWidth: 240,
        }}>
          {suggestion.title}
        </div>
        {suggestion.endpoint && (
          <div style={{ fontSize: 10, color: textLight, fontFamily: "monospace", marginTop: 2 }}>
            {suggestion.endpoint}
          </div>
        )}
      </td>

      {/* Risk */}
      <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
        <span style={{
          padding: "3px 9px", borderRadius: 7, fontSize: 10, fontWeight: 700,
          background: `${riskColor}22`, color: riskColor,
          textTransform: "uppercase",
        }}>
          {suggestion.riskLevel}
        </span>
      </td>

      {/* Impact */}
      <td style={{ padding: "12px 14px", minWidth: 80 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: impactColor, marginBottom: 3 }}>
          {suggestion.impact}%
        </div>
        <div style={{ height: 4, borderRadius: 3, background: isDark ? "#333" : "#eee", overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${suggestion.impact}%`,
            background: impactColor, borderRadius: 3,
          }} />
        </div>
      </td>

      {/* Confidence */}
      <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: textLight }}>
          {suggestion.confidence}%
        </span>
      </td>

      {/* Status */}
      <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
        <span style={{
          padding: "3px 9px", borderRadius: 7, fontSize: 10, fontWeight: 700,
          background: suggestion.status === "applied" ? "#66BB6A22" :
                      suggestion.status === "dismissed" ? "#88888822" : "#FFA72622",
          color: suggestion.status === "applied" ? "#66BB6A" :
                 suggestion.status === "dismissed" ? "#888" : "#FFA726",
        }}>
          {suggestion.status.toUpperCase()}
        </span>
      </td>

      {/* Actions */}
      <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }} onClick={e => e.stopPropagation()}>
          {suggestion.status === "pending" && primaryAction && (
            <button
              onClick={() => !applyingAction && onApply(suggestion, primaryAction.type, primaryAction.payload)}
              disabled={!!applyingAction}
              style={{
                padding: "5px 11px", borderRadius: 7, border: "none",
                background: applyingAction ? "#9e7de0" : theme.colors.primary,
                color: "#fff",
                fontSize: 11, fontWeight: 700,
                cursor: applyingAction ? "not-allowed" : "pointer",
                transition: "opacity 0.12s, background 0.2s",
                display: "flex", alignItems: "center", gap: 5,
                minWidth: 80,
              }}
              onMouseEnter={e => {
                if (!applyingAction) (e.currentTarget as HTMLButtonElement).style.opacity = "0.8";
              }}
              onMouseLeave={e => {
                if (!applyingAction) (e.currentTarget as HTMLButtonElement).style.opacity = "1";
              }}
            >
              {applyingAction ? (
                <>
                  <span style={{ fontSize: 10 }}>⏳</span>
                  {ACTION_IN_PROGRESS[applyingAction] ?? "Working…"}
                </>
              ) : primaryAction.label}
            </button>
          )}
          <button
            onClick={onSelect}
            style={{
              padding: "5px 10px", borderRadius: 7,
              border: `1px solid ${border}`, background: "transparent",
              color: text, fontSize: 11, fontWeight: 500, cursor: "pointer",
            }}
          >
            View →
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Main table ────────────────────────────────────────────────────────────────

export default function SuggestionsTable({
  suggestions, selectedId, applyingMap, onSelect, onApply, onDismiss,
}: {
  suggestions: Suggestion[];
  selectedId: string | null;
  applyingMap: Record<string, string>;
  onSelect: (s: Suggestion) => void;
  onApply: (s: Suggestion, actionType: string, payload?: any) => void;
  onDismiss: (s: Suggestion) => void;
}) {
  const isDark = theme.mode === "dark";
  const surface = isDark ? theme.colors.darkSurface : theme.colors.background;
  const border = isDark ? theme.colors.darkBorder : theme.colors.border;
  const text = isDark ? theme.colors.darkText : theme.colors.textDark;
  const textLight = isDark ? theme.colors.darkTextLight : theme.colors.textLight;

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("pending");

  const filtered = suggestions.filter(s => {
    if (search && !s.title.toLowerCase().includes(search.toLowerCase()) &&
        !s.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== "all" && s.type !== typeFilter) return false;
    if (riskFilter !== "all" && s.riskLevel !== riskFilter) return false;
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    return true;
  });

  return (
    <div style={{ width: "100%", minWidth: 0 }}>
      {/* Filter bar */}
      <div style={{
        display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center",
        marginBottom: 16,
      }}>
        <input
          placeholder="Search suggestions…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: "1 1 200px", padding: "7px 12px", borderRadius: 8,
            border: `1px solid ${border}`, background: isDark ? theme.colors.darkSurface : "#fff",
            color: text, fontSize: 12, outline: "none",
          }}
        />
        <Select value={typeFilter} onChange={setTypeFilter} options={ALL_TYPES} />
        <Select value={riskFilter} onChange={setRiskFilter} options={ALL_RISKS} />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "all", label: "All Status" },
            { value: "pending", label: "Pending" },
            { value: "applied", label: "Applied" },
            { value: "dismissed", label: "Dismissed" },
          ]}
        />
        <span style={{ fontSize: 12, color: textLight, whiteSpace: "nowrap" }}>
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div style={{
        borderRadius: 14, border: `1px solid ${border}`,
        background: surface, boxShadow: theme.shadow.card,
        width: "100%", overflowX: "auto",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${border}` }}>
              {["Type", "Title", "Risk", "Impact", "Confidence", "Status", "Actions"].map(h => (
                <th
                  key={h}
                  style={{
                    padding: "11px 14px", textAlign: "left",
                    fontSize: 10, fontWeight: 700, color: textLight,
                    textTransform: "uppercase", letterSpacing: "0.07em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: textLight, fontSize: 13 }}>
                  No suggestions match the current filters.
                </td>
              </tr>
            ) : (
              filtered.map(s => (
                <SuggestionRow
                  key={s.id}
                  suggestion={s}
                  selected={s.id === selectedId}
                  applyingAction={applyingMap[s.id] ?? null}
                  onSelect={() => onSelect(s)}
                  onApply={onApply}
                  onDismiss={onDismiss}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
