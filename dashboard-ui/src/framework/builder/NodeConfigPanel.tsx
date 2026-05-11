import type { StyleTokens } from "../nodes/types";
import { CATEGORY_META } from "../nodes/types";
import { useBuilderState } from "./useBuilderState";
import { useFramework } from "../context/FrameworkContext";

interface NodeConfigPanelProps {
  S: StyleTokens;
}

export function NodeConfigPanel({ S }: NodeConfigPanelProps) {
  const { getSelectedInstance, updateConfig } = useBuilderState();
  const { result } = useFramework();
  const instance = getSelectedInstance();

  const nodeLabelMap = new Map<string, string>(
    (result?.nodes ?? []).map(n => [n.id, n.label])
  );

  if (!instance) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", height: "100%", gap: 10,
        color: S.textDim, padding: 24, textAlign: "center",
      }}>
        <div style={{ fontSize: 28, opacity: 0.3 }}>⚙</div>
        <div style={{ fontSize: 12, lineHeight: 1.5 }}>
          Click a node in the canvas to configure it
        </div>
      </div>
    );
  }

  const meta   = CATEGORY_META[instance.category];
  const color  = meta?.color ?? "#6B7280";
  const schema = instance.configSchema ?? {};

  const handleChange = (key: string, value: any) => {
    updateConfig(instance.instanceId, { ...instance.config, [key]: value });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* Header */}
      <div style={{
        padding: "16px 18px 12px",
        borderBottom: `1px solid ${S.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: S.text }}>{instance.nodeLabel}</span>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, color,
          background: `${color}15`, borderRadius: 4, padding: "2px 7px",
          textTransform: "uppercase", letterSpacing: "0.06em",
        }}>
          {meta?.label ?? instance.category}
        </span>
      </div>

      {/* Config fields */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px" }}>

        {Object.keys(schema).length === 0 ? (
          <div style={{ fontSize: 12, color: S.textMuted, fontStyle: "italic" }}>
            No configuration options for this node.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {Object.entries(schema).map(([key, field]: [string, any]) => (
              <div key={key}>
                <label style={{
                  display: "block", fontSize: 11, fontWeight: 600,
                  color: S.textMuted, marginBottom: 5, textTransform: "capitalize",
                }}>
                  {field.label ?? key}
                  {field.required && <span style={{ color: "#EF4444", marginLeft: 3 }}>*</span>}
                </label>

                {field.type === "enum" ? (
                  <select
                    value={instance.config[key] ?? field.default ?? ""}
                    onChange={e => handleChange(key, e.target.value)}
                    style={{
                      width: "100%", padding: "7px 10px", borderRadius: 8,
                      border: `1px solid ${S.border}`, background: S.bg,
                      color: S.text, fontSize: 12, cursor: "pointer",
                    }}
                  >
                    {(field.options as string[]).map((opt: string) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : field.type === "boolean" ? (
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={!!(instance.config[key] ?? field.default)}
                      onChange={e => handleChange(key, e.target.checked)}
                      style={{ width: 14, height: 14, accentColor: color, cursor: "pointer" }}
                    />
                    <span style={{ fontSize: 12, color: S.textMuted }}>{field.description ?? "Enable"}</span>
                  </label>
                ) : field.type === "number" ? (
                  <input
                    type="number"
                    value={instance.config[key] ?? field.default ?? ""}
                    onChange={e => handleChange(key, Number(e.target.value))}
                    style={{
                      width: "100%", padding: "7px 10px", borderRadius: 8,
                      border: `1px solid ${S.border}`, background: S.bg,
                      color: S.text, fontSize: 12, boxSizing: "border-box",
                    }}
                  />
                ) : (
                  <input
                    type="text"
                    value={instance.config[key] ?? field.default ?? ""}
                    onChange={e => handleChange(key, e.target.value)}
                    placeholder={field.default ?? ""}
                    style={{
                      width: "100%", padding: "7px 10px", borderRadius: 8,
                      border: `1px solid ${S.border}`, background: S.bg,
                      color: S.text, fontSize: 12, boxSizing: "border-box",
                    }}
                  />
                )}

                {field.description && field.type !== "boolean" && (
                  <div style={{ fontSize: 10, color: S.textDim, marginTop: 3 }}>
                    {field.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Conflicts + requires */}
        {instance.conflicts.length > 0 && (
          <div style={{
            marginTop: 20, padding: "8px 10px", borderRadius: 8,
            background: "#EF444412", border: "1px solid #EF444430",
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#EF4444", marginBottom: 4 }}>
              Conflicts with
            </div>
            {instance.conflicts.map(c => (
              <div key={c} style={{ fontSize: 10, color: "#EF4444", opacity: 0.8 }}>
                • {nodeLabelMap.get(c) ?? c}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
