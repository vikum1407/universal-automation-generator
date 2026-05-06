import { Injectable } from '@nestjs/common';
import { NodeLibraryService } from '../nodes/node-library.service';
import type { FrameworkBlueprint } from '../blueprint/blueprint.model';

@Injectable()
export class TemplateResolver {
  constructor(private readonly nodeLibrary: NodeLibraryService) {}

  resolve(blueprint: FrameworkBlueprint): string[] {
    const dirs: string[] = [];
    const seen = new Set<string>();

    const enqueue = (nodeId: string) => {
      const node = this.nodeLibrary.getNodeById(nodeId);
      if (!node) return;
      for (const t of node.templates) {
        if (!seen.has(t)) { seen.add(t); dirs.push(t); }
      }
    };

    if (blueprint.architecture) enqueue(blueprint.architecture);
    for (const comp of blueprint.nodes ?? []) enqueue(comp.nodeId);

    return dirs;
  }
}
