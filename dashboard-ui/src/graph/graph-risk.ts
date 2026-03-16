import * as d3 from "d3";
import type { BaseSel } from "./GraphTypes";

export function applyRiskColors(
  g: BaseSel,
  pageRisk: Record<string, string>
) {
  g.selectAll("g.node").each(function () {
    const node = d3.select(this);
    const page = node.select("title").text();
    const risk = pageRisk[page] ?? "P2";

    const shape = node.select("polygon, ellipse, rect");

    if (risk === "P0") shape.attr("fill", "#ff4d4d");
    else if (risk === "P1") shape.attr("fill", "#ff9800");
    else shape.attr("fill", "#4caf50");
  });
}
