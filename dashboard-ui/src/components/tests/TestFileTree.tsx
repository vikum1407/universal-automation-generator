interface TestFileTreeProps {
  files: Record<string, string>;
  selectedFile: string | null;
  onSelect: (file: string) => void;
}

export default function TestFileTree({ files, selectedFile, onSelect }: TestFileTreeProps) {
  return (
    <div className="border-r pr-4 w-64 overflow-y-auto">
      <ul className="space-y-1">
        {Object.keys(files).map((file) => (
          <li key={file}>
            <button
              onClick={() => onSelect(file)}
              className={`block w-full text-left px-2 py-1 rounded ${
                selectedFile === file ? "bg-blue-100" : "hover:bg-gray-100"
              }`}
            >
              {file}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
