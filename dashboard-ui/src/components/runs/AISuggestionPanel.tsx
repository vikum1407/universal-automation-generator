import React from "react";
import type { AISuggestion } from "../../api/types";

export function AISuggestionPanel({ fix }: { fix: AISuggestion | null }) {
  if (!fix) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold">Suggested Fix</h2>
      <p className="mt-2">{fix.suggestion}</p>
      <pre className="bg-gray-100 p-4 rounded mt-2">
        {fix.code_snippet}
      </pre>
    </section>
  );
}
