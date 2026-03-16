type Props = {
  journeyA: string;
  journeyB: string;
  setJourneyA: (v: string) => void;
  setJourneyB: (v: string) => void;
  journeys: any[];
  onCompare: () => void;
};

export function CompareControls({
  journeyA,
  journeyB,
  setJourneyA,
  setJourneyB,
  journeys,
  onCompare
}: Props) {
  return (
    <>
      <select
        value={journeyA}
        onChange={e => setJourneyA(e.target.value)}
        className="px-2 py-2 text-sm border rounded bg-white shadow"
      >
        <option value="">Journey A</option>
        {journeys.map(j => (
          <option key={j.name} value={j.name}>{j.name}</option>
        ))}
      </select>

      <select
        value={journeyB}
        onChange={e => setJourneyB(e.target.value)}
        className="px-2 py-2 text-sm border rounded bg-white shadow"
      >
        <option value="">Journey B</option>
        {journeys.map(j => (
          <option key={j.name} value={j.name}>{j.name}</option>
        ))}
      </select>

      <button
        onClick={onCompare}
        className="px-3 py-2 text-sm border rounded bg-white shadow"
      >
        ⇄ Compare
      </button>
    </>
  );
}
