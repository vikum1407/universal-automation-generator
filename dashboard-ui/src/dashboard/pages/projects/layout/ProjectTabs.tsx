import { theme } from "@/theme";
import ErrorBoundary from "@/components/ErrorBoundary";

import FlowGraph from "@/pages/projects/FlowGraph";
import EndpointExplorer from "@/pages/projects/EndpointExplorer";
import RTMTable from "@/pages/projects/RTMTable";
import CoverageHeatmap from "@/pages/projects/CoverageHeatmap";
import AISuggestions from "@/pages/projects/AISuggestions";
import TestRunner from "@/pages/projects/TestRunner";
import AutoHeal from "@/pages/projects/AutoHeal";
import ReplayViewer from "@/pages/projects/ReplayViewer";
import ReCrawl from "@/pages/projects/ReCrawl";
import CloudSync from "@/pages/projects/CloudSync";
import RefactorPanel from "@/pages/projects/RefactorPanel";
import CIStatus from "@/pages/projects/CIStatus";
import ProjectAnalytics from "@/pages/projects/ProjectAnalytics";

import type { TabId } from "./ProjectSidebar";
import { useNavigate } from "react-router-dom";

export default function ProjectTabs({
  project,
  activeTab
}: {
  project: any;
  activeTab: TabId;
}) {
  const isUI = project.type === "ui";
  const isAPI = project.type === "api";
  const navigate = useNavigate();

  switch (activeTab) {
    case "overview":
      return (
        <>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: theme.spacing.lg,
              alignItems: "flex-start"
            }}
          >
            <div style={{ flex: "1 1 260px", minWidth: 260 }}>
              <h1 style={{ color: theme.colors.primary, marginBottom: "8px" }}>
                {project.type.toUpperCase()} Project
              </h1>
              <CIStatus projectId={project.id} />
            </div>

            <div
              style={{
                flex: "1 1 260px",
                minWidth: 260,
                padding: "20px",
                borderRadius: "12px",
                background: theme.mode === "dark"
                  ? theme.colors.darkSurface
                  : theme.colors.background,
                border: `1px solid ${
                  theme.mode === "dark"
                    ? theme.colors.darkBorder
                    : theme.colors.border
                }`
              }}
            >
              <h3 style={{ color: theme.colors.secondary }}>Source</h3>
              <p>{isUI ? project.url : project.swaggerUrl}</p>

              <h3 style={{ color: theme.colors.secondary, marginTop: "16px" }}>
                Environment
              </h3>
              <p>{project.env}</p>
            </div>
          </div>

          <div style={{ marginTop: theme.spacing.xl }}>
            <ErrorBoundary>
              <ProjectAnalytics projectId={project.id} />
            </ErrorBoundary>
          </div>

          <div
            style={{
              marginTop: theme.spacing.xl,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: theme.spacing.lg
            }}
          >
            {isUI && <ReCrawl projectId={project.id} />}
            <RefactorPanel projectId={project.id} />
            <CloudSync projectId={project.id} />
          </div>
        </>
      );

    case "flows":
      return (
        <div style={{ marginTop: theme.spacing.lg }}>
          {isUI && <FlowGraph projectId={project.id} />}
          {isAPI && <EndpointExplorer projectId={project.id} />}
        </div>
      );

    case "rtm":
      return (
        <div style={{ marginTop: theme.spacing.lg }}>
          <RTMTable projectId={project.id} />
        </div>
      );

    case "coverage":
      return (
        <div style={{ marginTop: theme.spacing.lg }}>
          <CoverageHeatmap projectId={project.id} />
        </div>
      );

    case "suggestions":
      return (
        <div style={{ marginTop: theme.spacing.lg }}>
          <AISuggestions projectId={project.id} />
        </div>
      );

    case "tests":
      return (
        <div style={{ marginTop: theme.spacing.lg }}>
          <TestRunner projectId={project.id} />
        </div>
      );

    case "autoheal":
      return (
        <div style={{ marginTop: theme.spacing.lg }}>
          <AutoHeal projectId={project.id} />
        </div>
      );

    case "replay":
      return (
        <div style={{ marginTop: theme.spacing.lg }}>
          {isUI ? (
            <ReplayViewer projectId={project.id} testName="example" />
          ) : (
            <p style={{ color: theme.colors.textLight }}>
              Replay is only available for UI projects.
            </p>
          )}
        </div>
      );

    case "settings":
      return (
        <div
          style={{
            marginTop: theme.spacing.lg,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: theme.spacing.lg
          }}
        >
          {isUI && <ReCrawl projectId={project.id} />}
          <RefactorPanel projectId={project.id} />
          <CloudSync projectId={project.id} />

          {/* DELETE PROJECT BUTTON */}
          <div>
            <button
              style={{
                marginTop: theme.spacing.lg,
                padding: "12px 16px",
                background:
                  theme.mode === "dark"
                    ? "#992222"
                    : theme.colors.danger,
                color: "#fff",
                border: "none",
                borderRadius: theme.radii.md,
                cursor: "pointer",
                fontWeight: 600,
                width: "100%"
              }}
              onClick={async () => {
                await fetch(`http://localhost:3000/projects/${project.id}`, {
                  method: "DELETE"
                });
                navigate("/projects");
              }}
            >
              Delete Project
            </button>
          </div>
        </div>
      );

    default:
      return null;
  }
}
