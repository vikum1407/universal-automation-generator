import type { EvolutionDiff } from "../../../ai/evolution-engine";

type Props = {
  evolution: EvolutionDiff | null;
};

export function EvolutionPanel({ evolution }: Props) {
  if (!evolution) return null;

  return (
    <div className="w-[340px]">
      <div className="font-semibold mb-2">Evolution Summary</div>
      <pre className="text-xs whitespace-pre-wrap">
        {JSON.stringify(evolution, null, 2)}
      </pre>
    </div>
  );
}
