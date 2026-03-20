import { createContext, useContext, useEffect, useState } from "react";
import type { ReleaseOverviewResponse } from "@/api/types/ReleaseOverviewResponse";

const ReleaseContext = createContext<ReleaseOverviewResponse | null>(null);

export function ReleaseProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<ReleaseOverviewResponse | null>(null);

  useEffect(() => {
    fetch("/api/release/overview")
      .then((r) => r.json())
      .then((json) => setData(json as ReleaseOverviewResponse));
  }, []);

  return (
    <ReleaseContext.Provider value={data}>
      {children}
    </ReleaseContext.Provider>
  );
}

export function useRelease(): ReleaseOverviewResponse | null {
  return useContext(ReleaseContext);
}
