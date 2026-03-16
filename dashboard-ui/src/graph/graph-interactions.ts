import * as d3 from "d3";
import type { BaseSel } from "./GraphTypes";

export function setupInteractions(
  g: BaseSel,
  navigate: (path: string) => void
) {
  const nodes = g.selectAll("g.node");
  const edges = g.selectAll("g.edge");

  nodes.on("mouseenter", function () {
    const node = d3.select(this);
    const id = node.select("title").text();

    node.select("polygon, ellipse, rect")
      .attr("stroke", "#000")
      .attr("stroke-width", 3);

    edges.each(function () {
      const edge = d3.select(this);
      const title = edge.select("title").text();
      if (title.includes(id)) {
        edge.select("path")
          .attr("stroke", "#000")
          .attr("stroke-width", 3);
      }
    });
  });

  nodes.on("mouseleave", function () {
    const node = d3.select(this);
    node.select("polygon, ellipse, rect")
      .attr("stroke", "#000")
      .attr("stroke-width", 1);

    edges.selectAll("path")
      .attr("stroke", "#333")
      .attr("stroke-width", 1);
  });

  nodes.on("click", function () {
    const id = d3.select(this).select("title").text();
    navigate(`/journeys?filter=${encodeURIComponent(id)}`);
  });

  edges.on("click", function () {
    const transition = d3.select(this).select("title").text();
    navigate(`/journeys?transition=${encodeURIComponent(transition)}`);
  });
}
