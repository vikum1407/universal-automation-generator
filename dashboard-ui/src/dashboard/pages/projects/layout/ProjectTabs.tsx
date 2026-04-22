import { theme } from "@/theme";
import { useNavigate } from "react-router-dom";

import Overview from "@/pages/projects/Overview";
import Settings from "@/pages/projects/Settings";

import FlowGraph from "@/pages/projects/FlowGraph";
import EndpointExplorer from "@/pages/projects/EndpointExplorer";
import RTMTable from "@/pages/projects/RTMTable";
import CoverageHeatmap from "@/pages/projects/CoverageHeatmap";
import AISuggestions from "@/pages/projects/AISuggestions";
import TestRunner from "@/pages/projects/TestRunner";
import AutoHeal from "@/pages/projects/AutoHeal";
import ReplayViewer from "@/pages/projects/ReplayViewer";

import type { TabId } from "@/dashboard/pages/projects/layout/ProjectSidebar";

interface ProjectTabsProps {
  project: any;
  activeTab: TabId;
}

export default function ProjectTabs({ project, activeTab }: ProjectTabsProps) {
  const isUI = project.type === "ui";
  const isAPI = project.type === "api";
  const navigate = useNavigate();

  switch (activeTab) {
    case "overview":
      return (
        <Overview
          project={project}
          onUpdateProject={() => {}}
        />
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
      return <Settings project={project} navigate={navigate} />;

    default:
      return null;
  }
}
