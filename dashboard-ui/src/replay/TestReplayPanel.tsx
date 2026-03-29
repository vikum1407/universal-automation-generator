import { useState } from "react";
import { Card } from "../components/ui/Card";
import { ReplayTimeline } from "./ReplayTimeline";
import { ReplayVideo } from "./ReplayVideo";
import { ReplayScreenshots } from "./ReplayScreenshots";
import { ReplayControls } from "./ReplayControls";

export function TestReplayPanel({ runId }: { runId: string }) {
  const [currentTime, setCurrentTime] = useState(0);

  return (
    <Card className="space-y-6">
      <h2 className="text-h2 font-semibold text-neutral-dark dark:text-neutral-light">
        Test Replay
      </h2>

      <ReplayVideo runId={runId} currentTime={currentTime} />

      <ReplayControls currentTime={currentTime} setCurrentTime={setCurrentTime} />

      <ReplayTimeline runId={runId} currentTime={currentTime} setCurrentTime={setCurrentTime} />

      <ReplayScreenshots runId={runId} currentTime={currentTime} />
    </Card>
  );
}
