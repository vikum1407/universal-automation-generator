import { useState, useEffect } from "react";

import { useReplaySteps } from "../../hooks/useReplaySteps";
import { useSnapshot } from "../../hooks/useSnapshot";
import { useSnapshotDiff } from "../../hooks/useSnapshotDiff";

import { ReplayTimeline } from "./ReplayTimeline";
import { DOMSnapshotViewer } from "./DOMSnapshotViewer";
import { SnapshotDiffViewer } from "./SnapshotDiffViewer";
import { ReplayControls } from "./ReplayControls";

export function TestReplayPanel({ runId }: { runId: string }) {
  const { data: steps } = useReplaySteps(runId);

  const [selected, setSelected] = useState<string | null>(null);
  const [previous, setPrevious] = useState<string | null>(null);

  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const snapshot = useSnapshot(selected);
  const diff = useSnapshotDiff(previous, selected);

  function selectStep(step: any) {
    setPrevious(selected);
    setSelected(step.snapshot_id);
  }

  function nextStep() {
    if (!steps.length || !selected) return;
    const idx = steps.findIndex((s) => s.snapshot_id === selected);
    if (idx < steps.length - 1) selectStep(steps[idx + 1]);
  }

  function prevStep() {
    if (!steps.length || !selected) return;
    const idx = steps.findIndex((s) => s.snapshot_id === selected);
    if (idx > 0) selectStep(steps[idx - 1]);
  }

  useEffect(() => {
    if (!playing) return;

    const id = setInterval(() => {
      nextStep();
    }, 1000 / speed);

    return () => clearInterval(id);
  }, [playing, speed, selected, steps]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") nextStep();
      if (e.key === "ArrowLeft") prevStep();
      if (e.key === " ") setPlaying((p) => !p);
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selected, steps]);

  return (
    <div className="space-y-8">
      <ReplayControls
        playing={playing}
        speed={speed}
        onPlayPause={() => setPlaying((p) => !p)}
        onNext={nextStep}
        onPrev={prevStep}
        onSpeed={setSpeed}
      />

      <ReplayTimeline
        steps={steps}
        selected={selected}
        onSelect={selectStep}
      />

      <DOMSnapshotViewer snapshot={snapshot.data} loading={snapshot.loading} />
      <SnapshotDiffViewer diff={diff.data} loading={diff.loading} />
    </div>
  );
}
