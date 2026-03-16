import * as d3 from "d3";
import type { BaseSel } from "./GraphTypes";

export function applyClusterColors(
  g: BaseSel,
  pageCluster: Record<string, string>
) {
  const clusters = Array.from(new Set(Object.values(pageCluster)));

  const color = d3.scaleOrdinal<string>()
    .domain(clusters)
    .range(d3.schemeSet2);

  g.selectAll("g.node").each(function () {
    const node = d3.select(this as SVGGElement);
    const page = node.select("title").text();
    const cluster = pageCluster[page];
    if (!cluster) return;

    node
      .select("polygon, ellipse, rect")
      .attr("stroke", color(cluster))
      .attr("stroke-width", 3);
  });

  return { clusters, color };
}
