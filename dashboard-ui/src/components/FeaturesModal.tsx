import { theme } from "@/theme";

export default function FeaturesModal({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 420,
          padding: 24,
          borderRadius: theme.radii.lg,
          background: theme.colors.background,
          border: `1px solid ${theme.colors.border}`,
          boxShadow: theme.shadow.card
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: 16, color: theme.colors.primary }}>
          What’s Included
        </h2>

        <ul style={{ lineHeight: "1.6", fontSize: 14 }}>
          <li>Self‑Updating Selectors — automatic healing of broken UI selectors.</li>
          <li>AI Test Refactoring — AI‑powered test cleanup and optimization.</li>
          <li>Cloud Sync — sync artifacts, analytics, and crawl data.</li>
        </ul>

        <button
          onClick={onClose}
          style={{
            marginTop: 20,
            padding: "10px 16px",
            background: theme.colors.primary,
            color: "#fff",
            border: "none",
            borderRadius: theme.radii.md,
            cursor: "pointer",
            fontWeight: 600,
            width: "100%"
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
