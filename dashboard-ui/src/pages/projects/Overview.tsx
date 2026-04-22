import { theme } from "@/theme";
import ErrorBoundary from "@/components/ErrorBoundary";
import CIStatus from "@/pages/projects/CIStatus";
import ProjectAnalytics from "@/pages/projects/ProjectAnalytics";
import { useState, useEffect } from "react";
import { socket } from "@/socket";
import ProgressModal from "@/components/ProgressModal";

interface OverviewProps {
  project: any;
  onUpdateProject: (data: any) => void;
}

export default function Overview({ project }: OverviewProps) {
  const isUI = project.type === "ui";

  const [progress, setProgress] = useState({
    open: false,
    percent: 0,
    step: "Starting…"
  });

  useEffect(() => {
    socket.emit("join", project.id);

    const statusHandler = (data: any) => {
      if (data.progressPercent === undefined) return;
      if (data.progressPercent === 0 && data.progressStep === "Starting…") return;

      setProgress({
        open: data.progressPercent < 100,
        percent: data.progressPercent,
        step: data.progressStep
      });
    };

    const progressHandler = (data: any) => {
      setProgress({
        open: true,
        percent: data.percent,
        step: data.step
      });
    };

    const eventHandler = () => {
      setProgress({
        open: false,
        percent: 100,
        step: "Completed"
      });
    };

    socket.on("project-status", statusHandler);
    socket.on("recrawl-progress", progressHandler);
    socket.on("recrawl-event", eventHandler);

    return () => {
      socket.off("project-status", statusHandler);
      socket.off("recrawl-progress", progressHandler);
      socket.off("recrawl-event", eventHandler);
    };
  }, [project.id]);

  const recrawl = async () => {
    setProgress({ open: true, percent: 0, step: "Starting…" });

    await fetch(`http://localhost:3000/projects/${project.id}/recrawl`, {
      method: "POST"
    });
  };

  const surface =
    theme.mode === "dark" ? theme.colors.darkSurface : theme.colors.background;

  const border =
    theme.mode === "dark" ? theme.colors.darkBorder : theme.colors.border;

  const text =
    theme.mode === "dark" ? theme.colors.darkText : theme.colors.textDark;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: theme.spacing.xl }}>
      <ProgressModal open={progress.open} percent={progress.percent} step={progress.step} />

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: theme.spacing.lg,
          alignItems: "flex-start"
        }}
      >
        <div style={{ flex: "1 1 260px", minWidth: 260 }}>
          <input
            defaultValue={project.name}
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: theme.colors.primary,
              background: "transparent",
              border: "none",
              outline: "none",
              marginBottom: "4px"
            }}
            readOnly
          />

          <CIStatus projectId={project.id} />

          {isUI && (
            <button
              onClick={recrawl}
              style={{
                marginTop: theme.spacing.md,
                padding: "8px 14px",
                borderRadius: theme.radii.md,
                background: theme.colors.primary,
                color: "white",
                border: "none",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Re‑Crawl Project
            </button>
          )}
        </div>

        <div
          style={{
            flex: "1 1 260px",
            minWidth: 260,
            padding: "20px",
            borderRadius: "12px",
            background: surface,
            border: `1px solid ${border}`
          }}
        >
          <h3 style={{ color: theme.colors.secondary }}>Base URL</h3>
          <input
            defaultValue={isUI ? project.url : project.swaggerUrl}
            style={{
              width: "100%",
              marginTop: 6,
              padding: "8px",
              borderRadius: theme.radii.md,
              border: `1px solid ${border}`,
              background: theme.mode === "dark" ? theme.colors.darkBackground : "#fff",
              color: text
            }}
            readOnly
          />

          <h3 style={{ color: theme.colors.secondary, marginTop: "16px" }}>
            Environment
          </h3>
          <p style={{ color: text }}>{project.env}</p>
        </div>
      </div>

      <ErrorBoundary>
        <ProjectAnalytics projectId={project.id} />
      </ErrorBoundary>
    </div>
  );
}
