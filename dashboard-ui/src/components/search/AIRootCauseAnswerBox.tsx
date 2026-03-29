import type { AIRootCauseAnswer } from "../../api/types";

export function AIRootCauseAnswerBox({ answer }: { answer: AIRootCauseAnswer | null }) {
  if (!answer) return null;

  return (
    <div className="p-3 bg-green-50 border rounded text-sm">
      <div className="font-semibold">AI Root‑Cause Analysis</div>
      <div className="mt-2 whitespace-pre-line">{answer.answer}</div>
      <div className="text-xs text-gray-500 mt-2">
        Confidence: {answer.confidence}%
      </div>
    </div>
  );
}
