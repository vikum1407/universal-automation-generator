import { theme } from "../../../../theme";

export type TabId =
  | "overview"
  | "flows"
  | "rtm"
  | "coverage"
  | "suggestions"
  | "tests"
  | "autoheal"
  | "replay"
  | "settings";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "flows", label: "Flows / Endpoints" },
  { id: "rtm", label: "RTM" },
  { id: "coverage", label: "Coverage" },
  { id: "suggestions", label: "Suggestions" },
  { id: "tests", label: "Tests" },
  { id: "autoheal", label: "Auto‑Heal" },
  { id: "replay", label: "Replay" },
  { id: "settings", label: "Settings" }
];

export default function ProjectSidebar({
  project,
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed
}: {
  project: any;
  activeTab: TabId;
  setActiveTab: (t: TabId) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}) {
  const bg = theme.mode === "dark" ? theme.colors.darkBackground : theme.colors.background;
  const border = theme.mode === "dark" ? theme.colors.darkBorder : theme.colors.border;
  const text = theme.mode === "dark" ? theme.colors.darkText : theme.colors.textDark;
  const textLight = theme.mode === "dark" ? theme.colors.darkTextLight : theme.colors.textLight;

  return (
    <div
      style={{
        width: collapsed ? "64px" : "220px",
        transition: "width 0.2s ease",
        borderRight: `1px solid ${border}`,
        background: bg,
        padding: collapsed ? "12px 8px" : "16px 12px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing.md,
        position: "relative",
        zIndex: 5
      }}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          alignSelf: collapsed ? "center" : "flex-end",
          marginBottom: theme.spacing.sm,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          color: textLight,
          fontSize: "18px"
        }}
      >
        {collapsed ? "»" : "«"}
      </button>

      {!collapsed && (
        <div style={{ marginBottom: theme.spacing.sm }}>
          <div
            style={{
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: textLight,
              marginBottom: "4px"
            }}
          >
            Project
          </div>
          <div style={{ fontWeight: 600, color: theme.colors.primary }}>
            {project.type.toUpperCase()}
          </div>
          <div style={{ fontSize: "12px", color: textLight }}>
            {project.type === "ui" ? project.url : project.swaggerUrl}
          </div>
        </div>
      )}

      <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {TABS.map(tab => {
          const active = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                border: "none",
                textAlign: collapsed ? "center" : "left",
                padding: collapsed ? "8px 6px" : "10px 12px",
                borderRadius: theme.radii.md,
                background: active
                  ? theme.mode === "dark"
                    ? "#2A1A40"
                    : "#EDE4FF"
                  : "transparent",
                color: active ? theme.colors.primary : text,
                fontWeight: active ? 600 : 500,
                cursor: "pointer",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                justifyContent: collapsed ? "center" : "flex-start",
                position: "relative"
              }}
            >
              {active && !collapsed && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: "3px",
                    background: theme.colors.primary,
                    borderRadius: "2px"
                  }}
                />
              )}

              {collapsed ? tab.label[0] : tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
