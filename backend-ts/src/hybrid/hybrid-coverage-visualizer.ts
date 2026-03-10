import * as fs from 'fs';
import * as path from 'path';
import { HybridCoverageMap } from './hybrid-coverage-map';

export class HybridCoverageVisualizer {
  generateSvg(outputDir: string) {
    const coveragePath = path.join(outputDir, 'coverage.json');

    if (!fs.existsSync(coveragePath)) {
      throw new Error(`Coverage file not found at ${coveragePath}. Run hybrid pipeline first.`);
    }

    const coverage: HybridCoverageMap = JSON.parse(
      fs.readFileSync(coveragePath, 'utf-8')
    );

    const nodes = new Set<string>();
    const edges: { from: string; to: string; label?: string }[] = [];

    coverage.flowCoverage.forEach(flow => {
      const steps = flow.flow;

      steps.forEach(step => nodes.add(step));

      for (let i = 0; i < steps.length - 1; i++) {
        edges.push({
          from: steps[i],
          to: steps[i + 1],
          label: 'UI'
        });
      }

      flow.apiCalls.forEach(api => {
        if (api.url) {
          nodes.add(api.url);
          edges.push({
            from: steps[steps.length - 1],
            to: api.url,
            label: api.method ?? 'API'
          });
        }
      });
    });

    const svg = this.buildSvg(Array.from(nodes), edges);

    const svgPath = path.join(outputDir, 'coverage.svg');
    fs.writeFileSync(svgPath, svg);

    return svgPath;
  }

  private buildSvg(nodes: string[], edges: { from: string; to: string; label?: string }[]): string {
    const nodePositions: Record<string, { x: number; y: number }> = {};

    nodes.forEach((node, i) => {
      nodePositions[node] = {
        x: 200 + (i % 5) * 250,
        y: 100 + Math.floor(i / 5) * 200
      };
    });

    const svgNodes = nodes
      .map(n => {
        const pos = nodePositions[n];
        return `
      <g>
        <rect x="${pos.x - 80}" y="${pos.y - 20}" width="160" height="40" rx="6" fill="#1e88e5" stroke="#0d47a1" stroke-width="2"/>
        <text x="${pos.x}" y="${pos.y + 5}" font-size="14" fill="#fff" text-anchor="middle">${n}</text>
      </g>`;
      })
      .join('\n');

    const svgEdges = edges
      .map(e => {
        const from = nodePositions[e.from];
        const to = nodePositions[e.to];

        return `
      <g>
        <line x1="${from.x}" y1="${from.y + 20}" x2="${to.x}" y2="${to.y - 20}" stroke="#555" stroke-width="2" marker-end="url(#arrow)"/>
        <text x="${(from.x + to.x) / 2}" y="${(from.y + to.y) / 2 - 5}" font-size="12" fill="#333" text-anchor="middle">${e.label ?? ''}</text>
      </g>`;
      })
      .join('\n');

    return `
<svg width="1600" height="1200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L9,3 z" fill="#555"/>
    </marker>
  </defs>

  ${svgEdges}
  ${svgNodes}
</svg>`;
  }
}
