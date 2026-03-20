interface CodeViewerProps {
  code: string | null;
}

export default function CodeViewer({ code }: CodeViewerProps) {
  return (
    <pre className="flex-1 p-4 bg-gray-50 overflow-auto rounded border">
      <code>{code ?? "Select a file to view its contents."}</code>
    </pre>
  );
}
