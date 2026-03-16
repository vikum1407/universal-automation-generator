import type { BaseSel } from "./GraphTypes";

export function applyHierarchicalLayout(
  g: BaseSel,
  journeys: any[]
) {
  const levelByPage: Record<string, number> = {};

  journeys.forEach(j => {
    j.pages?.forEach((p: string, idx: number) => {
      if (levelByPage[p] === undefined) {
        levelByPage[p] = idx;
      } else {
        levelByPage[p] = Math.min(levelByPage[p], idx);
      }
    });
  });

  const pagesByLevel: Record<number, string[]> = {};
  Object.entries(levelByPage).forEach(([page, level]) => {
    if (!pagesByLevel[level]) pagesByLevel[level] = [];
    pagesByLevel[level].push(page);
  });

  const nodeByPage: Record<string, SVGGElement> = {};
  g.selectAll<SVGGElement, unknown>("g.node").each(function () {
    const node = this;
    const title = (node.querySelector("title")?.textContent || "").trim();
    if (!title) return;
    nodeByPage[title] = node;
  });

  const xStep = 220;
  const yStep = 120;
  const yStart = 40;

  Object.entries(pagesByLevel).forEach(([levelStr, pages]) => {
    const level = Number(levelStr);
    const x = 80 + level * xStep;

    pages.forEach((page, idx) => {
      const node = nodeByPage[page];
      if (!node) return;

      const y = yStart + idx * yStep;
      node.setAttribute("transform", `translate(${x},${y})`);
    });
  });
}
