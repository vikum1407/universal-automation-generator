export function SummaryPanel({ summary }: { summary: any }) {
  if (!summary) return null;
  return <div className="w-[340px]">{summary}</div>;
}
