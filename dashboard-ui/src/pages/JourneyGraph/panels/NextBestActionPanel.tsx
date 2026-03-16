export function NextBestActionPanel({ actions }: { actions: any }) {
  if (!actions) return null;
  return <div className="w-[340px]">{actions}</div>;
}
