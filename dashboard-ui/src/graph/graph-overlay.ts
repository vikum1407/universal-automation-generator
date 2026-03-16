import * as d3 from "d3";
import type { BaseSel } from "./GraphTypes";

export function createOverlay() {
  const el = document.createElement("div");
  el.style.position = "fixed";
  el.style.pointerEvents = "none";
  el.style.padding = "6px 10px";
  el.style.background = "rgba(0,0,0,0.75)";
  el.style.color = "white";
  el.style.fontSize = "12px";
  el.style.borderRadius = "4px";
  el.style.zIndex = "9999";
  el.style.opacity = "0";
  el.style.transition = "opacity 0.15s ease";
  document.body.appendChild(el);

  function show(html: string, x: number, y: number) {
    el.innerHTML = html;
    el.style.left = `${x + 12}px`;
    el.style.top = `${y + 12}px`;
    el.style.opacity = "1";
  }

  function hide() {
    el.style.opacity = "0";
  }

  return { show, hide };
}

export function attachOverlay(
  g: BaseSel,
  overlay: ReturnType<typeof createOverlay>,
  pageRisk: Record<string, string>,
  transitions: Record<string, number>
) {
  g.selectAll("g.node")
    .on("mousemove.overlay", function (event) {
      const node = d3.select(this as SVGGElement);
      const page = node.select("title").text();
      const risk = pageRisk[page] ?? "P2";

      overlay.show(
        `<strong>${page}</strong><br/>Risk: ${risk}`,
        event.clientX,
        event.clientY
      );
    })
    .on("mouseleave.overlay", () => overlay.hide());

  g.selectAll("g.edge")
    .on("mousemove.overlay", function (event) {
      const edge = d3.select(this as SVGGElement);
      const title = edge.select("title").text();
      const freq = transitions[title] ?? 0;

      overlay.show(
        `<strong>${title}</strong><br/>Frequency: ${freq}`,
        event.clientX,
        event.clientY
      );
    })
    .on("mouseleave.overlay", () => overlay.hide());
}
