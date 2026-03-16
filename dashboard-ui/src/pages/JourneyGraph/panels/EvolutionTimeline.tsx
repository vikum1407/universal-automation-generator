import type { EvolutionSnapshot } from "../graph/graph-evolution-playback";

type Props = {
  snapshots: EvolutionSnapshot[];
  index: number;
  onSeek: (i: number) => void;
};

export function EvolutionTimeline({ snapshots, index, onSeek }: Props) {
  return (
    <div className="w-full px-4 py-3 bg-white dark:bg-slate-900 border rounded shadow text-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-slate-700 dark:text-slate-200">
          Evolution Timeline
        </div>
      </div>

      <div className="relative w-full h-10 flex items-center">
        <div className="absolute left-0 right-0 h-[2px] bg-slate-300 dark:bg-slate-700" />

        <div className="relative w-full flex justify-between">
          {snapshots.map((snap, i) => (
            <div
              key={snap.id}
              className="flex flex-col items-center cursor-pointer"
              onClick={() => onSeek(i)}
            >
              <div
                className={`w-3 h-3 rounded-full border ${
                  i === index
                    ? "bg-blue-500 border-blue-600"
                    : "bg-white dark:bg-slate-900 border-slate-400 dark:border-slate-600"
                }`}
              />
              <div className="mt-1 text-[10px] text-slate-600 dark:text-slate-300 truncate w-12 text-center">
                {snap.id}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
