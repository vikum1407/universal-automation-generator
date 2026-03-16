import * as d3 from "d3";
import type { EvolutionSnapshot } from "./graph-evolution-playback";

export type HeatmapMode =
  | "none"
  | "change-intensity"
  | "risk-volatility"
  | "cluster-drift"
  | "transition-fluctuation";

export function setupEvolutionHeatmap(
  g: any,
  snapshots: EvolutionSnapshot[],
  _mode: HeatmapMode
) {
  const nodes = g.selectAll("g.node");
  const edges = g.selectAll("g.edge");

  function computeIntensity() {
    const pageScore: Record<string, number> = {};
    const edgeScore: Record<string, number> = {};

    snapshots.forEach(s => {
      s.diff.addedPages.forEach(p => {
        pageScore[p] = (pageScore[p] || 0) + 3;
      });
      s.diff.removedPages.forEach(p => {
        pageScore[p] = (pageScore[p] || 0) + 3;
      });
      s.diff.riskChanges.forEach(rc => {
        pageScore[rc.page] = (pageScore[rc.page] || 0) + 2;
      });
      s.diff.clusterChanges.forEach(cc => {
        pageScore[cc.page] = (pageScore[cc.page] || 0) + 2;
      });
      s.diff.addedTransitions.forEach(t => {
        edgeScore[t] = (edgeScore[t] || 0) + 3;
      });
      s.diff.removedTransitions.forEach(t => {
        edgeScore[t] = (edgeScore[t] || 0) + 3;
      });
    });

    return { pageScore, edgeScore };
  }

  function applyHeat() {
    const { pageScore, edgeScore } = computeIntensity();

    const maxPage = d3.max(Object.values(pageScore)) || 1;
    const maxEdge = d3.max(Object.values(edgeScore)) || 1;

    const color = d3.scaleLinear<string>()
      .domain([0, maxPage])
      .range(["#f0f9ff", "#0ea5e9"]);

    const edgeColor = d3.scaleLinear<string>()
      .domain([0, maxEdge])
      .range(["#fef2f2", "#dc2626"]);

    nodes.select("rect").style("fill", function (this: SVGRectElement) {
      const title = d3
        .select(this.parentNode as SVGGElement)
        .select("title")
        .text();
      const score = pageScore[title] || 0;
      return color(score);
    });

    edges.select("path").style("stroke", function (this: SVGPathElement) {
      const title = d3
        .select(this.parentNode as SVGGElement)
        .select("title")
        .text();
      const score = edgeScore[title] || 0;
      return edgeColor(score);
    });
  }

  function clearHeat() {
    nodes.select("rect").style("fill", null);
    edges.select("path").style("stroke", null);
  }

  return {
    applyHeat,
    clearHeat
  };
}
