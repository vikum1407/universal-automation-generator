import type { JourneyDiff } from "../ai/journey-compare";

type Props = {
  diff: JourneyDiff | null;
};

export function JourneyComparisonPanel({ diff }: Props) {
  if (!diff) return null;

  return (
    <div className="p-4 border rounded bg-white shadow w-[350px] text-sm">
      <h2 className="font-semibold text-lg mb-3">Journey Comparison</h2>

      <p className="mb-4 text-gray-700">{diff.summary}</p>

      <Section title="Added Pages" items={diff.addedPages} />
      <Section title="Removed Pages" items={diff.removedPages} />
      <Section title="Reordered Pages" items={diff.reorderedPages} />

      <Section
        title="Risk Changes"
        items={diff.riskDelta.map(r => `${r.page}: ${r.before} → ${r.after}`)}
      />

      <Section
        title="Coverage Changes"
        items={diff.coverageDelta.map(c => `${c.transition}: ${c.before} → ${c.after}`)}
      />

      <Section
        title="Frequency Changes"
        items={diff.frequencyDelta.map(f => `${f.transition}: ${f.before} → ${f.after}`)}
      />
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;

  return (
    <div className="mb-3">
      <h3 className="font-semibold">{title}</h3>
      <ul className="list-disc ml-5 text-gray-700">
        {items.map((i, idx) => (
          <li key={idx}>{i}</li>
        ))}
      </ul>
    </div>
  );
}
