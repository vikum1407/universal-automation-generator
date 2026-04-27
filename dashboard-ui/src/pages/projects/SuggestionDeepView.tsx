import { theme } from "@/theme";
import type { Suggestion } from "@/api/suggestions";
import { TYPE_COLOR, TYPE_LABEL, RISK_COLOR } from "@/api/suggestions";

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700,
      background: `${color}22`, color,
    }}>
      {label}
    </span>
  );
}

function ScoreBar({ value, color, label }: { value: number; color: string; label: string }) {
  const isDark = theme.mode === "dark";
  const textLight = isDark ? theme.colors.darkTextLight : theme.colors.textLight;
  const bg = isDark ? "#2a2a3a" : "#eee";

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: textLight }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{value}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 4, background: bg, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 4, transition: "width 0.4s" }} />
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  const isDark = theme.mode === "dark";
  const text = isDark ? theme.colors.darkText : theme.colors.textDark;
  const textLight = isDark ? theme.colors.darkTextLight : theme.colors.textLight;

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>
        {label}
      </div>
      <div style={{
        fontSize: 12, color: text,
        fontFamily: mono ? "monospace" : "inherit",
        wordBreak: "break-all",
      }}>
        {value}
      </div>
    </div>
  );
}

const ACTION_IN_PROGRESS: Record<string, string> = {
  "generate-test": "Generating test file…",
  "heal":          "Auto-healing…",
  "regenerate":    "Regenerating…",
  "rewrite":       "Rewriting requirement…",
  "refactor":      "Refactoring…",
  "apply":         "Applying…",
};

interface Props {
  suggestion: Suggestion | null;
  applyingAction: string | null;
  onClose: () => void;
  onApply: (suggestion: Suggestion, actionType: string, payload?: any) => void;
  onDismiss: (suggestion: Suggestion) => void;
}

export default function SuggestionDeepView({ suggestion, applyingAction, onClose, onApply, onDismiss }: Props) {
  if (!suggestion) return null;

  const isDark = theme.mode === "dark";
  const surface = isDark ? theme.colors.darkSurface : theme.colors.background;
  const border = isDark ? theme.colors.darkBorder : theme.colors.border;
  const text = isDark ? theme.colors.darkText : theme.colors.textDark;
  const textLight = isDark ? theme.colors.darkTextLight : theme.colors.textLight;
  const bg = isDark ? theme.colors.darkBackground : "#f5f5f8";

  const typeColor = TYPE_COLOR[suggestion.type];
  const riskColor = RISK_COLOR[suggestion.riskLevel];

  const impactColor = suggestion.impact >= 80 ? "#EF5350" : suggestion.impact >= 60 ? "#FFA726" : "#66BB6A";
  const confColor = suggestion.confidence >= 80 ? "#66BB6A" : suggestion.confidence >= 60 ? "#FFA726" : "#EF5350";

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 40,
          background: "rgba(0,0,0,0.25)",
        }}
      />

      {/* Panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: 420, zIndex: 50,
        background: surface, borderLeft: `1px solid ${border}`,
        display: "flex", flexDirection: "column",
        boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
        overflowY: "auto",
      }}>

        {/* Header */}
        <div style={{
          padding: "18px 20px 14px",
          borderBottom: `1px solid ${border}`,
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Badge label={TYPE_LABEL[suggestion.type]} color={typeColor} />
              <Badge label={suggestion.riskLevel.toUpperCase()} color={riskColor} />
              {suggestion.status === "applied" && <Badge label="APPLIED" color="#66BB6A" />}
              {suggestion.status === "dismissed" && <Badge label="DISMISSED" color="#888" />}
            </div>
            <button
              onClick={onClose}
              style={{
                border: "none", background: "transparent",
                cursor: "pointer", fontSize: 18, color: textLight,
                padding: "2px 6px", borderRadius: 6,
              }}
            >✕</button>
          </div>

          <h3 style={{
            margin: 0, fontSize: 14, fontWeight: 700,
            color: theme.colors.primary, lineHeight: 1.4,
          }}>
            {suggestion.title}
          </h3>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Description */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
              Description
            </div>
            <p style={{ margin: 0, fontSize: 13, color: text, lineHeight: 1.6 }}>
              {suggestion.description}
            </p>
          </div>

          {/* Scores */}
          <div style={{ padding: "14px 16px", borderRadius: 10, background: bg }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
              Analysis Scores
            </div>
            <ScoreBar value={suggestion.impact} color={impactColor} label="Impact" />
            <ScoreBar value={suggestion.confidence} color={confColor} label="AI Confidence" />
          </div>

          {/* Linked context */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
              Linked Context
            </div>
            {suggestion.requirementId && (
              <InfoRow label="Requirement ID" value={suggestion.requirementId} mono />
            )}
            {suggestion.endpoint && (
              <InfoRow label="Endpoint" value={suggestion.endpoint} mono />
            )}
            {suggestion.testId && (
              <InfoRow label="Test ID" value={suggestion.testId} mono />
            )}
            {suggestion.flowId && (
              <InfoRow label="Flow ID" value={suggestion.flowId} mono />
            )}
            {!suggestion.requirementId && !suggestion.endpoint && !suggestion.testId && !suggestion.flowId && (
              <span style={{ fontSize: 12, color: textLight, fontStyle: "italic" }}>No linked context</span>
            )}
          </div>

          {/* AI Reasoning */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
              AI Reasoning
            </div>
            <div style={{
              padding: "12px 14px", borderRadius: 10, background: bg,
              border: `1px solid ${border}`,
              fontSize: 12, color: text, lineHeight: 1.7,
            }}>
              {suggestion.aiReasoning}
            </div>
          </div>

          {/* Actions */}
          {suggestion.status === "pending" && suggestion.actions.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
                Available Actions
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {suggestion.actions.map((action, i) => {
                  const isPrimary = i === 0;
                  const isThisLoading = applyingAction === action.type;
                  const anyLoading = !!applyingAction;
                  return (
                    <button
                      key={action.label}
                      onClick={() => !anyLoading && onApply(suggestion, action.type, action.payload)}
                      disabled={anyLoading}
                      style={{
                        padding: "10px 16px", borderRadius: 10,
                        border: isPrimary ? "none" : `1px solid ${border}`,
                        background: isPrimary
                          ? (isThisLoading ? "#9e7de0" : theme.colors.primary)
                          : "transparent",
                        color: isPrimary ? "#fff" : text,
                        fontWeight: 600, fontSize: 13,
                        cursor: anyLoading ? "not-allowed" : "pointer",
                        opacity: anyLoading && !isThisLoading ? 0.45 : 1,
                        textAlign: "left", transition: "opacity 0.15s",
                        display: "flex", alignItems: "center", gap: 8,
                      }}
                      onMouseEnter={e => {
                        if (!anyLoading) (e.currentTarget as HTMLButtonElement).style.opacity = "0.85";
                      }}
                      onMouseLeave={e => {
                        if (!anyLoading) (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                      }}
                    >
                      <span style={{ fontSize: 15 }}>
                        {isThisLoading ? "⏳" :
                         action.type === "generate-test" ? "🧪" :
                         action.type === "heal" ? "🩹" :
                         action.type === "rewrite" ? "✏️" :
                         action.type === "regenerate" ? "♻️" :
                         action.type === "refactor" ? "🔧" : "⚡"}
                      </span>
                      {isThisLoading
                        ? (ACTION_IN_PROGRESS[action.type] ?? "Working…")
                        : action.label}
                    </button>
                  );
                })}
              </div>

              {/* Status message while loading */}
              {applyingAction && (
                <div style={{
                  marginTop: 10, padding: "10px 14px", borderRadius: 8,
                  background: `${theme.colors.primary}15`,
                  border: `1px solid ${theme.colors.primary}33`,
                  fontSize: 12, color: theme.colors.primary, fontWeight: 500,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span style={{ fontSize: 14 }}>⏳</span>
                  {ACTION_IN_PROGRESS[applyingAction] ?? "Processing…"} Please wait.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {suggestion.status === "pending" && (
          <div style={{
            padding: "14px 20px",
            borderTop: `1px solid ${border}`,
            flexShrink: 0,
          }}>
            <button
              onClick={() => onDismiss(suggestion)}
              style={{
                width: "100%", padding: "9px 0", borderRadius: 10,
                border: `1px solid ${border}`, background: "transparent",
                color: textLight, fontWeight: 500, fontSize: 13, cursor: "pointer",
                transition: "background 0.12s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  isDark ? "#2a2a3a" : "#f5f5f8";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              Dismiss Suggestion
            </button>
          </div>
        )}
      </div>
    </>
  );
}
