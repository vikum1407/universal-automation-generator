type Props = { onClick: () => void };

export function EvolutionStoryButton({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-2 text-sm border rounded bg-white shadow"
    >
      ✦ Story Mode
    </button>
  );
}
