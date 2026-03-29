import type { SearchResult } from "../../api/types";
import { SearchResultItem } from "./SearchResultItem";

export function SearchResults({ results }: { results: SearchResult[] }) {
  if (!results.length) return null;

  return (
    <div className="space-y-3">
      {results.map((r) => (
        <SearchResultItem key={`${r.type}-${r.id}`} item={r} />
      ))}
    </div>
  );
}
