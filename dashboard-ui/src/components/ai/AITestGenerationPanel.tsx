import { useAIGeneratedTests } from "../../hooks/useAIGeneratedTests";
import { useAIEdgeCases } from "../../hooks/useAIEdgeCases";
import { useAIAssertionSuggestions } from "../../hooks/useAIAssertionSuggestions";

import { AIGeneratedTestList } from "./AIGeneratedTestList";
import { AIEdgeCaseList } from "./AIEdgeCaseList";
import { AIAssertionSuggestionList } from "./AIAssertionSuggestionList";

export function AITestGenerationPanel({ testId }: { testId: string }) {
  const { data: tests } = useAIGeneratedTests(testId);
  const { data: edges } = useAIEdgeCases(testId);
  const { data: assertions } = useAIAssertionSuggestions(testId);

  return (
    <div className="space-y-8">
      <AIGeneratedTestList items={tests} />
      <AIEdgeCaseList items={edges} />
      <AIAssertionSuggestionList items={assertions} />
    </div>
  );
}
