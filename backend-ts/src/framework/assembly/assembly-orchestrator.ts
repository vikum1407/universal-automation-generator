import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { TemplateEngine } from '../templates/template-engine';
import { FolderBuilder } from './folder-builder';
import { FileWriter } from './file-writer';
import { ZipGenerator } from './zip-generator';
import { AIFileHeaderGenerator } from '../ai/ai-file-header-generator';
import { AIDocGenerator } from '../ai/ai-doc-generator';
import { SampleTestsService } from '../samples/sample-tests.service';
import { SwaggerParserService } from '../swagger/swagger-parser.service';
import { ApiTestGeneratorService } from '../api/api-test-generator.service';
import { PlaywrightCrawlerService } from '../crawler/playwright-crawler.service';
import { PlaywrightApiTestGeneratorService }        from '../playwright/playwright-api-test-generator.service';
import { PlaywrightJavaApiTestGeneratorService }    from '../playwright/playwright-java-api-test-generator.service';
import { PlaywrightPythonApiTestGeneratorService }  from '../playwright/playwright-python-api-test-generator.service';
import { PlaywrightUiTestGeneratorService }       from '../playwright/playwright-ui-test-generator.service';
import { PlaywrightJavaUiTestGeneratorService }   from '../playwright/playwright-java-ui-test-generator.service';
import { PlaywrightPythonUiTestGeneratorService } from '../playwright/playwright-python-ui-test-generator.service';
import { CodegenParserService }                   from '../codegen/codegen-parser.service';
import { CypressUiTestGeneratorService }          from '../cypress/cypress-ui-test-generator.service';
import { SeleniumJavaUiTestGeneratorService }     from '../selenium/selenium-java-ui-test-generator.service';
import { SeleniumPythonUiTestGeneratorService }   from '../selenium/selenium-python-ui-test-generator.service';
import { WebdriverioUiTestGeneratorService }      from '../webdriverio/webdriverio-ui-test-generator.service';
import type { FrameworkBlueprint } from '../blueprint/blueprint.model';
import type { SwaggerSummary } from '../swagger/swagger.types';

export interface AssemblyResult {
  jobId: string;
  projectName: string;
  fileCount: number;
  downloadUrl: string;
  projectStructure: string[];
  aiDocs: boolean;
  aiHeaders: boolean;
  samples: { uiTests: string[]; apiTests: string[]; hybridTests: string[] };
}

@Injectable()
export class AssemblyOrchestrator {
  private readonly logger = new Logger(AssemblyOrchestrator.name);

  constructor(
    private readonly engine:           TemplateEngine,
    private readonly folder:           FolderBuilder,
    private readonly writer:           FileWriter,
    private readonly zipper:           ZipGenerator,
    private readonly headerGen:        AIFileHeaderGenerator,
    private readonly docGen:           AIDocGenerator,
    private readonly sampleSvc:        SampleTestsService,
    private readonly swaggerParser:    SwaggerParserService,
    private readonly apiTestGen:       ApiTestGeneratorService,
    private readonly pwCrawler:        PlaywrightCrawlerService,
    private readonly pwApiGen:          PlaywrightApiTestGeneratorService,
    private readonly pwJavaApiGen:      PlaywrightJavaApiTestGeneratorService,
    private readonly pwPythonApiGen:    PlaywrightPythonApiTestGeneratorService,
    private readonly pwUiGen:          PlaywrightUiTestGeneratorService,
    private readonly pwJavaUiGen:      PlaywrightJavaUiTestGeneratorService,
    private readonly pwPythonUiGen:    PlaywrightPythonUiTestGeneratorService,
    private readonly codegenParser:    CodegenParserService,
    private readonly cypressGen:       CypressUiTestGeneratorService,
    private readonly seleniumJavaGen:  SeleniumJavaUiTestGeneratorService,
    private readonly seleniumPythonGen: SeleniumPythonUiTestGeneratorService,
    private readonly wdioGen:          WebdriverioUiTestGeneratorService,
  ) {}

  async assembleFramework(blueprint: FrameworkBlueprint): Promise<AssemblyResult> {
    const jobId       = uuidv4();
    const projectRoot = this.folder.createProjectRoot(jobId);
    const zipPath     = this.folder.getZipPath(jobId);

    const aiCfg      = blueprint.ai;
    const aiEnabled  = aiCfg?.enabled  ?? false;
    const aiHeaders  = aiEnabled && (aiCfg?.headers ?? true);
    const aiDocs     = aiEnabled && (aiCfg?.docs    ?? true);
    const safeMode   = aiCfg?.safeMode ?? true;

    // Pre-step — parse Swagger first so parsedApiBaseUrl is available to templates
    let swaggerSummary: SwaggerSummary | null = null;
    let effectiveBlueprint = blueprint;
    if (blueprint.swaggerUrl || blueprint.swaggerFile) {
      try {
        swaggerSummary = blueprint.swaggerUrl
          ? await this.swaggerParser.parseFromUrl(blueprint.swaggerUrl)
          : this.swaggerParser.parseFromContent(blueprint.swaggerFile!);
        effectiveBlueprint = { ...blueprint, parsedApiBaseUrl: swaggerSummary.baseUrl };
        this.logger.log(`Swagger parsed: ${swaggerSummary.endpoints.length} endpoints, base URL: ${swaggerSummary.baseUrl}`);
      } catch (err: any) {
        this.logger.warn(`Swagger pre-parse failed: ${err?.message}`);
      }
    }

    // Step 1 — generate template files (uses enriched blueprint with parsedApiBaseUrl)
    let files = this.engine.generate(effectiveBlueprint);

    // Step 2 — optionally inject AI file headers (modifies in-memory file content)
    let headersApplied = false;
    if (aiHeaders) {
      try {
        files = await this.headerGen.applyHeaders(files, effectiveBlueprint, safeMode);
        headersApplied = true;
      } catch (err: any) {
        this.logger.warn(`AI header step failed: ${err?.message}`);
      }
    }

    // Step 3 — write files to disk
    this.writer.writeAll(projectRoot, files);

    // Step 4 — optionally generate and write AI docs
    let docsApplied = false;
    if (aiDocs) {
      try {
        const docs = await this.docGen.generateDocs(effectiveBlueprint, safeMode);
        this.docGen.writeDocs(projectRoot, docs);
        docsApplied = docs.length > 0;
      } catch (err: any) {
        this.logger.warn(`AI doc step failed: ${err?.message}`);
      }
    }

    // Step 5 — optionally seed sample tests
    let seedResult = { uiTests: [] as string[], apiTests: [] as string[], hybridTests: [] as string[] };
    if (effectiveBlueprint.samples && Object.values(effectiveBlueprint.samples).some(Boolean)) {
      try {
        seedResult = await this.sampleSvc.seedSamples(effectiveBlueprint, projectRoot);
      } catch (err: any) {
        this.logger.warn(`Sample seeding failed: ${err?.message}`);
      }
    }

    // Step 5b — REST Assured Swagger-driven API test generation
    if (swaggerSummary && effectiveBlueprint.framework === 'restassured') {
      try {
        const tagCount = Object.keys(
          swaggerSummary.endpoints.reduce((a: Record<string,boolean>, e) => ({ ...a, [e.tag]: true }), {}),
        ).length;
        this.logger.log(`Generating REST Assured tests: ${swaggerSummary.endpoints.length} endpoints across ${tagCount} tags`);
        const apiFiles = this.apiTestGen.generate(swaggerSummary, effectiveBlueprint);
        files.push(...apiFiles);
        this.writer.writeAll(projectRoot, apiFiles);
      } catch (err: any) {
        this.logger.warn(`REST Assured test generation failed: ${err?.message}`);
      }
    }

    // Step 5c — Playwright generation (UI / API / Hybrid)
    if (effectiveBlueprint.framework === 'playwright') {
      const mode = effectiveBlueprint.playwrightMode ?? this.detectPlaywrightMode(effectiveBlueprint);

      // API mode — Swagger-driven
      if ((mode === 'api' || mode === 'hybrid') && swaggerSummary) {
        try {
          this.logger.log(`Generating Playwright API tests: ${swaggerSummary.endpoints.length} endpoints`);
          const apiLang = (effectiveBlueprint.language ?? 'typescript').toLowerCase();
          const pwApiFiles = apiLang === 'java'
            ? this.pwJavaApiGen.generate(swaggerSummary, effectiveBlueprint)
            : apiLang === 'python'
            ? this.pwPythonApiGen.generate(swaggerSummary, effectiveBlueprint)
            : this.pwApiGen.generate(swaggerSummary, effectiveBlueprint);
          files.push(...pwApiFiles);
          this.writer.writeAll(projectRoot, pwApiFiles);
        } catch (err: any) {
          this.logger.warn(`Playwright API generation failed: ${err?.message}`);
        }
      }

      // UI mode — codegen-driven or crawler-driven
      const hasUiSource = effectiveBlueprint.codegenScript || effectiveBlueprint.websiteUrl;
      if ((mode === 'ui' || mode === 'hybrid') && hasUiSource) {
        try {
          let pageMap;
          if (effectiveBlueprint.codegenScript) {
            this.logger.log('Parsing Playwright codegen script...');
            pageMap = this.codegenParser.parse(effectiveBlueprint.codegenScript);
            this.logger.log(`Codegen parsed: ${pageMap.pages.length} pages discovered`);
          } else {
            this.logger.log(`Crawling website: ${effectiveBlueprint.websiteUrl}`);
            pageMap = await this.pwCrawler.crawl(effectiveBlueprint.websiteUrl!);
            this.logger.log(`Crawl complete: ${pageMap.pages.length} pages discovered`);
          }
          const lang = (effectiveBlueprint.language ?? 'typescript').toLowerCase();
          const pwUiFiles = lang === 'java'
            ? this.pwJavaUiGen.generate(pageMap, effectiveBlueprint)
            : lang === 'python'
            ? this.pwPythonUiGen.generate(pageMap, effectiveBlueprint)
            : this.pwUiGen.generate(pageMap, effectiveBlueprint);
          files.push(...pwUiFiles);
          this.writer.writeAll(projectRoot, pwUiFiles);
        } catch (err: any) {
          this.logger.warn(`Playwright UI generation failed: ${err?.message}`);
        }
      }
    }

    // Step 5d — Cypress generation
    if (effectiveBlueprint.framework === 'cypress') {
      try {
        let pageMap = null;
        const hasUiSource = effectiveBlueprint.codegenScript || effectiveBlueprint.websiteUrl;
        if (hasUiSource) {
          if (effectiveBlueprint.codegenScript) {
            pageMap = this.codegenParser.parse(effectiveBlueprint.codegenScript);
            this.logger.log(`Codegen parsed: ${pageMap.pages.length} pages`);
          } else {
            this.logger.log(`Crawling for Cypress: ${effectiveBlueprint.websiteUrl}`);
            pageMap = await this.pwCrawler.crawl(effectiveBlueprint.websiteUrl!);
            this.logger.log(`Crawl complete: ${pageMap.pages.length} pages`);
          }
        }
        const cypressFiles = this.cypressGen.generate(pageMap, effectiveBlueprint);
        files.push(...cypressFiles);
        this.writer.writeAll(projectRoot, cypressFiles);
      } catch (err: any) {
        this.logger.warn(`Cypress generation failed: ${err?.message}`);
      }
    }

    // Step 5e — Selenium generation
    if (effectiveBlueprint.framework === 'selenium') {
      try {
        let pageMap = null;
        const hasUiSource = effectiveBlueprint.codegenScript || effectiveBlueprint.websiteUrl;
        if (hasUiSource) {
          if (effectiveBlueprint.codegenScript) {
            pageMap = this.codegenParser.parse(effectiveBlueprint.codegenScript);
            this.logger.log(`Codegen parsed: ${pageMap.pages.length} pages`);
          } else {
            this.logger.log(`Crawling for Selenium: ${effectiveBlueprint.websiteUrl}`);
            pageMap = await this.pwCrawler.crawl(effectiveBlueprint.websiteUrl!);
            this.logger.log(`Crawl complete: ${pageMap.pages.length} pages`);
          }
        }
        const seLang = (effectiveBlueprint.language ?? 'java').toLowerCase();
        const seleniumFiles = seLang === 'python'
          ? this.seleniumPythonGen.generate(pageMap, effectiveBlueprint)
          : this.seleniumJavaGen.generate(pageMap, effectiveBlueprint);
        files.push(...seleniumFiles);
        this.writer.writeAll(projectRoot, seleniumFiles);
      } catch (err: any) {
        this.logger.warn(`Selenium generation failed: ${err?.message}`);
      }
    }

    // Step 5f — WebdriverIO generation
    if (effectiveBlueprint.framework === 'webdriverio') {
      try {
        let pageMap = null;
        const hasUiSource = effectiveBlueprint.codegenScript || effectiveBlueprint.websiteUrl;
        if (hasUiSource) {
          if (effectiveBlueprint.codegenScript) {
            pageMap = this.codegenParser.parse(effectiveBlueprint.codegenScript);
            this.logger.log(`Codegen parsed: ${pageMap.pages.length} pages`);
          } else {
            this.logger.log(`Crawling for WebdriverIO: ${effectiveBlueprint.websiteUrl}`);
            pageMap = await this.pwCrawler.crawl(effectiveBlueprint.websiteUrl!);
            this.logger.log(`Crawl complete: ${pageMap.pages.length} pages`);
          }
        }
        const wdioFiles = this.wdioGen.generate(pageMap, effectiveBlueprint);
        files.push(...wdioFiles);
        this.writer.writeAll(projectRoot, wdioFiles);
      } catch (err: any) {
        this.logger.warn(`WebdriverIO generation failed: ${err?.message}`);
      }
    }

    // Step 6 — zip
    await this.zipper.zip(projectRoot, zipPath);

    return {
      jobId,
      projectName:      blueprint.metadata?.name ?? 'qlitz-framework',
      fileCount:        files.length,
      downloadUrl:      `/framework/download/${jobId}`,
      projectStructure: files.map(f => f.path).sort(),
      aiDocs:           docsApplied,
      aiHeaders:        headersApplied,
      samples:          seedResult,
    };
  }

  private detectPlaywrightMode(blueprint: FrameworkBlueprint): 'ui' | 'api' | 'hybrid' {
    const ids = (blueprint.nodes ?? []).map(n => n.nodeId);
    if (ids.includes('playwright-ts-hybrid')) return 'hybrid';
    if (ids.includes('playwright-ts-api'))    return 'api';
    return 'ui';
  }
}
