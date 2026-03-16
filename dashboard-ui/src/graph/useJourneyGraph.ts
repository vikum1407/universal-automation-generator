import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { renderGraph } from "./graph-render";
import { applyRiskColors } from "./graph-risk";
import { applyFrequencyThickness } from "./graph-frequency";
import { applyClusterColors } from "./graph-clusters";
import { renderClusterLegend } from "./graph-cluster-legend";
import { setupZoom } from "./graph-zoom";
import { setupMiniMap } from "./graph-minimap";
import { setupInteractions } from "./graph-interactions";
import { fitToScreenFactory } from "./graph-fit";
import { createOverlay, attachOverlay } from "./graph-overlay";
import { setupGraphSearch } from "./graph-search";
import { setupPathHighlighting } from "./graph-paths";
import { setupAnimatedPaths } from "./graph-animate";
import { setupJourneyPlayback } from "./graph-playback";
import { exportSVG, exportPNG } from "./graph-export";

import { applyHeatmap } from "./graph-heatmap";

export function useJourneyGraph(
  containerRef: React.RefObject<HTMLDivElement | null>,
  miniMapRef: React.RefObject<HTMLDivElement | null>,
  journeys: any[],
  coverage: any,
  svgContent: string
) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!containerRef.current || !miniMapRef.current) return;
    if (!svgContent) return;

    const { g, svg } = renderGraph(containerRef.current, svgContent);

    const pageRisk: Record<string, string> = {};
    const pageCluster: Record<string, string> = {};

    journeys.forEach(j => {
      const priority = j.risk?.priority ?? "P2";
      const cluster = j.cluster ?? "default";

      j.pages?.forEach((p: string) => {
        pageCluster[p] = cluster;

        if (priority === "P0") pageRisk[p] = "P0";
        else if (priority === "P1" && pageRisk[p] !== "P0") pageRisk[p] = "P1";
        else if (!pageRisk[p]) pageRisk[p] = "P2";
      });
    });

    applyRiskColors(g, pageRisk);
    applyFrequencyThickness(g, coverage.transitions || {});

    const { clusters, color } = applyClusterColors(g, pageCluster);

    const zoom = setupZoom(svg, g);

    setupMiniMap(miniMapRef.current, g, containerRef.current, zoom, svg);

    setupInteractions(g, navigate);

    const overlay = createOverlay();
    attachOverlay(g, overlay, pageRisk, coverage.transitions || {});

    setupPathHighlighting(g);
    setupAnimatedPaths(g);

    const playback = setupJourneyPlayback(g);

    const fitToScreen = fitToScreenFactory(
      containerRef.current,
      svg,
      g,
      zoom
    );

    fitToScreen();

    const legendContainer = document.getElementById("cluster-legend");
    if (legendContainer) {
      renderClusterLegend(
        legendContainer as HTMLDivElement,
        clusters,
        color
      );
    }

    const searchInput = document.getElementById("graph-search") as HTMLInputElement | null;
    if (searchInput) {
      setupGraphSearch(g, searchInput);
    }

    const playBtn = document.getElementById("play-journey");
    const pauseBtn = document.getElementById("pause-journey");
    const resumeBtn = document.getElementById("resume-journey");
    const restartBtn = document.getElementById("restart-journey");
    const speedSelect = document.getElementById("playback-speed") as HTMLSelectElement | null;

    playBtn?.addEventListener("click", () => {
      const j = journeys[0];
      if (!j) return;
      const seq = j.pages.slice(0, -1).map((p: string, i: number) => `${p} → ${j.pages[i + 1]}`);
      playback.play(seq);
    });

    pauseBtn?.addEventListener("click", () => playback.pause());
    resumeBtn?.addEventListener("click", () => playback.resume());
    restartBtn?.addEventListener("click", () => playback.stop());

    speedSelect?.addEventListener("change", () => {
      playback.setSpeed(Number(speedSelect.value));
    });

    const exportSvgBtn = document.getElementById("export-svg");
    const exportPngBtn = document.getElementById("export-png");

    exportSvgBtn?.addEventListener("click", () => {
      exportSVG(svg.node() as SVGSVGElement);
    });

    exportPngBtn?.addEventListener("click", () => {
      exportPNG(svg.node() as SVGSVGElement);
    });

    // Heatmap
    const heatSelect = document.getElementById("heatmap-mode") as HTMLSelectElement | null;

    const transitionFrequency: Record<string, number> = coverage.transitions || {};

    const clusterRisk: Record<string, number> = {};
    journeys.forEach(j => {
      const cluster = j.cluster ?? "default";
      const score =
        j.risk?.priority === "P0" ? 1 :
        j.risk?.priority === "P1" ? 0.7 :
        0.3;

      clusterRisk[cluster] = Math.max(clusterRisk[cluster] || 0, score);
    });

    const journeyRisk =
      journeys.length === 0
        ? 0.3
        : Math.max(
            ...journeys.map(j =>
              j.risk?.priority === "P0" ? 1 :
              j.risk?.priority === "P1" ? 0.7 :
              0.3
            )
          );

    function applyCurrentHeatmap() {
      const mode = (heatSelect?.value || "none") as any;
      applyHeatmap(g, mode, pageRisk, transitionFrequency, clusterRisk, journeyRisk);
    }

    heatSelect?.addEventListener("change", applyCurrentHeatmap);
    applyCurrentHeatmap();

  }, [containerRef, miniMapRef, journeys, coverage, svgContent, navigate]);
}
