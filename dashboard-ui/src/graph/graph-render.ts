import * as d3 from "d3";
import type { BaseSel, SvgSelection } from "./GraphTypes";

export function renderGraph(container: HTMLDivElement, svgContent: string) {
  container.innerHTML = svgContent;

  const svgEl = container.querySelector("svg");
  if (!svgEl) throw new Error("SVG not found");

  const svg: SvgSelection = d3.select(svgEl);

  let g: BaseSel = svg.select("g");
  if (g.empty()) {
    const wrapper = svg.append("g").node() as SVGGElement;

    const children = Array.from(svgEl.childNodes).filter(
      c => c !== wrapper
    ) as SVGGraphicsElement[];

    children.forEach(c => wrapper.appendChild(c));

    g = d3.select<d3.BaseType, unknown>(wrapper);
  }

  return { g, svg };
}
