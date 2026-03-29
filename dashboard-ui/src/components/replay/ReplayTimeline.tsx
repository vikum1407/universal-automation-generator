import type { ReplayStep } from "../../api/types";
import { Card } from "../ui/Card";
import { Section } from "../ui/Section";

export function ReplayTimeline({
  steps,
  selected,
  onSelect
}: {
  steps: ReplayStep[];
  selected: string | null;
  onSelect: (s: ReplayStep) => void;
}) {
  if (!steps.length) return null;

  return (
    <Section title="Replay Timeline">
      <div className="space-y-2">
        {steps.map((s) => {
          const active = selected === s.id;

          return (
            <Card
              key={s.id}
              onClick={() => onSelect(s)}
              className={`cursor-pointer transition ${
                active
                  ? "border-brand-primary bg-brand-primary/10"
                  : "border-neutral-light"
              }`}
            >
              <div className="text-caption text-neutral-mid">{s.timestamp}</div>
              <div className="font-medium text-body">{s.action}</div>
              {s.selector && (
                <div className="text-caption text-neutral-mid">{s.selector}</div>
              )}
            </Card>
          );
        })}
      </div>
    </Section>
  );
}
