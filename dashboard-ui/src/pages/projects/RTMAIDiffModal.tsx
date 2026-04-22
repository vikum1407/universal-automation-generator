import { theme } from "@/theme";

export default function RTMAIDiffModal({
  open,
  onClose,
  beforeText,
  afterText
}: {
  open: boolean;
  onClose: () => void;
  beforeText: string;
  afterText: string;
}) {
  if (!open) return null;

  const modalBg =
    theme.mode === "dark" ? "rgba(0,0,0,0.65)" : "rgba(0,0,0,0.45)";

  const surface =
    theme.mode === "dark" ? theme.colors.darkSurface : theme.colors.background;

  const border =
    theme.mode === "dark" ? theme.colors.darkBorder : theme.colors.border;

  const text =
    theme.mode === "dark" ? theme.colors.darkText : theme.colors.textDark;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: modalBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999
      }}
    >
      <div
        style={{
          width: "80%",
          height: "80%",
          background: surface,
          borderRadius: 12,
          border: `1px solid ${border}`,
          boxShadow: theme.shadow.card,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            padding: 16,
            borderBottom: `1px solid ${border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: text,
            fontWeight: 600
          }}
        >
          AI Diff — Before vs After
          <button
            onClick={onClose}
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
            Close
          </button>
        </div>

        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            overflow: "hidden"
          }}
        >
          {/* BEFORE */}
          <div
            style={{
              borderRight: `1px solid ${border}`,
              padding: 16,
              overflowY: "auto",
              whiteSpace: "pre-wrap",
              fontFamily: "monospace",
              fontSize: 13,
              color: text
            }}
          >
            {beforeText}
          </div>

          {/* AFTER */}
          <div
            style={{
              padding: 16,
              overflowY: "auto",
              whiteSpace: "pre-wrap",
              fontFamily: "monospace",
              fontSize: 13,
              color: text
            }}
          >
            {afterText}
          </div>
        </div>
      </div>
    </div>
  );
}
