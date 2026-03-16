import * as d3 from "d3";
import type { SvgSelection, BaseSel, ZoomBehavior } from "./GraphTypes";

export function setupZoom(svg: SvgSelection, g: BaseSel): ZoomBehavior {
  const zoom = d3.zoom().on("zoom", event => {
    g.attr("transform", event.transform);
  });

  svg.call(zoom as any);

  return zoom;
}
