export default function ExecutionResultTable({ results }: { results: any[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b">
          <th className="text-left p-2">Test</th>
          <th className="text-left p-2">Status</th>
          <th className="text-left p-2">Duration</th>
        </tr>
      </thead>

      <tbody>
        {results.map((r, i) => (
          <tr key={i} className="border-b">
            <td className="p-2">{r.name}</td>
            <td className="p-2">
              {r.status === 'pass' ? (
                <span className="text-green-600 font-semibold">PASS</span>
              ) : (
                <span className="text-red-600 font-semibold">FAIL</span>
              )}
            </td>
            <td className="p-2">{r.durationMs} ms</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
