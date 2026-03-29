import type { StepNode } from "../../utils/stepTree";

function StepItem({ step, depth }: { step: StepNode; depth: number }) {
  return (
    <div className="mb-2">
      <div
        className="p-2 border rounded bg-white shadow-sm"
        style={{ marginLeft: depth * 16 }}
      >
        <div className="font-medium">{step.title}</div>
        <div className="text-xs text-gray-600">
          {step.status} • {step.start}
          {step.end ? ` → ${step.end}` : ""}
        </div>
      </div>

      {step.children.map((c) => (
        <StepItem key={c.id} step={c} depth={depth + 1} />
      ))}
    </div>
  );
}

export function StepTree({ steps }: { steps: StepNode[] }) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Steps</h2>
      <div>{steps.map((s) => <StepItem key={s.id} step={s} depth={0} />)}</div>
    </section>
  );
}
