import * as d3 from "d3";
import type { BaseSel } from "./GraphTypes";

export function setupAnimatedPaths(g: BaseSel) {
  const edges = g.selectAll<SVGGElement, unknown>("g.edge");

  function animateEdge(edge: d3.Selection<SVGGElement, unknown, null, undefined>) {
    const path = edge.select<SVGPathElement>("path");
    if (path.empty()) return;

    const length = (path.node() as SVGPathElement).getTotalLength();

    path
      .attr("stroke-dasharray", `${length} ${length}`)
      .attr("stroke-dashoffset", length)
      .transition()
      .duration(900)
      .ease(d3.easeCubic)
      .attr("stroke-dashoffset", 0);
  }

  function animatePathSequence(sequence: string[]) {
    let delay = 0;

    sequence.forEach(transition => {
      edges.each(function () {
        const edge = d3.select(this);
        const title = edge.select("title").text();
        if (title === transition) {
          setTimeout(() => animateEdge(edge), delay);
          delay += 300;
        }
      });
    });
  }

  edges.on("click.animate", function () {
    const transition = d3.select(this).select("title").text();
    animatePathSequence([transition]);
  });

  g.selectAll("g.node").on("click.animate", function () {
    const page = d3.select(this).select("title").text();
    const sequence: string[] = [];

    edges.each(function () {
      const edge = d3.select(this);
      const title = edge.select("title").text();
      if (title.startsWith(page + " →")) sequence.push(title);
    });

    if (sequence.length > 0) animatePathSequence(sequence);
  });
}
