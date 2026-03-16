interface DiffBlockProps {
  before: string;
  after: string;
}

export function DiffBlock({ before, after }: DiffBlockProps) {
  return (
    <pre className="bg-slate-900 text-slate-100 text-sm p-4 rounded overflow-x-auto">
      <code>
        <span className="text-red-400">- {before}</span>
        {'\n'}
        <span className="text-green-400">+ {after}</span>
      </code>
    </pre>
  );
}
