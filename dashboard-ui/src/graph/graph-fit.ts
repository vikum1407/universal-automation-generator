import * as d3 from "d3";

export function fitToScreenFactory(
  container: HTMLDivElement,
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  g: d3.Selection<d3.BaseType, unknown, null, undefined>,
  zoom: d3.ZoomBehavior<Element, unknown>
) {
  return function fitToScreen() {
    const bbox = (g.node() as SVGGElement).getBBox();
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scale = Math.min(width / bbox.width, height / bbox.height) * 0.9;

    const translateX = (width - bbox.width * scale) / 2 - bbox.x * scale;
    const translateY = (height - bbox.height * scale) / 2 - bbox.y * scale;

    svg
      .transition()
      .duration(600)
      .call(
        zoom.transform as any,
        d3.zoomIdentity.translate(translateX, translateY).scale(scale)
      );
  };
}
