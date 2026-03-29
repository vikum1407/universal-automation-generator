import { Card } from "../ui/Card";

export function ReplayControls({
  playing,
  speed,
  onPlayPause,
  onNext,
  onPrev,
  onSpeed
}: {
  playing: boolean;
  speed: number;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSpeed: (s: number) => void;
}) {
  return (
    <Card>
      <div className="flex items-center gap-4">
        <button
          onClick={onPrev}
          className="px-3 py-1 border rounded-card border-neutral-light hover:bg-neutral-light/50"
        >
          Prev
        </button>

        <button
          onClick={onPlayPause}
          className="px-4 py-1 rounded-card bg-brand-primary text-white hover:bg-brand-primaryDark"
        >
          {playing ? "Pause" : "Play"}
        </button>

        <button
          onClick={onNext}
          className="px-3 py-1 border rounded-card border-neutral-light hover:bg-neutral-light/50"
        >
          Next
        </button>

        <select
          value={speed}
          onChange={(e) => onSpeed(Number(e.target.value))}
          className="border rounded-card px-2 py-1 border-neutral-light"
        >
          <option value={1}>1x</option>
          <option value={2}>2x</option>
          <option value={4}>4x</option>
        </select>
      </div>
    </Card>
  );
}
