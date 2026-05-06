import { useState } from "react";
import type { StyleTokens } from "../nodes/types";
import { useBlueprint } from "./useBlueprint";
import { validateBlueprint } from "../api/framework";

interface BlueprintPreviewProps {
  S: StyleTokens;
}

type ValidationStatus = "idle" | "valid" | "invalid" | "loading";

interface ValidationResult {
  valid: boolean;
  errors: Array<{ field: string; message: string; code: string }>;
  warnings: Array<{ field: string; message: string; code: string }>;
  suggestions: Array<{ field: string; message: string; code: string }>;
  summary: string;
}

export function BlueprintPreview({ S }: BlueprintPreviewProps) {
  const blueprint = useBlueprint();
  const [open,       setOpen]       = useState(false);
  const [status,     setStatus]     = useState<ValidationStatus>("idle");
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  const json = blueprint
    ? JSON.stringify(blueprint, null, 2)
    : "// Select a framework, language, and at least an architecture node to see the blueprint.";

  const handleValidate = async () => {
    if (!blueprint) return;
    setStatus("loading");
    try {
      const result = await validateBlueprint(blueprint);
      setValidation(result);
      setStatus(result.valid ? "valid" : "invalid");
    } catch {
      setStatus("invalid");
      setValidation(null);
    }
  };

  const statusMeta = {
    idle:    { color: S.textDim,  label: "Not validated" },
    loading: { color: "#F97316",  label: "Validating…"   },
    valid:   { color: "#10B981",  label: "Blueprint valid" },
    invalid: { color: "#EF4444",  label: "Has errors"     },
  };
  const sm = statusMeta[status];

  return (
    <div style={{
      borderTop: `1px solid ${S.border}`,
      background: S.card,
      flexShrink: 0,
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Toggle row */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "0 20px",
        height: 44, cursor: "pointer",
        borderBottom: open ? `1px solid ${S.border}` : "none",
      }}
        onClick={() => setOpen(v => !v)}
      >
        <span style={{ fontSize: 11, fontWeight: 800, color: S.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Blueprint Preview
        </span>
        <span style={{ fontSize: 10, color: sm.color, fontWeight: 600 }}>
          ● {sm.label}
        </span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          {blueprint && (
            <button
              onClick={e => { e.stopPropagation(); handleValidate(); }}
              disabled={status === "loading"}
              style={{
                fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 6,
                border: `1px solid ${S.accent}40`, background: `${S.accent}12`,
                color: S.accent, cursor: "pointer",
              }}
            >
              {status === "loading" ? "Validating…" : "Validate"}
            </button>
          )}
          <span style={{ color: S.textDim, fontSize: 12 }}>{open ? "▾" : "▸"}</span>
        </div>
      </div>

      {/* Content */}
      {open && (
        <div style={{ display: "flex", height: 280, overflow: "hidden" }}>

          {/* JSON panel */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px" }}>
            <pre style={{
              margin: 0, fontSize: 11, lineHeight: 1.7,
              color: blueprint ? S.text : S.textDim,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
              whiteSpace: "pre-wrap", wordBreak: "break-word",
            }}>
              {json}
            </pre>
          </div>

          {/* Validation panel */}
          {validation && (
            <div style={{
              width: 280, flexShrink: 0,
              borderLeft: `1px solid ${S.border}`,
              overflowY: "auto", padding: "14px 16px",
            }}>
              <div style={{
                fontSize: 11, fontWeight: 700, marginBottom: 12,
                color: validation.valid ? "#10B981" : "#EF4444",
              }}>
                {validation.valid ? "✓ Valid" : "✗ Invalid"} — {validation.summary}
              </div>

              {validation.errors.map((e, i) => (
                <div key={i} style={{
                  marginBottom: 8, padding: "8px 10px", borderRadius: 7,
                  background: "#EF444412", border: "1px solid #EF444430",
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#EF4444" }}>
                    {e.field} · {e.code}
                  </div>
                  <div style={{ fontSize: 10, color: "#EF4444", opacity: 0.85, marginTop: 2 }}>
                    {e.message}
                  </div>
                </div>
              ))}

              {validation.warnings.map((w, i) => (
                <div key={i} style={{
                  marginBottom: 8, padding: "8px 10px", borderRadius: 7,
                  background: "#F9731612", border: "1px solid #F9731630",
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#F97316" }}>
                    {w.field} · {w.code}
                  </div>
                  <div style={{ fontSize: 10, color: "#F97316", opacity: 0.85, marginTop: 2 }}>
                    {w.message}
                  </div>
                </div>
              ))}

              {validation.suggestions.map((s, i) => (
                <div key={i} style={{
                  marginBottom: 8, padding: "8px 10px", borderRadius: 7,
                  background: `${S.accentSoft}`, border: `1px solid ${S.accent}20`,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: S.accent }}>
                    {s.field}
                  </div>
                  <div style={{ fontSize: 10, color: S.accent, opacity: 0.85, marginTop: 2 }}>
                    {s.message}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
