import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const CRUMB_MAP: Record<string, string> = {
  execution: "Execution",
  trends: "Trends",
  insights: "Insights",
  release: "Release",
  heatmap: "Heatmap",
  story: "Story",
  requirements: "Requirements",
  "self-healing": "Self‑Healing"
};

function formatTitle(seg: string) {
  if (/^REQ/i.test(seg)) return `Requirement ${seg}`;
  if (/^\d+$/.test(seg)) return `Run ${seg}`;
  return CRUMB_MAP[seg] || seg;
}

export function usePageTitle() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  const last = segments[segments.length - 1];
  const label = last ? formatTitle(last) : "Dashboard";

  useEffect(() => {
    document.title = `Qlitz – ${label}`;
  }, [label]);
}
