import { theme } from "../../../../theme";

export default function ProjectLayout({
  sidebar,
  content
}: {
  sidebar: React.ReactNode;
  content: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        minHeight: "100vh",
        background: theme.colors.appBackground,
        position: "relative"
      }}
    >
      {/* SIDEBAR */}
      <div
        style={{
          position: "relative",
          zIndex: 5
        }}
      >
        {sidebar}
      </div>

      {/* CONTENT WRAPPER — overflow visible so tooltips can escape */}
      <div
        style={{
          flex: 1,
          position: "relative",
          zIndex: 10,
          overflow: "visible"
        }}
      >
        {/* INNER SCROLL AREA */}
        <div
          style={{
            height: "100%",
            overflowY: "auto",
            padding: theme.spacing.xl,
            boxSizing: "border-box"
          }}
        >
          {content}
        </div>
      </div>
    </div>
  );
}
