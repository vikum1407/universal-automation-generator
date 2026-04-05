import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import ErrorBoundary from "./components/ErrorBoundary";

import Journeys from "./pages/Journeys";
import JourneyDetails from "./pages/JourneyDetails";

import ExecutionTimeline from "./pages/ExecutionTimeline/ExecutionTimeline";
import ExecutionRunDetails from "./pages/ExecutionTimeline/ExecutionRunDetails";
import ExecutionTrendsPanel from "./pages/ExecutionTimeline/ExecutionTrendsPanel";
import ExecutionInsightsPanel from "./pages/ExecutionTimeline/ExecutionInsightsPanel";
import ExecutionComparePanel from "./pages/ExecutionTimeline/ExecutionComparePanel";

import ReleaseReadinessDashboard from "./pages/Release/ReleaseReadinessDashboard";
import ReleaseHeatmap from "./pages/Release/ReleaseHeatmap";
import ReleaseStory from "./pages/Release/ReleaseStory";

import ReleaseRequirementExplorer from "./pages/Release/RequirementExplorer/ReleaseRequirementExplorer";
import ReleaseRequirementDetails from "./pages/Release/RequirementExplorer/ReleaseRequirementDetails";

import ReleaseSelfHealingOverview from "./pages/Release/SelfHealing/ReleaseSelfHealingOverview";
import { ReleaseSelfHealingDetails } from "./pages/Release/SelfHealing/ReleaseSelfHealingDetails";

import TestPage from "./pages/Release/test/TestPage";
import DiffPage from "./pages/Release/test/DiffPage";
import FlowPage from "./pages/Release/test/FlowPage";
import SelectorPage from "./pages/Release/test/SelectorPage";

import NewProjectType from "./pages/projects/NewProjectType";
import NewUIProject from "./pages/projects/NewUIProject";
import NewAPIProject from "./pages/projects/NewAPIProject";
import NewProjectSummary from "./pages/projects/NewProjectSummary";
import InitializingProject from "./pages/projects/InitializingProject";

import ProjectDetails from "@/dashboard/pages/projects/ProjectDetails";
import ProjectsList from "./pages/projects/ProjectsList";

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Navigate to="/journeys" replace />} />

            {/* PROJECT CREATION WIZARD */}
            <Route path="/projects/new" element={<NewProjectType />} />
            <Route path="/projects/new/ui" element={<NewUIProject />} />
            <Route path="/projects/new/api" element={<NewAPIProject />} />
            <Route path="/projects/new/summary" element={<NewProjectSummary />} />
            <Route path="/projects/:id/initializing" element={<InitializingProject />} />

            {/* PROJECT LIST + DETAILS */}
            <Route path="/projects" element={<ProjectsList />} />
            <Route path="/projects/:id" element={<ProjectDetails />} />

            {/* JOURNEYS */}
            <Route path="/journeys" element={<Journeys />} />
            <Route path="/journeys/:id" element={<JourneyDetails />} />

            {/* EXECUTION */}
            <Route path="/execution" element={<ExecutionTimeline />} />
            <Route path="/execution/:id" element={<ExecutionRunDetails />} />
            <Route path="/execution/trends" element={<ExecutionTrendsPanel />} />
            <Route path="/execution/insights" element={<ExecutionInsightsPanel />} />
            <Route path="/execution/compare" element={<ExecutionComparePanel />} />

            {/* RELEASE */}
            <Route path="/release" element={<ReleaseReadinessDashboard />} />
            <Route path="/release/heatmap" element={<ReleaseHeatmap />} />
            <Route path="/release/story" element={<ReleaseStory />} />

            <Route
              path="/release/:project/requirements"
              element={<ReleaseRequirementExplorer />}
            />
            <Route
              path="/release/:project/requirements/:requirementId"
              element={<ReleaseRequirementDetails />}
            />

            <Route
              path="/release/:project/self-healing"
              element={<ReleaseSelfHealingOverview />}
            />
            <Route
              path="/release/:project/self-healing/:suggestionId"
              element={<ReleaseSelfHealingDetails />}
            />

            {/* TEST INTELLIGENCE */}
            <Route path="/release/test/:testId" element={<TestPage />} />
            <Route path="/release/test/:testId/diff" element={<DiffPage />} />
            <Route path="/release/test/:testId/flow" element={<FlowPage />} />
            <Route path="/release/test/:testId/selectors" element={<SelectorPage />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
