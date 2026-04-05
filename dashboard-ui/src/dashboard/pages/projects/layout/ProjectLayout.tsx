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
        background: theme.colors.appBackground
      }}
    >
      {sidebar}

      <div
        style={{
          flex: 1,
          padding: theme.spacing.xl,
          boxSizing: "border-box",
          overflowY: "auto"
        }}
      >
        {content}
      </div>
    </div>
  );
}
