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

export default function RTMTableRow({
  req,
  idx,
  isSelected,
  onSelect,
  onRegenerate,
}: {
  req: RTMRequirement;
  idx: number;
  isSelected: boolean;
  onSelect: () => void;
  onRegenerate: () => void;
}) {
  const isDark = theme.mode === "dark";
  const surface = isDark ? theme.colors.darkSurface : theme.colors.background;
  const border = isDark ? theme.colors.darkBorder : theme.colors.border;
  const text = isDark ? theme.colors.darkText : theme.colors.textDark;
  const textLight = isDark ? theme.colors.darkTextLight : theme.colors.textLight;

  const baseBg = isSelected
    ? (isDark ? "#2A1A40" : "#EDE4FF")
    : idx % 2 === 0
    ? surface
    : (isDark ? "#111118" : "#FAF7FF");

  const typeColor = TYPE_COLOR[req.type] ?? "#888";
  const riskColor = RISK_COLOR[req.riskLevel] ?? "#FFA726";
  const prioColor = PRIORITY_COLOR[req.businessPriority] ?? "#FFA726";
  const confidence = Math.round((req.aiLogic?.confidenceScore ?? 0.72) * 100);
  const confColor = confidence >= 80 ? "#00C853" : confidence >= 60 ? "#FFA726" : "#EF5350";

  return (
    <tr
      onClick={onSelect}
      style={{
        background: baseBg,
        cursor: "pointer",
        transition: "background 0.12s ease",
        borderLeft: isSelected ? `3px solid ${theme.colors.primary}` : "3px solid transparent",
      }}
      onMouseEnter={e => {
        if (!isSelected)
          (e.currentTarget as HTMLTableRowElement).style.background =
            isDark ? "#1E1E30" : "#F5EEFF";
      }}
      onMouseLeave={e => {
        if (!isSelected)
          (e.currentTarget as HTMLTableRowElement).style.background = baseBg;
      }}
    >

      {/* ID */}
      <td style={{ padding: "11px 12px", borderBottom: `1px solid ${border}` }}>
        <code style={{ fontSize: 11, color: theme.colors.primary, fontWeight: 700 }}>
          {req.id}
        </code>
      </td>

      {/* Title + description */}
      <td style={{ padding: "11px 12px", borderBottom: `1px solid ${border}`, maxWidth: 320 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: text, marginBottom: req.description ? 2 : 0 }}>
          {req.title}
        </div>
        {req.description && req.description !== req.title && (
          <div style={{
            fontSize: 11, color: textLight, overflow: "hidden",
            display: "-webkit-box", WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as any
          }}>
            {req.description}
          </div>
        )}
        {req.tags?.length > 0 && (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
            {req.tags.slice(0, 3).map((t, i) => (
              <span key={i} style={{
                padding: "1px 6px", borderRadius: 8, fontSize: 10,
                background: isDark ? "#2A1A40" : "#EDE4FF", color: theme.colors.primary
              }}>{t}</span>
            ))}
            {req.tags.length > 3 && (
              <span style={{ fontSize: 10, color: textLight }}>+{req.tags.length - 3}</span>
            )}
          </div>
        )}
      </td>

      {/* Type */}
      <td style={{ padding: "11px 12px", borderBottom: `1px solid ${border}` }}>
        <span style={{
          padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
          background: `${typeColor}22`, color: typeColor
        }}>
          {req.type.toUpperCase()}
        </span>
      </td>

      {/* Priority */}
      <td style={{ padding: "11px 12px", borderBottom: `1px solid ${border}` }}>
        <span style={{
          fontSize: 12, fontWeight: 600, color: prioColor, whiteSpace: "nowrap"
        }}>
          ⚡ {req.businessPriority}
        </span>
      </td>

      {/* Risk */}
      <td style={{ padding: "11px 12px", borderBottom: `1px solid ${border}` }}>
        <span style={{
          fontSize: 12, fontWeight: 600, color: riskColor, whiteSpace: "nowrap"
        }}>
          ⚠ {req.riskLevel}
        </span>
      </td>

      {/* Coverage */}
      <td style={{ padding: "11px 12px", borderBottom: `1px solid ${border}` }}>
        <span style={{
          padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
          background: req.covered ? "#00C85322" : "#EF535018",
          color: req.covered ? "#00C853" : "#EF5350"
        }}>
          {req.covered ? "✓ Covered" : "✗ Not Covered"}
        </span>
      </td>

      {/* AI Confidence */}
      <td style={{ padding: "11px 12px", borderBottom: `1px solid ${border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            width: 36, height: 6, borderRadius: 4, overflow: "hidden",
            background: isDark ? "#333" : "#eee"
          }}>
            <div style={{
              width: `${confidence}%`, height: "100%",
              background: confColor, transition: "width 0.4s ease"
            }} />
          </div>
          <span style={{ fontSize: 11, color: confColor, fontWeight: 600 }}>{confidence}%</span>
        </div>
      </td>

      {/* Actions */}
      <td
        style={{ padding: "11px 12px", borderBottom: `1px solid ${border}` }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={onRegenerate}
            style={{
              padding: "4px 10px", borderRadius: 7, border: "none",
              background: theme.colors.primary, color: "#fff",
              fontSize: 11, fontWeight: 600, cursor: "pointer",
              transition: "opacity 0.12s"
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.8"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
          >
            Regen
          </button>
          <button
            onClick={onSelect}
            style={{
              padding: "4px 10px", borderRadius: 7, cursor: "pointer",
              border: `1px solid ${border}`, background: "transparent",
              color: textLight, fontSize: 11, fontWeight: 600,
              transition: "all 0.12s"
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = theme.colors.primary;
              (e.currentTarget as HTMLButtonElement).style.color = theme.colors.primary;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = border;
              (e.currentTarget as HTMLButtonElement).style.color = textLight;
            }}
          >
            View →
          </button>
        </div>
      </td>
    </tr>
  );
}
