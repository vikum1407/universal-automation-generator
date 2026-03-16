import * as d3 from "d3";
import type { BaseSel, SvgSelection, ZoomBehavior, Transform } from "./GraphTypes";

const MINI_SIZE = 200;
const MINI_SCALE = 0.18;

export function setupMiniMap(
  miniMapContainer: HTMLDivElement,
  g: BaseSel,
  container: HTMLDivElement,
  zoom: ZoomBehavior,
  svg: SvgSelection
) {
  miniMapContainer.innerHTML = "";

  const miniSvg = d3
    .select(miniMapContainer)
    .append("svg")
    .attr("width", MINI_SIZE)
    .attr("height", MINI_SIZE)
    .style("background", "rgba(255,255,255,0.9)")
    .style("border", "1px solid #ccc")
    .style("border-radius", "6px");

  const miniG = miniSvg.append("g");
  const cloned = (g.node() as SVGGElement).cloneNode(true) as SVGGElement;
  miniG.node()?.appendChild(cloned);

  miniG.attr("transform", `scale(${MINI_SCALE})`);

  const viewport = miniSvg
    .append("rect")
    .attr("stroke", "#007bff")
    .attr("fill", "rgba(0,123,255,0.15)")
    .attr("stroke-width", 1.5);

  function updateMiniViewport(transform: Transform) {
    const inv = transform.invert([0, 0]);
    const invBR = transform.invert([container.clientWidth, container.clientHeight]);

    viewport
      .attr("x", inv[0] * MINI_SCALE)
      .attr("y", inv[1] * MINI_SCALE)
      .attr("width", (invBR[0] - inv[0]) * MINI_SCALE)
      .attr("height", (invBR[1] - inv[1]) * MINI_SCALE);
  }

  miniSvg.on("click", function (event) {
    const [mx, my] = d3.pointer(event);
    const targetX = mx / MINI_SCALE;
    const targetY = my / MINI_SCALE;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const transform = d3.zoomIdentity
      .translate(width / 2 - targetX, height / 2 - targetY)
      .scale(1);

    svg.transition().duration(300).call(zoom.transform as any, transform);
  });

  return updateMiniViewport;
}
