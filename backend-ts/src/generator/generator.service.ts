import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import * as archiver from 'archiver';
import { ServiceMetadata } from '../metadata/metadata.model';

export class GeneratorService {
  async generate(templateName: string, metadata: ServiceMetadata): Promise<Buffer> {
    const pluginsPath = path.join(process.cwd(), 'qlitz-plugins.json');
    const plugins = JSON.parse(fs.readFileSync(pluginsPath, 'utf8'));

    if (!plugins[templateName]) {
      throw new Error(`Template pack not found: ${templateName}`);
    }

    const packPath = path.join(process.cwd(), plugins[templateName].path);
    const configPath = path.join(packPath, 'template.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    const templatesDir = path.join(packPath, config.entry);
    const templateFiles = fs.readdirSync(templatesDir);

    const compiledTemplates: Record<string, Handlebars.TemplateDelegate> = {};
    templateFiles.forEach(file => {
      const fullPath = path.join(templatesDir, file);
      const content = fs.readFileSync(fullPath, 'utf8');
      compiledTemplates[file] = Handlebars.compile(content);
    });

    // Create unique temp directory
    const tempDir = path.join(process.cwd(), `temp-${Date.now()}`);
    fs.mkdirSync(tempDir);

    // Create folders based on template type
    if (templateName === 'api-playwright') {
      fs.mkdirSync(path.join(tempDir, 'tests'));
      fs.mkdirSync(path.join(tempDir, 'utils'));
    }

    if (templateName === 'ui-playwright') {
      fs.mkdirSync(path.join(tempDir, 'tests'));
      fs.mkdirSync(path.join(tempDir, 'pages'));
    }

    // package.json
    if (compiledTemplates['package.json.hbs']) {
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        compiledTemplates['package.json.hbs']({})
      );
    }

    // playwright.config.ts
    if (compiledTemplates['playwright.config.ts.hbs']) {
      fs.writeFileSync(
        path.join(tempDir, 'playwright.config.ts'),
        compiledTemplates['playwright.config.ts.hbs']({})
      );
    }

    // env.ts
    if (compiledTemplates['env.ts.hbs']) {
      fs.writeFileSync(
        path.join(tempDir, 'env.ts'),
        compiledTemplates['env.ts.hbs']({})
      );
    }

    // Environment files
    fs.writeFileSync(path.join(tempDir, '.env.dev'), `BASE_URL=${metadata.baseUrl}\n`);
    fs.writeFileSync(path.join(tempDir, '.env.stage'), `BASE_URL=${metadata.baseUrl}\n`);
    fs.writeFileSync(path.join(tempDir, '.env.prod'), `BASE_URL=${metadata.baseUrl}\n`);

    // API template pack
    if (templateName === 'api-playwright') {
      if (compiledTemplates['apiClient.ts.hbs']) {
        fs.writeFileSync(
          path.join(tempDir, 'utils', 'apiClient.ts'),
          compiledTemplates['apiClient.ts.hbs']({})
        );
      }

      const testTemplate = compiledTemplates['api-test.hbs'];

      metadata.endpoints.forEach((ep, index) => {
        const output = testTemplate({
          name: `${ep.method} ${ep.path}`,
          methodLower: ep.method.toLowerCase(),
          path: ep.path,
          expectedStatus: ep.responses[0]?.statusCode || 200
        });

        fs.writeFileSync(
          path.join(tempDir, 'tests', `test_${index + 1}.spec.ts`),
          output
        );
      });
    }

    // UI template pack
    if (templateName === 'ui-playwright') {
      const uiFiles = [
        'home.spec.ts.hbs',
        'login.spec.ts.hbs',
        'HomePage.ts.hbs',
        'LoginPage.ts.hbs'
      ];

      uiFiles.forEach(file => {
        if (!compiledTemplates[file]) return;

        const output = compiledTemplates[file]({});

        if (file.endsWith('.spec.ts.hbs')) {
          fs.writeFileSync(
            path.join(tempDir, 'tests', file.replace('.hbs', '')),
            output
          );
        } else {
          fs.writeFileSync(
            path.join(tempDir, 'pages', file.replace('.hbs', '')),
            output
          );
        }
      });
    }

    // ZIP creation (final, stable version)
    const zipPath = path.join(process.cwd(), `qlitz-${Date.now()}.zip`);
    const outputZip = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(outputZip);
    archive.directory(tempDir, false);

    await archive.finalize();

    await new Promise<void>((resolve, reject) => {
      outputZip.on('close', resolve);
      outputZip.on('finish', resolve);
      outputZip.on('end', resolve);
      outputZip.on('error', reject);
    });

    const zipBuffer = fs.readFileSync(zipPath);

    // Cleanup temp folder
    fs.rmSync(tempDir, { recursive: true, force: true });

    return zipBuffer;
  }
}
