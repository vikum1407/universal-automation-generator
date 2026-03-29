import { Table } from "../ui/Table";

export function RecentRunsTable({ runs }: { runs: any[] }) {
  if (!runs?.length) return null;

  return (
    <Table headers={["Run ID", "Status", "Duration", "Timestamp"]}>
      {runs.map((r) => (
        <tr
          key={r.id}
          className="hover:bg-neutral-light/50 dark:hover:bg-slate-700 transition"
        >
          <td className="px-4 py-2">{r.id}</td>
          <td
            className={`px-4 py-2 font-medium ${
              r.status === "pass"
                ? "text-brand-secondary"
                : "text-red-500 dark:text-red-400"
            }`}
          >
            {r.status}
          </td>
          <td className="px-4 py-2 text-neutral-mid dark:text-slate-400">
            {r.duration_ms} ms
          </td>
          <td className="px-4 py-2 text-neutral-mid dark:text-slate-400">
            {r.timestamp}
          </td>
        </tr>
      ))}
    </Table>
  );
}
