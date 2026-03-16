import * as d3 from "d3";
import type { BaseSel } from "./GraphTypes";

export function setupPathHighlighting(g: BaseSel) {
  const nodes = g.selectAll<SVGGElement, unknown>("g.node");
  const edges = g.selectAll<SVGGElement, unknown>("g.edge");

  function clear() {
    nodes.style("opacity", 1);
    edges.style("opacity", 1);
  }

  function highlightNode(page: string) {
    nodes.each(function () {
      const node = d3.select(this);
      const title = node.select("title").text();
      node.style("opacity", title === page ? 1 : 0.15);
    });

    edges.each(function () {
      const edge = d3.select(this);
      const title = edge.select("title").text();
      const match = title.startsWith(page + " →") || title.endsWith("→ " + page);
      edge.style("opacity", match ? 1 : 0.1);
    });
  }

  function highlightEdge(transition: string) {
    edges.each(function () {
      const edge = d3.select(this);
      const title = edge.select("title").text();
      edge.style("opacity", title === transition ? 1 : 0.1);
    });

    const [from, to] = transition.split("→").map(s => s.trim());

    nodes.each(function () {
      const node = d3.select(this);
      const title = node.select("title").text();
      const match = title === from || title === to;
      node.style("opacity", match ? 1 : 0.15);
    });
  }

  nodes.on("click.path", function () {
    const page = d3.select(this).select("title").text();
    highlightNode(page);
  });

  edges.on("click.path", function () {
    const transition = d3.select(this).select("title").text();
    highlightEdge(transition);
  });

  g.on("click.background", function (event) {
    if (event.target === g.node()) clear();
  });
}
