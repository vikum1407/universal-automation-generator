import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { GraphData } from "./useGraphData";

interface GraphContextValue extends GraphData {}

const GraphContext = createContext<GraphContextValue | null>(null);

export function GraphProvider({
  value,
  children
}: {
  value: GraphContextValue;
  children: ReactNode;
}) {
  return <GraphContext.Provider value={value}>{children}</GraphContext.Provider>;
}

export function useGraphContext(): GraphContextValue {
  const ctx = useContext(GraphContext);
  if (!ctx) throw new Error("useGraphContext must be used inside <GraphProvider>");
  return ctx;
}
