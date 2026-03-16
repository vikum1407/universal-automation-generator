import * as d3 from "d3";
import type { BaseSel } from "./GraphTypes";

export type PlaybackController = {
  play: (sequence: string[]) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setSpeed: (multiplier: number) => void;
};

export function setupJourneyPlayback(
  g: BaseSel,
  onStep?: (transition: string) => void
): PlaybackController {
  const edges = g.selectAll<SVGGElement, unknown>("g.edge");

  let isPlaying = false;
  let isPaused = false;
  let speed = 1;
  let currentIndex = 0;
  let sequence: string[] = [];
  let timeoutId: any = null;

  function highlight(transition: string) {
    edges.style("opacity", 0.1);

    edges.each(function () {
      const edge = d3.select(this);
      const title = edge.select("title").text();
      if (title === transition) {
        edge.style("opacity", 1);

        const path = edge.select<SVGPathElement>("path");
        if (!path.empty()) {
          const length = (path.node() as SVGPathElement).getTotalLength();
          path
            .attr("stroke-dasharray", `${length} ${length}`)
            .attr("stroke-dashoffset", length)
            .transition()
            .duration(600 / speed)
            .ease(d3.easeCubic)
            .attr("stroke-dashoffset", 0);
        }
      }
    });
  }

  function step() {
    if (!isPlaying || isPaused) return;

    if (currentIndex >= sequence.length) {
      stop();
      return;
    }

    const transition = sequence[currentIndex];
    highlight(transition);
    onStep?.(transition);

    currentIndex++;

    timeoutId = setTimeout(step, 700 / speed);
  }

  function play(seq: string[]) {
    stop();
    sequence = seq;
    currentIndex = 0;
    isPlaying = true;
    isPaused = false;
    step();
  }

  function pause() {
    if (!isPlaying) return;
    isPaused = true;
    clearTimeout(timeoutId);
  }

  function resume() {
    if (!isPlaying || !isPaused) return;
    isPaused = false;
    step();
  }

  function stop() {
    isPlaying = false;
    isPaused = false;
    currentIndex = 0;
    clearTimeout(timeoutId);
    edges.style("opacity", 1);
  }

  function setSpeed(mult: number) {
    speed = mult;
  }

  return { play, pause, resume, stop, setSpeed };
}
