import { theme } from "@/theme";
import type { RTMRequirement } from "@/api/rtm";

const RISK_COLOR: Record<string, string> = {
  critical: "#EF5350", high: "#FF7043", medium: "#FFA726", low: "#66BB6A",
};
const PRIORITY_COLOR: Record<string, string> = {
  critical: "#EF5350", high: "#FF7043", medium: "#FFA726", low: "#66BB6A",
};
const TYPE_COLOR: Record<string, string> = {
  api: "#448AFF", ui: "#9C27B0", hybrid: "#FF7043",
  performance: "#00BCD4", security: "#EF5350", business: "#66BB6A",
};
const METHOD_COLOR: Record<string, string> = {
  GET: "#00C853", POST: "#448AFF", PUT: "#FFA726", PATCH: "#AB47BC", DELETE: "#EF5350",
};

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{
      padding: "2px 9px", borderRadius: 6, fontSize: 11, fontWeight: 700,
      background: bg, color, display: "inline-block"
    }}>{label}</span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const isDark = theme.mode === "dark";
  const border = isDark ? theme.colors.darkBorder : theme.colors.border;
  const textLight = isDark ? theme.colors.darkTextLight : theme.colors.textLight;
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: 10, fontWeight: 700, color: textLight, textTransform: "uppercase",
        letterSpacing: "0.1em", marginBottom: 8, paddingBottom: 6,
        borderBottom: `1px solid ${border}`
      }}>{title}</div>
      {children}
    </div>
  );
}

export default function RTMDeepView({
  req,
  onClose,
  onRegenerate,
}: {
  req: RTMRequirement;
  onClose: () => void;
  onRegenerate: (id: string) => void;
}) {
  const isDark = theme.mode === "dark";
  const surface = isDark ? "#161622" : "#FAFAFA";
  const border = isDark ? theme.colors.darkBorder : theme.colors.border;
  const text = isDark ? theme.colors.darkText : theme.colors.textDark;
  const textLight = isDark ? theme.colors.darkTextLight : theme.colors.textLight;
  const codeBg = isDark ? "#0D0D1A" : "#F0F0F0";

  const riskColor = RISK_COLOR[req.riskLevel] ?? "#FFA726";
  const prioColor = PRIORITY_COLOR[req.businessPriority] ?? "#FFA726";
  const typeColor = TYPE_COLOR[req.type] ?? "#888";
  const isCovered = req.covered;

  return (
    <div style={{
      width: "100%",
      background: surface,
      display: "flex", flexDirection: "column",
      flex: 1,
      borderLeft: `1px solid ${border}`,
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 20px 12px",
        borderBottom: `1px solid ${border}`,
        display: "flex", alignItems: "flex-start", gap: 10,
        background: surface,
        position: "sticky", top: 0, zIndex: 2, flexShrink: 0,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
            <Badge
              label={req.type.toUpperCase()}
              color={typeColor}
              bg={`${typeColor}22`}
            />
            <Badge
              label={isCovered ? "✓ COVERED" : "✗ NOT COVERED"}
              color={isCovered ? "#000" : "#fff"}
              bg={isCovered ? "#00C853" : "#EF5350"}
            />
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: text, lineHeight: 1.4 }}>
            {req.title}
          </div>
          <div style={{ fontSize: 11, color: textLight, marginTop: 3 }}>{req.id}</div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: textLight, fontSize: 18, lineHeight: 1, flexShrink: 0, padding: 2
          }}
        >✕</button>
      </div>

      {/* Body */}
      <div style={{ padding: "16px 20px", flex: 1 }}>

        {/* Description */}
        {req.description && req.description !== req.title && (
          <Section title="Description">
            <p style={{ fontSize: 13, color: text, margin: 0, lineHeight: 1.6 }}>{req.description}</p>
          </Section>
        )}

        {/* Risk & Priority */}
        <Section title="Risk & Priority">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <div style={{ fontSize: 10, color: textLight, textTransform: "uppercase", letterSpacing: "0.06em" }}>Risk</div>
              <Badge
                label={`⚠ ${req.riskLevel.toUpperCase()}`}
                color={riskColor}
                bg={`${riskColor}22`}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <div style={{ fontSize: 10, color: textLight, textTransform: "uppercase", letterSpacing: "0.06em" }}>Priority</div>
              <Badge
                label={`⚡ ${req.businessPriority.toUpperCase()}`}
                color={prioColor}
                bg={`${prioColor}22`}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <div style={{ fontSize: 10, color: textLight, textTransform: "uppercase", letterSpacing: "0.06em" }}>AI Confidence</div>
              <Badge
                label={`${Math.round((req.aiLogic?.confidenceScore ?? 0.72) * 100)}%`}
                color={theme.colors.primary}
                bg={`${theme.colors.primary}22`}
              />
            </div>
          </div>
        </Section>

        {/* Source mapping */}
        {(req.source.endpointPath || req.source.pageName) && (
          <Section title="Source Mapping">
            {req.source.method && req.source.endpointPath && (
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <span style={{
                  padding: "2px 8px", borderRadius: 5, fontSize: 11, fontWeight: 700,
                  background: METHOD_COLOR[req.source.method] ?? "#888", color: "#000"
                }}>{req.source.method}</span>
                <code style={{ fontSize: 12, color: text, background: codeBg, padding: "2px 8px", borderRadius: 5 }}>
                  {req.source.endpointPath}
                </code>
              </div>
            )}
            {req.source.pageName && (
              <div style={{ fontSize: 12, color: textLight }}>
                📄 Page: <strong style={{ color: text }}>{req.source.pageName}</strong>
              </div>
            )}
            {req.source.swaggerRef && (
              <div style={{ fontSize: 12, color: textLight, marginTop: 4 }}>
                🔗 Swagger: <code style={{ fontSize: 11 }}>{req.source.swaggerRef}</code>
              </div>
            )}
          </Section>
        )}

        {/* Test coverage */}
        <Section title="Test Coverage">
          {isCovered ? (
            <div style={{
              padding: "8px 12px", borderRadius: 8, background: "#00C85318",
              border: "1px solid #00C85340", fontSize: 12
            }}>
              <div style={{ color: "#00C853", fontWeight: 700, marginBottom: 3 }}>✓ Covered</div>
              {req.specFile && (
                <code style={{ fontSize: 11, color: textLight }}>{req.specFile}</code>
              )}
            </div>
          ) : (
            <div style={{
              padding: "8px 12px", borderRadius: 8, background: "#EF535018",
              border: "1px solid #EF535040", fontSize: 12
            }}>
              <div style={{ color: "#EF5350", fontWeight: 700, marginBottom: 3 }}>✗ No test found</div>
              <div style={{ fontSize: 11, color: textLight }}>Generate a test to cover this requirement.</div>
            </div>
          )}
        </Section>

        {/* AI Logic */}
        {req.aiLogic?.steps?.length > 0 && (
          <Section title="Test Steps (AI Generated)">
            <ol style={{ margin: 0, paddingLeft: 18 }}>
              {req.aiLogic.steps.map((step, i) => (
                <li key={i} style={{ fontSize: 12, color: text, marginBottom: 4, lineHeight: 1.5 }}>
                  {step}
                </li>
              ))}
            </ol>
          </Section>
        )}

        {req.aiLogic?.assertions?.length > 0 && (
          <Section title="Assertions">
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {req.aiLogic.assertions.map((a, i) => (
                <li key={i} style={{ fontSize: 12, color: text, marginBottom: 3, lineHeight: 1.5 }}>
                  {a}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {req.aiLogic?.negativeTests?.length > 0 && (
          <Section title="Negative Test Scenarios">
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {req.aiLogic.negativeTests.map((n, i) => (
                <li key={i} style={{ fontSize: 12, color: "#EF5350", marginBottom: 3, lineHeight: 1.5 }}>
                  {n}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {req.aiLogic?.reasoning && (
          <Section title="AI Reasoning">
            <p style={{ fontSize: 12, color: textLight, margin: 0, lineHeight: 1.6, fontStyle: "italic" }}>
              {req.aiLogic.reasoning}
            </p>
          </Section>
        )}

        {/* Tags */}
        {req.tags?.length > 0 && (
          <Section title="Tags">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {req.tags.map((t, i) => (
                <span key={i} style={{
                  padding: "2px 9px", borderRadius: 10, fontSize: 11,
                  background: isDark ? "#2A1A40" : "#EDE4FF", color: theme.colors.primary
                }}>{t}</span>
              ))}
            </div>
          </Section>
        )}

        {/* Change history */}
        {req.history?.length > 0 && (
          <Section title="Change History">
            <div style={{ position: "relative", paddingLeft: 16 }}>
              <div style={{
                position: "absolute", left: 5, top: 0, bottom: 0,
                width: 2, background: border
              }} />
              {req.history.slice().reverse().map((h, i) => (
                <div key={i} style={{ marginBottom: 10, position: "relative" }}>
                  <div style={{
                    position: "absolute", left: -12, top: 4,
                    width: 8, height: 8, borderRadius: "50%",
                    background: theme.colors.primary
                  }} />
                  <div style={{ fontSize: 11, color: textLight }}>
                    {new Date(h.timestamp).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 12, color: text, fontWeight: 500 }}>
                    {h.change.replace(/_/g, " ")}
                    {h.actor && <span style={{ color: textLight }}> · {h.actor}</span>}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* Footer action */}
      <div style={{
        padding: "12px 20px", borderTop: `1px solid ${border}`,
        background: surface, marginTop: "auto", flexShrink: 0,
      }}>
        <button
          onClick={() => onRegenerate(req.id)}
          style={{
            width: "100%", padding: "9px 0", borderRadius: 10,
            background: theme.colors.primary, color: "#fff", border: "none",
            fontWeight: 700, fontSize: 13, cursor: "pointer",
            transition: "opacity 0.15s"
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
        >
          Regenerate Tests for this Requirement
        </button>
      </div>
    </div>
  );
}
