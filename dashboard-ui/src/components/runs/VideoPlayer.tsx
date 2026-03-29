export function VideoPlayer({ url }: { url: string | null }) {
  if (!url) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Live Video</h2>
      <video
        src={url}
        controls
        autoPlay
        muted
        className="w-full rounded border"
      />
    </section>
  );
}
