interface Props {
  text: string;
}

export function CopyButton({ text }: Props) {
  const copy = () => navigator.clipboard.writeText(text);

  return (
    <button
      onClick={copy}
      className="px-3 py-1 text-sm bg-slate-200 dark:bg-slate-700 rounded hover:bg-slate-300"
    >
      Copy Fix
    </button>
  );
}
