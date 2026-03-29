import type { SearchResult } from "../../api/types";

export function SearchResultItem({ item }: { item: SearchResult }) {
  return (
    <div className="p-3 border rounded bg-white shadow-sm">
      <div className="flex justify-between">
        <div className="font-semibold capitalize">{item.type}</div>
        <div className="text-xs text-gray-500">Score: {item.score}</div>
      </div>

      <div className="text-sm text-gray-600 mt-1">{item.snippet}</div>

      <div className="text-xs text-gray-500 mt-2">
        Project: {item.project_id} • ID: {item.id}
      </div>
    </div>
  );
}
