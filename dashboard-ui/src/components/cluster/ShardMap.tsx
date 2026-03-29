import type { ShardAssignment } from "../../api/types";

export function ShardMap({ shards }: { shards: ShardAssignment[] }) {
  if (!shards.length) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Shard Distribution</h2>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b text-left">
            <th>Worker</th>
            <th>Test</th>
            <th>Shard</th>
          </tr>
        </thead>

        <tbody>
          {shards.map((s, i) => (
            <tr key={i} className="border-b hover:bg-gray-50">
              <td>{s.worker_id}</td>
              <td>{s.test_id}</td>
              <td>{s.shard_index}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
