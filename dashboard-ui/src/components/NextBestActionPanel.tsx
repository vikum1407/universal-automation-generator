import type { NextBestActions } from "../ai/next-best-action";

type Props = {
  actions: NextBestActions | null;
};

export function NextBestActionPanel({ actions }: Props) {
  if (!actions) return null;

  return (
    <div className="p-4 border rounded bg-white shadow w-[350px] text-sm">
      <h2 className="font-semibold text-lg mb-3">Next Best Actions</h2>

      <div className="mb-3">
        <h3 className="font-semibold">Next Test</h3>
        <p className="text-gray-700">{actions.nextTest}</p>
      </div>

      <div className="mb-3">
        <h3 className="font-semibold">Next Fix</h3>
        <p className="text-gray-700">{actions.nextFix}</p>
      </div>

      <div className="mb-3">
        <h3 className="font-semibold">Next Automation</h3>
        <p className="text-gray-700">{actions.nextAutomation}</p>
      </div>

      <div>
        <h3 className="font-semibold">Next Insight</h3>
        <p className="text-gray-700">{actions.nextInsight}</p>
      </div>
    </div>
  );
}
