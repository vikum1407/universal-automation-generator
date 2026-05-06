import { Injectable, Logger } from '@nestjs/common';
import { AIClient } from './ai-client';
import { AI_SYSTEM_HEADER_WRITER, fileHeaderPrompt } from './ai-prompts';
import type { GeneratedFile } from '../templates/template-engine';
import type { FrameworkBlueprint } from '../blueprint/blueprint.model';

// Files that warrant AI-written headers — must be code files the developer
// will actually open and read, not config boilerplate.
const HEADER_TARGETS = new Set([
  'pom.xml',
  'build.gradle',
  'package.json',
  'cypress.config.ts',
  'playwright.config.ts',
  'TestBase.java',
  'DriverFactory.java',
  'BasePage.java',
  'BaseTest.ts',
  'BasePage.ts',
]);

// Purpose descriptions used in the AI prompt — keys are the filename, not the full path.
const FILE_PURPOSES: Record<string, string> = {
  'pom.xml':              'Maven build descriptor — declares all test framework dependencies and plugins',
  'build.gradle':         'Gradle build descriptor — declares all test framework dependencies and tasks',
  'package.json':         'Node.js package manifest — lists runtime and dev dependencies for the test suite',
  'cypress.config.ts':    'Main Cypress configuration — sets base URL, timeouts, reporter, and specPattern',
  'playwright.config.ts': 'Main Playwright configuration — sets browsers, base URL, workers, and reporter',
  'TestBase.java':        'Root test class — initialises WebDriver, manages before/after hooks, injects listeners',
  'DriverFactory.java':   'WebDriver factory — creates and configures browser instances per execution config',
  'BasePage.java':        'Root page-object class — provides core Selenium helpers and wait utilities',
  'BaseTest.ts':          'Root test class — bootstraps the browser, manages fixtures, exposes shared utilities',
  'BasePage.ts':          'Root page-object class — wraps Playwright/Cypress locators and assertion helpers',
};

@Injectable()
export class AIFileHeaderGenerator {
  private readonly logger = new Logger(AIFileHeaderGenerator.name);

  constructor(private readonly ai: AIClient) {}

  async applyHeaders(
    files:     GeneratedFile[],
    blueprint: FrameworkBlueprint,
    safeMode:  boolean,
  ): Promise<GeneratedFile[]> {
    if (!this.ai.isConfigured()) return files;

    const framework = blueprint.framework ?? 'unknown';
    const language  = blueprint.language  ?? 'unknown';

    return Promise.all(files.map(async file => {
      const filename = file.path.split('/').pop() ?? '';
      if (!HEADER_TARGETS.has(filename)) return file;

      const purpose = FILE_PURPOSES[filename] ?? `Key file in the ${framework} test automation framework`;
      try {
        const header  = await this.ai.complete(
          AI_SYSTEM_HEADER_WRITER,
          fileHeaderPrompt(file.path, framework, language, purpose),
        );
        if (!header) return file;
        return { ...file, content: `${header}\n\n${file.content}` };
      } catch (err: any) {
        this.logger.warn(`Header generation failed for ${filename}: ${err?.message}`);
        if (!safeMode) throw err;
        return file;
      }
    }));
  }
}
