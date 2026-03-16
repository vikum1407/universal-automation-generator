export function ComparisonPanel({ diff }: { diff: any }) {
  if (!diff) return null;
  return <div className="w-[340px]">{diff}</div>;
}
