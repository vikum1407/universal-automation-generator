export function ClusterPanel({ cluster }: { cluster: any }) {
  if (!cluster) return null;
  return <div className="w-[340px]">{cluster}</div>;
}
