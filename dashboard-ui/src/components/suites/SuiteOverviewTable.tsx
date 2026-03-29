import { useSuites } from "../../hooks/useSuites";

export function SuiteOverviewTable() {
  const { data, loading } = useSuites();

  if (loading) return <div>Loading suites…</div>;

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="text-left border-b">
          <th>Test</th>
          <th>Total</th>
          <th>Passed</th>
          <th>Failed</th>
          <th>Flaky</th>
          <th>Avg Duration</th>
          <th>Last Status</th>
          <th>Last Run</th>
        </tr>
      </thead>
      <tbody>
        {data.map((s) => (
          <tr key={s.test_id} className="border-b hover:bg-gray-50">
            <td>{s.test_id}</td>
            <td>{s.total_runs}</td>
            <td>{s.passed_runs}</td>
            <td>{s.failed_runs}</td>
            <td>{s.flaky_runs}</td>
            <td>{Math.round(s.avg_duration_ms)} ms</td>
            <td>{s.last_status}</td>
            <td>{s.last_run_at}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
