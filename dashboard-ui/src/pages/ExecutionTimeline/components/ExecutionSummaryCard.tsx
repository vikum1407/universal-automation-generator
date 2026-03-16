import { Card } from '../../../components/Card';

export default function ExecutionSummaryCard({ run }: { run: any }) {
  return (
    <Card>
      <div className="flex justify-between">
        <div>
          <h3 className="text-lg font-semibold">{run.id}</h3>
          <p className="text-sm text-gray-500">{run.timestamp}</p>
        </div>

        <div className="text-right">
          <p className="text-green-600 font-bold">
            {run.execution?.summary?.passed} passed
          </p>
          <p className="text-red-600 font-bold">
            {run.execution?.summary?.failed} failed
          </p>
        </div>
      </div>
    </Card>
  );
}
