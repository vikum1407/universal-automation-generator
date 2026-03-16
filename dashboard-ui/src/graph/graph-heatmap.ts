import * as d3 from "d3";

export type HeatmapMode =
  | "none"
  | "page-risk"
  | "transition-risk"
  | "cluster-risk"
  | "journey-risk";

export function applyHeatmap(
  g: any, // Accept BaseSel without type conflict
  mode: HeatmapMode,
  pageRisk: Record<string, string>,
  transitionFrequency: Record<string, number>,
  clusterRisk: Record<string, number>,
  journeyRisk: number
) {
  // ❌ REMOVE type arguments — TS error
  // const nodes = g.selectAll<SVGGElement, unknown>("g.node");
  // const edges = g.selectAll<SVGGElement, unknown>("g.edge");

  // ✅ FIX — no type arguments
  const nodes = g.selectAll("g.node");
  const edges = g.selectAll("g.edge");

  const colorScale = d3
    .scaleLinear<string>()
    .domain([0, 0.5, 1])
    .range(["#4ade80", "#facc15", "#ef4444"]);

  // Reset
  nodes.select("rect").style("fill", null);
  edges.select("path").style("stroke", null);

  if (mode === "none") return;

  if (mode === "page-risk") {
    nodes.each(function (this: SVGGElement) {
      const node = d3.select(this);
      const risk = pageRisk[node.select("title").text()] || "P2";
      const score = risk === "P0" ? 1 : risk === "P1" ? 0.7 : 0.3;
      node.select("rect").style("fill", colorScale(score));
    });
  }

  if (mode === "transition-risk") {
    edges.each(function (this: SVGGElement) {
      const edge = d3.select(this);
      const freq = transitionFrequency[edge.select("title").text()] || 0;
      const score = Math.min(freq / 20, 1);
      edge.select("path").style("stroke", colorScale(score));
    });
  }

  if (mode === "cluster-risk") {
    nodes.each(function (this: SVGGElement) {
      const node = d3.select(this);
      const cluster = node.attr("data-cluster") || "default";
      const score = clusterRisk[cluster] ?? 0.3;
      node.select("rect").style("fill", colorScale(score));
    });
  }

  if (mode === "journey-risk") {
    const score = Math.min(journeyRisk, 1);
    nodes.select("rect").style("fill", colorScale(score * 0.8));
    edges.select("path").style("stroke", colorScale(score));
  }
}
