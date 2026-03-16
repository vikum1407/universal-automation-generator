type Props = { onEvolution: () => void };

export function EvolutionControls({ onEvolution }: Props) {
  return (
    <button
      onClick={onEvolution}
      className="px-3 py-2 text-sm border rounded bg-white shadow"
    >
      ✦ Evolution
    </button>
  );
}
