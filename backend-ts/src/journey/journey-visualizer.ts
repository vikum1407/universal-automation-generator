import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { Journey } from './journey-model';

export class JourneyVisualizer {
  generate(journeys: Journey[], outputDir: string) {
    const dot = this.buildDot(journeys);
    const dotPath = path.join(outputDir, 'journeys.dot');
    const svgPath = path.join(outputDir, 'journeys.svg');
    const jsonPath = path.join(outputDir, 'journeys.json');

    fs.writeFileSync(dotPath, dot, 'utf-8');

    try {
      execSync(`dot -Tsvg "${dotPath}" -o "${svgPath}"`);
      console.log('[JOURNEY] journeys.svg generated');
    } catch (err) {
      console.warn('[JOURNEY] GraphViz not installed. Skipping SVG generation.');
    }

    fs.writeFileSync(jsonPath, JSON.stringify(journeys, null, 2));
    console.log('[JOURNEY] journeys.json written');

    return { dotPath, svgPath, jsonPath };
  }

  private buildDot(journeys: Journey[]): string {
    const lines: string[] = [];
    lines.push('digraph Journeys {');
    lines.push('  rankdir=LR;');
    lines.push('  node [shape=box, style=rounded, fontsize=10];');

    const edges = new Set<string>();

    for (const j of journeys) {
      for (const step of j.steps) {
        const key = `${step.from} -> ${step.to}`;
        if (!edges.has(key)) {
          edges.add(key);
          lines.push(`  "${step.from}" -> "${step.to}" [label="${step.action || ''}"];`);
        }
      }
    }

    lines.push('}');
    return lines.join('\n');
  }
}
