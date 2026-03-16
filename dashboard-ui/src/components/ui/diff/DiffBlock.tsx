interface Props {
  patch: string;
}

export function DiffBlock({ patch }: Props) {
  return (
    <pre className="bg-slate-900 text-slate-100 p-4 rounded overflow-auto text-sm">
      {patch}
    </pre>
  );
}
