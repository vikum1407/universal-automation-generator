import { useState } from "react";
import { theme } from "@/theme";
import type { TestItem } from "@/api/tests";
import { STATUS_COLOR, TYPE_COLOR } from "@/api/tests";

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      padding: "3px 9px", borderRadius: 7, fontSize: 11, fontWeight: 700,
      background: `${color}22`, color,
    }}>
      {label}
    </span>
  );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  const isDark = theme.mode === "dark";
  const textLight = isDark ? theme.colors.darkTextLight : theme.colors.textLight;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: textLight }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{value}%</span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: isDark ? "#333" : "#eee" }}>
        <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 3, transition: "width 0.4s" }} />
      </div>
    </div>
  );
}

interface ActionBtn {
  label: string;
  icon: string;
  action: string;
  primary?: boolean;
  danger?: boolean;
  loadingLabel: string;
}

const ACTIONS: ActionBtn[] = [
  { label: "Run Test", icon: "▶", action: "run", primary: true, loadingLabel: "Running…" },
  { label: "Auto-Heal", icon: "🩹", action: "heal", loadingLabel: "Healing test…" },
  { label: "Regenerate", icon: "♻️", action: "regenerate", loadingLabel: "Regenerating…" },
];

interface Props {
  test: TestItem | null;
  actionLoadingId: string | null;
  onClose: () => void;
  onAction: (test: TestItem, action: string) => void;
}

export default function TestDeepView({ test, actionLoadingId, onClose, onAction }: Props) {
  const [showCode, setShowCode] = useState(false);

  if (!test) return null;

  const isDark = theme.mode === "dark";
  const surface = isDark ? theme.colors.darkSurface : theme.colors.background;
  const border = isDark ? theme.colors.darkBorder : theme.colors.border;
  const text = isDark ? theme.colors.darkText : theme.colors.textDark;
  const textLight = isDark ? theme.colors.darkTextLight : theme.colors.textLight;
  const bg = isDark ? theme.colors.darkBackground : "#f5f5f8";
  const codeBg = isDark ? "#0d0d1a" : "#fff";

  const statusColor = STATUS_COLOR[test.status];
  const typeColor = TYPE_COLOR[test.type] ?? "#888";
  const stabilityColor = test.stabilityScore >= 75 ? "#66BB6A" :
    test.stabilityScore >= 50 ? "#FFA726" : "#EF5350";
  const riskColor = test.riskScore >= 75 ? "#EF5350" :
    test.riskScore >= 50 ? "#FFA726" : "#66BB6A";

  const isLoading = !!actionLoadingId;

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.2)" }} />

      {/* Panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: 440, zIndex: 50,
        background: surface, borderLeft: `1px solid ${border}`,
        display: "flex", flexDirection: "column",
        boxShadow: "-4px 0 28px rgba(0,0,0,0.12)",
        overflowY: "auto",
      }}>

        {/* Header */}
        <div style={{ padding: "16px 20px 12px", borderBottom: `1px solid ${border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              <Badge label={test.type.toUpperCase()} color={typeColor} />
              <Badge label={test.status.toUpperCase()} color={statusColor} />
            </div>
            <button onClick={onClose} style={{
              border: "none", background: "transparent",
              cursor: "pointer", fontSize: 17, color: textLight, padding: "2px 6px",
            }}>✕</button>
          </div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: theme.colors.primary, lineHeight: 1.4 }}>
            {test.name}
          </h3>
          <div style={{ fontSize: 11, color: textLight, marginTop: 4, fontFamily: "monospace" }}>
            {test.fileName}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Scores */}
          <div style={{ padding: "14px 16px", borderRadius: 10, background: bg }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
              Health Scores
            </div>
            <ScoreBar label="Stability" value={test.stabilityScore} color={stabilityColor} />
            <ScoreBar label="Risk" value={test.riskScore} color={riskColor} />
          </div>

          {/* Metadata grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
            {[
              { label: "Assertions", value: test.assertionCount },
              { label: "Lines of Code", value: test.linesOfCode },
              { label: "Selectors", value: test.selectorCount },
              { label: "AI Suggestions", value: test.aiSuggestions },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: "10px 12px", borderRadius: 8, background: bg }}>
                <div style={{ fontSize: 10, color: textLight, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: theme.colors.primary, marginTop: 2 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Linked requirements */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
              Linked Requirements ({test.requirements.length})
            </div>
            {test.requirements.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {test.requirements.map((req, i) => (
                  <div key={i} style={{
                    padding: "8px 12px", borderRadius: 8, background: bg,
                    border: `1px solid ${border}`, fontSize: 12, color: text,
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <span style={{ fontSize: 12 }}>📋</span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{req}</span>
                  </div>
                ))}
              </div>
            ) : (
              <span style={{ fontSize: 12, color: textLight, fontStyle: "italic" }}>
                No requirements linked — run AI Analysis to map coverage.
              </span>
            )}
          </div>

          {/* Endpoint */}
          {test.endpoint && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
                API Endpoint
              </div>
              <div style={{
                padding: "8px 12px", borderRadius: 8, background: bg,
                border: `1px solid ${border}`, fontSize: 12, fontFamily: "monospace", color: text,
              }}>
                {test.endpoint}
              </div>
            </div>
          )}

          {/* Last run */}
          {test.lastRun && (
            <div style={{ fontSize: 12, color: textLight }}>
              Last run: {new Date(test.lastRun).toLocaleString()}
            </div>
          )}

          {/* Code viewer */}
          <div>
            <button
              onClick={() => setShowCode(v => !v)}
              style={{
                padding: "8px 14px", borderRadius: 8,
                border: `1px solid ${border}`, background: "transparent",
                color: text, fontSize: 12, fontWeight: 600,
                cursor: "pointer", width: "100%", textAlign: "left",
                display: "flex", justifyContent: "space-between",
              }}
            >
              <span>📄 View Test Code</span>
              <span>{showCode ? "▲" : "▼"}</span>
            </button>
            {showCode && (
              <pre style={{
                marginTop: 8, padding: "12px 14px", borderRadius: 10,
                background: codeBg, border: `1px solid ${border}`,
                fontSize: 11, color: text, overflowX: "auto",
                whiteSpace: "pre-wrap", maxHeight: 300, lineHeight: 1.6,
              }}>
                {test.content}
              </pre>
            )}
          </div>

          {/* Actions */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
              Actions
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ACTIONS.map(action => {
                const isThisLoading = actionLoadingId === `${test.id}-${action.action}`;
                return (
                  <button
                    key={action.action}
                    onClick={() => !isLoading && onAction(test, action.action)}
                    disabled={isLoading}
                    style={{
                      padding: "10px 16px", borderRadius: 10,
                      border: action.primary ? "none" : `1px solid ${border}`,
                      background: action.primary
                        ? (isThisLoading ? "#9e7de0" : theme.colors.primary)
                        : "transparent",
                      color: action.primary ? "#fff" : text,
                      fontWeight: 600, fontSize: 13,
                      cursor: isLoading ? "not-allowed" : "pointer",
                      opacity: isLoading && !isThisLoading ? 0.4 : 1,
                      display: "flex", alignItems: "center", gap: 8,
                      transition: "opacity 0.15s",
                    }}
                  >
                    <span>{isThisLoading ? "⏳" : action.icon}</span>
                    {isThisLoading ? action.loadingLabel : action.label}
                  </button>
                );
              })}
            </div>

            {isLoading && (
              <div style={{
                marginTop: 10, padding: "9px 12px", borderRadius: 8,
                background: `${theme.colors.primary}15`,
                border: `1px solid ${theme.colors.primary}33`,
                fontSize: 12, color: theme.colors.primary, fontWeight: 500,
              }}>
                ⏳ Processing… please wait.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
