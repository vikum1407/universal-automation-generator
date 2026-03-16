import type { EvolutionSnapshot } from "../../../graph/graph-evolution-playback";

type Props = {
  total: number;
  index: number;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onSpeed: (s: number) => void;
  onSeek: (i: number) => void;
  snapshots: EvolutionSnapshot[];
};

export function EvolutionPlaybackControls({
  total,
  index,
  onPlay,
  onPause,
  onResume,
  onRestart,
  onSpeed,
  onSeek,
  snapshots
}: Props) {
  return (
    <div className="w-full bg-white dark:bg-slate-900 border rounded shadow p-3 text-sm flex flex-col gap-3">

      <div className="flex items-center gap-2">
        <button
          onClick={onPlay}
          className="px-3 py-1 border rounded bg-white shadow"
        >
          ▶ Play
        </button>

        <button
          onClick={onPause}
          className="px-3 py-1 border rounded bg-white shadow"
        >
          ❚❚ Pause
        </button>

        <button
          onClick={onResume}
          className="px-3 py-1 border rounded bg-white shadow"
        >
          ► Resume
        </button>

        <button
          onClick={onRestart}
          className="px-3 py-1 border rounded bg-white shadow"
        >
          ↺ Restart
        </button>

        <select
          onChange={e => onSpeed(Number(e.target.value))}
          className="px-2 py-1 border rounded bg-white shadow"
        >
          <option value="0.5">0.5×</option>
          <option value="1">1×</option>
          <option value="1.5">1.5×</option>
          <option value="2">2×</option>
          <option value="3">3×</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={total - 1}
          value={index}
          onChange={e => onSeek(Number(e.target.value))}
          className="w-full"
        />
        <div className="w-20 text-right text-slate-600 dark:text-slate-300">
          {snapshots[index]?.id ?? ""}
        </div>
      </div>
    </div>
  );
}
