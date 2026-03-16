import * as d3 from "d3";
import type { BaseSel } from "./GraphTypes";

export function setupGraphSearch(
  g: BaseSel,
  input: HTMLInputElement
) {
  const nodes = g.selectAll<SVGGElement, unknown>("g.node");
  const edges = g.selectAll<SVGGElement, unknown>("g.edge");

  function applySearch(query: string) {
    const q = query.trim().toLowerCase();

    if (!q) {
      nodes.style("opacity", 1);
      edges.style("opacity", 1);
      return;
    }

    nodes.each(function () {
      const node = d3.select(this);
      const title = node.select("title").text().toLowerCase();
      const match = title.includes(q);
      node.style("opacity", match ? 1 : 0.15);
    });

    edges.each(function () {
      const edge = d3.select(this);
      const title = edge.select("title").text().toLowerCase();
      const match = title.includes(q);
      edge.style("opacity", match ? 1 : 0.1);
    });
  }

  input.addEventListener("input", () => {
    applySearch(input.value);
  });
}
