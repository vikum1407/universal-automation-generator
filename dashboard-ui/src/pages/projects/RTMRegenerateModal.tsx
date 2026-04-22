import { theme } from "@/theme";

export default function RTMRegenerateModal({
  open,
  onClose,
  onRegenerate,
  requirement
}: {
  open: boolean;
  onClose: () => void;
  onRegenerate: (reqId: string) => void;
  requirement: { id: string; title: string } | null;
}) {
  if (!open || !requirement) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999
      }}
    >
      <div
        style={{
          width: 420,
          padding: theme.spacing.lg,
          borderRadius: theme.radii.md,
          background: theme.colors.background,
          border: `1px solid ${theme.colors.border}`,
          boxShadow: theme.shadow.card,
          display: "flex",
          flexDirection: "column",
          gap: theme.spacing.md
        }}
      >
        <h3 style={{ margin: 0, color: theme.colors.primary }}>
          Regenerate Tests
        </h3>

        <p style={{ margin: 0, color: theme.colors.textDark, fontSize: 14 }}>
          AI will regenerate tests for:
        </p>

        <div
          style={{
            padding: "10px 12px",
            borderRadius: theme.radii.sm,
            background: theme.colors.background,
            border: `1px solid ${theme.colors.border}`,
            fontSize: 14,
            color: theme.colors.text
          }}
        >
          {requirement.id} — {requirement.title}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button
            onClick={onClose}
            style={{
              padding: "6px 12px",
              borderRadius: theme.radii.sm,
              border: `1px solid ${theme.colors.border}`,
              background: "transparent",
              color: theme.colors.textDark,
              cursor: "pointer"
            }}
          >
            Cancel
          </button>

          <button
            onClick={() => onRegenerate(requirement.id)}
            style={{
              padding: "6px 12px",
              borderRadius: theme.radii.sm,
              background: theme.colors.secondary,
              color: "#fff",
              cursor: "pointer",
              border: "none"
            }}
          >
            Regenerate
          </button>
        </div>
      </div>
    </div>
  );
}
