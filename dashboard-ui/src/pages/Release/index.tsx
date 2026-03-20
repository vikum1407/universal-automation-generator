import { useRelease } from "@/context/ReleaseContext";
import ReadinessPanel from "@/components/release/ReadinessPanel";
import StoryPanel from "@/components/release/StoryPanel";
import TimelinePanel from "@/components/release/TimelinePanel";
import SummaryPanel from "@/components/release/SummaryPanel";

export default function ReleaseOverviewPage() {
  const data = useRelease();
  if (!data) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-12 gap-4 p-6">
      <div className="col-span-4">
        <ReadinessPanel readiness={data.intelligence.readiness} />
      </div>

      <div className="col-span-8">
        <SummaryPanel summary={data.intelligence.summary} />
      </div>

      <div className="col-span-6">
        <StoryPanel story={data.intelligence.story} />
      </div>

      <div className="col-span-6">
        <TimelinePanel timeline={data.intelligence.timeline} />
      </div>
    </div>
  );
}
