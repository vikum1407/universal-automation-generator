export function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="w-full">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search tests, runs, errors, logs, screenshots…"
        className="w-full p-3 border rounded shadow-sm"
      />
    </div>
  );
}
