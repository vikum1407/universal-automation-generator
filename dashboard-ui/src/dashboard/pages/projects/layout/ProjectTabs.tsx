import { theme } from "@/theme";
import { useNavigate } from "react-router-dom";

import Overview from "@/pages/projects/Overview";
import Settings from "@/pages/projects/Settings";
import ProjectInsightsPage from "@/pages/projects/ProjectInsightsPage";

import SystemMap from "@/pages/projects/SystemMap";
import RTMTable from "@/pages/projects/RTMTable";
import History from "@/pages/projects/History";
import CoverageHeatmap from "@/pages/projects/CoverageHeatmap";
import AISuggestions from "@/pages/projects/AISuggestions";
import TestRunner from "@/pages/projects/TestRunner";
import AutoHeal from "@/pages/projects/AutoHeal";
import ReplayViewer from "@/pages/projects/ReplayViewer";
import ProjectReadinessPage from "@/pages/projects/ProjectReadinessPage";
import HeatMapPage from "@/pages/projects/HeatMapPage";
import StoryPage from "@/pages/projects/StoryPage";

import type { TabId } from "@/dashboard/pages/projects/layout/ProjectSidebar";

interface ProjectTabsProps {
  project: any;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

export default function ProjectTabs({ project, activeTab, setActiveTab }: ProjectTabsProps) {
  const navigate = useNavigate();

  switch (activeTab) {
    case "overview":
      return (
        <Overview
          project={project}
          onUpdateProject={() => {}}
          onNavigate={setActiveTab}
        />
      );

    case "flows":
      return (
        <div style={{ marginTop: theme.spacing.lg }}>
          <SystemMap projectId={project.id} projectType={project.type} />
        </div>
      );

    case "rtm":
      return (
        <div style={{ marginTop: theme.spacing.lg }}>
          <RTMTable projectId={project.id} />
        </div>
      );

    case "insights":
      return (
        <div style={{ marginTop: theme.spacing.lg }}>
          <ProjectInsightsPage projectId={project.id} />
        </div>
      );

    case "readiness":
      return (
        <div style={{ marginTop: theme.spacing.lg }}>
          <ProjectReadinessPage projectId={project.id} onNavigate={setActiveTab} />
        </div>
      );

    case "heatmap":
      return (
        <div style={{ marginTop: theme.spacing.lg }}>
          <HeatMapPage projectId={project.id} onNavigate={setActiveTab} />
        </div>
      );

    case "coverage":
      return (
        <div style={{ marginTop: theme.spacing.lg }}>
          <CoverageHeatmap projectId={project.id} onNavigate={setActiveTab} />
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
          <ReplayViewer projectId={project.id} />
        </div>
      );

    case "history":
      return (
        <div style={{ marginTop: theme.spacing.lg }}>
          <History projectId={project.id} onNavigate={(tab) => setActiveTab(tab as TabId)} />
        </div>
      );

    case "story":
      return (
        <div style={{ marginTop: theme.spacing.lg }}>
          <StoryPage projectId={project.id} />
        </div>
      );

    case "settings":
      return <Settings project={project} navigate={navigate} />;

    default:
      return null;
  }
}
