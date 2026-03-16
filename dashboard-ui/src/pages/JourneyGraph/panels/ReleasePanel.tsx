export function ReleasePanel({ diff }: { diff: any }) {
  if (!diff) return null;

  return (
    <div className="w-[340px]">
      <div className="font-semibold mb-2">Release Diff</div>
      <pre className="text-xs whitespace-pre-wrap">
        {JSON.stringify(diff, null, 2)}
      </pre>
    </div>
  );
}
