import type { AIQueryRewrite } from "../../api/types";

export function AIQueryRewriteBanner({ rewrite }: { rewrite: AIQueryRewrite | null }) {
  if (!rewrite) return null;

  return (
    <div className="p-3 bg-blue-50 border rounded text-sm">
      <div className="font-semibold">AI‑interpreted query</div>
      <div className="mt-1">Intent: {rewrite.intent}</div>
      <div className="text-gray-700 mt-1">Rewritten: {rewrite.rewritten}</div>
    </div>
  );
}
