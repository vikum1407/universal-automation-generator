import { theme } from "@/theme";

export default function RTMExport({
  onExport
}: {
  onExport: (format: string) => void;
}) {
  const btn = {
    padding: "6px 12px",
    borderRadius: theme.radii.sm,
    background: theme.colors.secondary,
    color: "#fff",
    cursor: "pointer",
    border: "none",
    fontSize: 13
  };

  return (
    <div style={{ display: "flex", gap: theme.spacing.sm }}>
      <button style={btn} onClick={() => onExport("md")}>
        Export Markdown
      </button>

      <button style={btn} onClick={() => onExport("csv")}>
        Export CSV
      </button>

      <button style={btn} onClick={() => onExport("json")}>
        Export JSON
      </button>

      <button style={btn} onClick={() => onExport("pdf")}>
        Export PDF
      </button>
    </div>
  );
}
