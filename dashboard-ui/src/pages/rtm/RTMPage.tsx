import { useEffect, useState } from "react";
import RTMTable from "@/pages/projects/RTMTable";
import RTMSidebar from "@/pages/projects/RTMSidebar";
import RTMInsights from "@/pages/projects/RTMInsights";
import RTMCoverageHeatmap from "@/pages/projects/RTMCoverageHeatmap";
import RTMTestsExplorer from "@/pages/projects/RTMTestsExplorer";
import RTMCoverageTimeline from "@/pages/projects/RTMCoverageTimeline";
import RTMAISuggestions from "@/pages/projects/RTMAISuggestions";
import RTMDashboard from "@/pages/projects/RTMDashboard";

export default function RTMPage({ projectId }: { projectId: string }) {
  const [rtm, setRTM] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState("requirements");

  // ---------------------------------------------------------
  // LOAD RTM FROM NEW BACKEND FORMAT
  // ---------------------------------------------------------
  const load = async () => {
    setLoading(true);

    const res = await fetch(`/projects/${projectId}/rtm`);
    const data = await res.json();

    // NEW: backend returns { requirements, insights }
    setRTM(data);
    setInsights(data.insights || null);

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [projectId]);

  // ---------------------------------------------------------
  // EXPORT
  // ---------------------------------------------------------
  const exportRTM = async (format: string) => {
    await fetch(`/projects/${projectId}/rtm/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project: projectId,
        rtm: rtm.requirements, // NEW: no nested rtm.rtm
        format
      })
    });
  };

  // ---------------------------------------------------------
  // BULK REGENERATE
  // ---------------------------------------------------------
  const bulkRegenerate = async () => {
    await fetch(`/projects/${projectId}/rtm/regenerate-all`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    load();
  };

  // ---------------------------------------------------------
  // LOADING + EMPTY STATES
  // ---------------------------------------------------------
  if (loading) {
    return <div className="p-6 text-gray-400">Loading RTM…</div>;
  }

  if (!rtm || !rtm.requirements) {
    return <div className="p-6 text-gray-400">No RTM data found.</div>;
  }

  // ---------------------------------------------------------
  // SUMMARY (NEW FORMAT)
  // ---------------------------------------------------------
  const summary = {
    totalRequirements: rtm.requirements.length,
    coveredRequirements: rtm.requirements.filter((r: any) => r.covered).length || 0,
    coveragePercent:
      rtm.requirements.length > 0
        ? Math.round(
            (rtm.requirements.filter((r: any) => r.covered).length /
              rtm.requirements.length) *
              100
          )
        : 0
  };

  return (
    <div className="flex">
      <RTMSidebar
        active={active}
        onSelect={setActive}
        onBulkRegenerate={bulkRegenerate}
      />

      <div className="p-6 flex flex-col gap-6 flex-1">
        <RTMDashboard summary={summary} />

        {/* EXPORT BUTTONS */}
        <div className="flex gap-3">
          <button
            onClick={() => exportRTM("md")}
            className="px-3 py-2 bg-blue-600 text-white rounded"
          >
            Export Markdown
          </button>
          <button
            onClick={() => exportRTM("csv")}
            className="px-3 py-2 bg-blue-600 text-white rounded"
          >
            Export CSV
          </button>
          <button
            onClick={() => exportRTM("json")}
            className="px-3 py-2 bg-blue-600 text-white rounded"
          >
            Export JSON
          </button>
          <button
            onClick={() => exportRTM("pdf")}
            className="px-3 py-2 bg-blue-600 text-white rounded"
          >
            Export PDF
          </button>
        </div>

        {/* PANELS */}
        {active === "insights" && insights && <RTMInsights insights={insights} />}
        {active === "coverage" && <RTMCoverageHeatmap projectId={projectId} />}
        {active === "tests" && <RTMTestsExplorer projectId={projectId} />}
        {active === "timeline" && <RTMCoverageTimeline projectId={projectId} />}
        {active === "ai" && <RTMAISuggestions projectId={projectId} />}

        {/* REQUIREMENTS TABLE */}
        {active === "requirements" && <RTMTable projectId={projectId} />}
      </div>
    </div>
  );
}
