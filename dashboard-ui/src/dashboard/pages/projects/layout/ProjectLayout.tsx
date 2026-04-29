import { useColors } from "@/hooks/useColors";
import { theme } from "../../../../theme";

export default function ProjectLayout({
  sidebar,
  content,
}: {
  sidebar: React.ReactNode;
  content: React.ReactNode;
}) {
  const { BG } = useColors();

  return (
    <div style={{
      display: "flex",
      height: "100%",
      minHeight: "100vh",
      background: BG,
      position: "relative",
      transition: "background 0.3s ease",
    }}>
      {/* SIDEBAR */}
      <div style={{ position: "relative", zIndex: 5 }}>
        {sidebar}
      </div>

      {/* CONTENT WRAPPER */}
      <div style={{
        flex: 1,
        minWidth: 0,
        position: "relative",
        zIndex: 10,
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          overflowY: "auto",
          overflowX: "hidden",
          padding: theme.spacing.xl,
          boxSizing: "border-box",
        }}>
          {content}
        </div>
      </div>
    </div>
  );
}
