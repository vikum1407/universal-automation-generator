type Props = { onClick: () => void };

export function RecommendButton({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-2 text-sm border rounded bg-white shadow"
    >
      ✦ Recommend
    </button>
  );
}
