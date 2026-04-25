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

      {/* CONTENT WRAPPER */}
      <div
        style={{
          flex: 1,
          minWidth: 0,          /* prevent flex child from overflowing its allocated width */
          position: "relative",
          zIndex: 10,
          overflow: "hidden"
        }}
      >
        {/* INNER SCROLL AREA */}
        <div
          style={{
            height: "100%",
            overflowY: "auto",
            overflowX: "hidden", /* clip horizontal overflow — each section scrolls internally */
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
