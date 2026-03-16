import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";

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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Navigate to="/journeys" replace />} />

          <Route path="/journeys" element={<Journeys />} />
          <Route path="/journeys/:id" element={<JourneyDetails />} />

          <Route path="/execution" element={<ExecutionTimeline />} />
          <Route path="/execution/:id" element={<ExecutionRunDetails />} />
          <Route path="/execution/trends" element={<ExecutionTrendsPanel />} />
          <Route path="/execution/insights" element={<ExecutionInsightsPanel />} />
          <Route path="/execution/compare" element={<ExecutionComparePanel />} />

          <Route path="/release" element={<ReleaseReadinessDashboard />} />
          <Route path="/release/heatmap" element={<ReleaseHeatmap />} />
          <Route path="/release/story" element={<ReleaseStory />} />

          {/* C18 */}
          <Route
            path="/release/:project/requirements"
            element={<ReleaseRequirementExplorer />}
          />
          <Route
            path="/release/:project/requirements/:requirementId"
            element={<ReleaseRequirementDetails />}
          />

          {/* C19 */}
          <Route
            path="/release/:project/self-healing"
            element={<ReleaseSelfHealingOverview />}
          />
          <Route
            path="/release/:project/self-healing/:suggestionId"
            element={<ReleaseSelfHealingDetails />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
