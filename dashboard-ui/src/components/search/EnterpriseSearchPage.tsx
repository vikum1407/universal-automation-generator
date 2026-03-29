import { useState } from "react";
import { useSearch } from "../../hooks/useSearch";
import { useAIQueryRewrite } from "../../hooks/useAIQueryRewrite";
import { useAIRootCauseQA } from "../../hooks/useAIRootCauseQA";
import { useAIScreenshotSearch } from "../../hooks/useAIScreenshotSearch";

import { SearchBar } from "./SearchBar";
import { SearchResults } from "./SearchResults";
import { AIQueryRewriteBanner } from "./AIQueryRewriteBanner";
import { AIRootCauseAnswerBox } from "./AIRootCauseAnswerBox";
import { AIScreenshotResults } from "./AIScreenshotResults";

export function EnterpriseSearchPage() {
  const [query, setQuery] = useState("");

  const { data: rewrite } = useAIQueryRewrite(query);
  const { data: rootCause } = useAIRootCauseQA(query);
  const { data: screenshotMatches } = useAIScreenshotSearch(query);
  const { data: results, loading } = useSearch(query);

  return (
    <div className="space-y-6">
      <SearchBar value={query} onChange={setQuery} />

      <AIQueryRewriteBanner rewrite={rewrite} />
      <AIRootCauseAnswerBox answer={rootCause} />
      <AIScreenshotResults items={screenshotMatches} />

      {loading && <div>Searching…</div>}

      <SearchResults results={results} />
    </div>
  );
}
