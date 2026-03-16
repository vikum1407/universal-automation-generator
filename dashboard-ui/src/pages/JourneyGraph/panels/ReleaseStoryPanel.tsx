export function ReleaseStoryPanel({ story }: { story: string | null }) {
  if (!story) return null;

  return (
    <div className="w-[340px]">
      <div className="font-semibold mb-2">Release Story</div>
      <div className="text-xs whitespace-pre-wrap">{story}</div>
    </div>
  );
}
