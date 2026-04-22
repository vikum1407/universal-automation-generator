import { theme } from "@/theme";

export default function RTMSidebar({
  active,
  onSelect,
  onBulkRegenerate
}: {
  active: string;
  onSelect: (key: string) => void;
  onBulkRegenerate: () => void;
}) {
  const items = [
    { key: "overview", label: "Overview" },
    { key: "insights", label: "Insights" },
    { key: "requirements", label: "Requirements" },
    { key: "tests", label: "Tests" },
    { key: "coverage", label: "Coverage" },
    { key: "timeline", label: "Timeline" },
    { key: "ai", label: "AI Suggestions" }
  ];

  return (
    <div
      style={{
        width: 220,
        padding: theme.spacing.md,
        borderRight: `1px solid ${theme.colors.border}`,
        background: theme.colors.background,
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing.md
      }}
    >
      {items.map((item) => {
        const isActive = active === item.key;

        return (
          <div
            key={item.key}
            onClick={() => onSelect(item.key)}
            style={{
              padding: "10px 12px",
              borderRadius: theme.radii.sm,
              cursor: "pointer",
              background: isActive
                ? theme.colors.secondary
                : "transparent",
              color: isActive ? "#fff" : theme.colors.textDark,
              fontWeight: isActive ? 600 : 400,
              transition: "0.15s"
            }}
          >
            {item.label}
          </div>
        );
      })}

      <button
        onClick={onBulkRegenerate}
        style={{
          marginTop: theme.spacing.lg,
          padding: "10px 12px",
          borderRadius: theme.radii.sm,
          background: theme.colors.secondary,
          color: "#fff",
          border: "none",
          cursor: "pointer",
          fontSize: 14
        }}
      >
        Regenerate All Tests
      </button>
    </div>
  );
}
