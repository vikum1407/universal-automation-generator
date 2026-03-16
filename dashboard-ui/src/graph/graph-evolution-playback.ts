import * as d3 from "d3";
import type { EvolutionDiff } from "../ai/evolution-engine";

export type EvolutionSnapshot = {
  id: string;
  diff: EvolutionDiff;
};

export function setupEvolutionPlayback(
  g: any,
  snapshots: EvolutionSnapshot[]
) {
  let index = 0;
  let playing = false;
  let speed = 1;
  let timer: d3.Timer | null = null;

  const nodes = g.selectAll("g.node");
  const edges = g.selectAll("g.edge");

  function highlightDiff(diff: EvolutionDiff) {
    nodes.select("rect").style("stroke", null).style("stroke-width", null);
    edges.select("path").style("stroke", null).style("stroke-width", null);
    nodes.style("opacity", 1);
    edges.style("opacity", 1);

    diff.addedPages.forEach(p => {
      nodes
        .filter(function (this: SVGGElement) {
          return d3.select(this).select("title").text() === p;
        })
        .select("rect")
        .style("stroke", "#22c55e")
        .style("stroke-width", "4px");
    });

    diff.removedPages.forEach(p => {
      nodes
        .filter(function (this: SVGGElement) {
          return d3.select(this).select("title").text() === p;
        })
        .transition()
        .duration(300)
        .style("opacity", 0.2);
    });

    diff.addedTransitions.forEach(t => {
      edges
        .filter(function (this: SVGGElement) {
          return d3.select(this).select("title").text() === t;
        })
        .select("path")
        .style("stroke", "#22c55e")
        .style("stroke-width", "4px");
    });

    diff.removedTransitions.forEach(t => {
      edges
        .filter(function (this: SVGGElement) {
          return d3.select(this).select("title").text() === t;
        })
        .transition()
        .duration(300)
        .style("opacity", 0.2);
    });

    diff.riskChanges.forEach(rc => {
      nodes
        .filter(function (this: SVGGElement) {
          return d3.select(this).select("title").text() === rc.page;
        })
        .select("rect")
        .style("stroke", "#f97316")
        .style("stroke-width", "4px");
    });

    diff.clusterChanges.forEach(cc => {
      nodes
        .filter(function (this: SVGGElement) {
          return d3.select(this).select("title").text() === cc.page;
        })
        .select("rect")
        .style("stroke", "#3b82f6")
        .style("stroke-width", "4px");
    });
  }

  function showSnapshot(i: number) {
    const snap = snapshots[i];
    if (!snap) return;
    highlightDiff(snap.diff);
  }

  function play() {
    if (playing) return;
    playing = true;

    timer = d3.timer(() => {
      showSnapshot(index);
      index++;

      if (index >= snapshots.length) {
        stop();
      }
    }, 1200 / speed);
  }

  function pause() {
    playing = false;
    timer?.stop();
  }

  function resume() {
    if (playing) return;
    play();
  }

  function stop() {
    playing = false;
    index = 0;
    timer?.stop();

    nodes.style("opacity", 1).select("rect").style("stroke", null);
    edges.style("opacity", 1).select("path").style("stroke", null);
  }

  function setSpeed(s: number) {
    speed = s;
    if (playing) {
      pause();
      play();
    }
  }

  function goTo(i: number) {
    index = Math.max(0, Math.min(i, snapshots.length - 1));
    showSnapshot(index);
  }

  return {
    play,
    pause,
    resume,
    stop,
    setSpeed,
    goTo,
    getIndex: () => index,
    getTotal: () => snapshots.length
  };
}
