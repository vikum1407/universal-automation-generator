import { Injectable } from '@nestjs/common';
import { TemplateLoader } from './template-loader';
import { TemplateResolver } from './template-resolver';
import { PlaceholderEngine } from './placeholder-engine';
import type { FrameworkBlueprint } from '../blueprint/blueprint.model';

export interface GeneratedFile {
  path: string;
  content: string;
}

@Injectable()
export class TemplateEngine {
  constructor(
    private readonly loader:      TemplateLoader,
    private readonly resolver:    TemplateResolver,
    private readonly placeholder: PlaceholderEngine,
  ) {}

  generate(blueprint: FrameworkBlueprint): GeneratedFile[] {
    const templateDirs = this.resolver.resolve(blueprint);
    const context      = this.placeholder.buildContext(blueprint);

    const generated: GeneratedFile[] = [];
    const seen = new Set<string>();

    for (const dir of templateDirs) {
      for (const file of this.loader.loadDirectory(dir)) {
        const outPath = this.placeholder.applyToPath(file.path, context);
        if (seen.has(outPath)) continue; // first template wins (architecture takes priority)
        seen.add(outPath);
        generated.push({
          path:    outPath,
          content: this.placeholder.apply(file.content, context),
        });
      }
    }

    return generated;
  }
}
