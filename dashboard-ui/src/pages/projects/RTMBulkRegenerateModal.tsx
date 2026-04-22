import { theme } from "@/theme";

export default function RTMBulkRegenerateModal({
  open,
  onClose,
  onConfirm
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  const bg =
    theme.mode === "dark" ? "rgba(0,0,0,0.65)" : "rgba(0,0,0,0.45)";

  const surface =
    theme.mode === "dark" ? theme.colors.darkSurface : theme.colors.background;

  const border =
    theme.mode === "dark" ? theme.colors.darkBorder : theme.colors.border;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999
      }}
    >
      <div
        style={{
          width: 380,
          padding: 24,
          borderRadius: 12,
          background: surface,
          border: `1px solid ${border}`,
          boxShadow: theme.shadow.card,
          display: "flex",
          flexDirection: "column",
          gap: 16
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 600, color: theme.colors.primary }}>
          Regenerate All Tests
        </div>

        <div style={{ fontSize: 14, color: theme.colors.textDark }}>
          This will regenerate **all requirements and all tests** using AI.
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: theme.radii.sm,
              background: theme.colors.border,
              color: theme.colors.textDark,
              border: "none",
              cursor: "pointer"
            }}
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: theme.radii.sm,
              background: theme.colors.secondary,
              color: "#fff",
              border: "none",
              cursor: "pointer"
            }}
          >
            Regenerate All
          </button>
        </div>
      </div>
    </div>
  );
}
