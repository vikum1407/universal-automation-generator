import { theme } from "@/theme";
import type { RTMRequirementView } from "@/api/rtm";

export default function RTMTableRow({
  req,
  idx,
  onRegenerate
}: {
  req: RTMRequirementView;
  idx: number;
  onRegenerate: () => void;
}) {
  const surface =
    theme.mode === "dark" ? theme.colors.darkSurface : theme.colors.background;

  const border =
    theme.mode === "dark" ? theme.colors.darkBorder : theme.colors.border;

  const text =
    theme.mode === "dark" ? theme.colors.darkText : theme.colors.textDark;

  const textLight =
    theme.mode === "dark" ? theme.colors.darkTextLight : theme.colors.textLight;

  const baseBg =
    idx % 2 === 0
      ? surface
      : theme.mode === "dark"
      ? "#1A1A1A"
      : "#FAF7FF";

  const pageName = req.source?.pageName || "—";

  return (
    <tr
      style={{
        background: baseBg,
        transition: "background 0.15s ease"
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLTableRowElement).style.background =
          theme.mode === "dark" ? "#2A2A2A" : "#F0E8FF";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLTableRowElement).style.background = baseBg;
      }}
    >
      {/* ID */}
      <td style={{ padding: 12, borderBottom: `1px solid ${border}`, color: text }}>
        {req.id}
      </td>

      {/* Title + Description */}
      <td style={{ padding: 12, borderBottom: `1px solid ${border}`, color: text }}>
        <div style={{ fontWeight: 600 }}>{req.title}</div>
        {req.description && (
          <div style={{ fontSize: 12, color: textLight }}>{req.description}</div>
        )}
      </td>

      {/* Type */}
      <td style={{ padding: 12, borderBottom: `1px solid ${border}`, color: text }}>
        {req.type?.toUpperCase?.() || "—"}
      </td>

      {/* Page Name */}
      <td style={{ padding: 12, borderBottom: `1px solid ${border}`, color: text }}>
        {pageName}
      </td>

      {/* Tags */}
      <td style={{ padding: 12, borderBottom: `1px solid ${border}`, color: text }}>
        {req.tags?.length ? req.tags.join(", ") : "—"}
      </td>

      {/* Priority */}
      <td style={{ padding: 12, borderBottom: `1px solid ${border}`, color: text }}>
        {req.businessPriority || "—"}
      </td>

      {/* Risk */}
      <td style={{ padding: 12, borderBottom: `1px solid ${border}`, color: text }}>
        {req.riskLevel || "—"}
      </td>

      {/* Regenerate */}
      <td style={{ padding: 12, borderBottom: `1px solid ${border}` }}>
        <button
          onClick={onRegenerate}
          style={{
            padding: "4px 10px",
            borderRadius: theme.radii.sm,
            background: theme.colors.secondary,
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontSize: 12
          }}
        >
          Regenerate
        </button>
      </td>
    </tr>
  );
}
