export function EvolutionStoryPanel({ story }: { story: string | null }) {
  if (!story) return null;

  return (
    <div className="w-[340px]">
      <div className="font-semibold mb-2">Evolution Story</div>
      <div className="text-xs whitespace-pre-wrap">{story}</div>
    </div>
  );
}
