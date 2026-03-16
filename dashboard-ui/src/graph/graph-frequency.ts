import * as d3 from "d3";
import type { BaseSel } from "./GraphTypes";

export function applyFrequencyThickness(
  g: BaseSel,
  transitions: Record<string, number>
) {
  const values = Object.values(transitions);
  const min = Math.min(...values, 1);
  const max = Math.max(...values, 1);

  const scale = d3.scaleLinear().domain([min, max]).range([1, 6]);

  g.selectAll("g.edge").each(function () {
    const edge = d3.select(this);
    const title = edge.select("title").text();
    const freq = transitions[title] ?? min;

    edge.select("path")
      .attr("stroke-width", scale(freq))
      .attr("stroke", "#333");
  });
}
