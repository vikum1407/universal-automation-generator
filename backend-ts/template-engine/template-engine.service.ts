import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';

export class TemplateEngine {
  loadTemplatePack(packPath: string) {
    const configPath = path.join(packPath, 'template.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    const templatesDir = path.join(packPath, config.entry);
    const files = fs.readdirSync(templatesDir);

    const templates = {};

    files.forEach(file => {
      const fullPath = path.join(templatesDir, file);
      const content = fs.readFileSync(fullPath, 'utf8');
      templates[file] = Handlebars.compile(content);
    });

    return { config, templates };
  }
}
