import { Injectable } from '@nestjs/common';
import type { GeneratedFile } from '../templates/template-engine';
import type { FrameworkBlueprint } from '../blueprint/blueprint.model';
import type { PageMap, PageInfo, FormInfo, FieldInfo } from '../crawler/crawler.types';

@Injectable()
export class WebdriverioUiTestGeneratorService {

  generate(pageMap: PageMap | null, blueprint: FrameworkBlueprint): GeneratedFile[] {
    const map   = pageMap ?? this.starterPageMap();
    const lang  = (blueprint.language ?? 'typescript').toLowerCase();
    const isTs  = lang !== 'javascript';
    const ext   = isTs ? 'ts' : 'js';
    const level = blueprint.coverageLevel ?? 'functional';
    const files: GeneratedFile[] = [];

    const wantSmoke      = level === 'smoke'      || level === 'regression';
    const wantFunctional = level === 'functional' || level === 'regression';

    for (const page of map.pages) {
      files.push(this.buildPageObject(page, ext, isTs));
      if (wantSmoke)      files.push(this.buildSmokeSpec(page, ext, isTs));
      if (wantFunctional) {
        const f = this.buildFunctionalSpec(page, ext, isTs);
        if (f) files.push(f);
      }
    }

    files.push(this.buildBasePage(ext, isTs));
    files.push(this.buildConfig(ext, isTs, map.baseUrl));
    files.push(this.buildPackageJson(isTs));
    if (isTs) files.push(this.buildTsConfig());
    files.push(this.buildReadme(map.baseUrl, map.pages.length, isTs));

    return files;
  }

  // ─── Page Object ──────────────────────────────────────────────────────────────

  private buildPageObject(page: PageInfo, ext: string, isTs: boolean): GeneratedFile {
    const asyncP = isTs ? ': Promise<void>' : '';
    const usedNames = new Set<string>();
    const getters:  string[] = [];
    const methods:  string[] = [];

    const addGetter = (name: string, selector: string) => {
      if (!name || usedNames.has(name)) return;
      usedNames.add(name);
      getters.push(`  get ${name}() { return $(${JSON.stringify(selector)}); }`);
    };

    page.forms.forEach((form, i) => {
      for (const field of form.fields) {
        const id = this.toSafeId(field.name);
        if (!id) continue;
        addGetter(`${id}Input`, `[name="${field.name}"], [id="${field.name}"]`);
      }
      const submitId = this.toSafeId(form.id) + 'SubmitBtn';
      if (!usedNames.has(submitId)) {
        usedNames.add(submitId);
        const nth = i === 0 ? 'form' : `form:nth-of-type(${i + 1})`;
        getters.push(`  get ${submitId}() { return $('${nth} [type="submit"], ${nth} button:not([type="button"]):not([type="reset"])'); }`);
      }
    });

    for (const btn of page.buttons.filter(b => b.role !== 'submit').slice(0, 8)) {
      const id = this.toSafeId(btn.text);
      if (!id) continue;
      addGetter(`${id}Btn`, `button=${btn.text}`);
    }

    methods.push(`  async open()${asyncP} {
    await super.open(${JSON.stringify(page.path)});
  }`);

    for (const form of page.forms) {
      const safeId = this.toSafeId(form.id);
      const valid  = this.uniqueFields(form.fields.filter(f => f.type !== 'hidden'));
      const params = valid.map(f => isTs ? `${this.toSafeId(f.name)}: string` : this.toSafeId(f.name)).join(', ');
      const fills  = valid.map(f =>
        `    await this.${this.toSafeId(f.name)}Input.setValue(${this.toSafeId(f.name)});`
      ).join('\n');

      methods.push(`  async fill${this.toPascal(safeId)}Form(${params})${asyncP} {
${fills}
  }`);
      methods.push(`  async submit${this.toPascal(safeId)}Form()${asyncP} {
    await this.${safeId}SubmitBtn.click();
    await browser.pause(1500);
  }`);
    }

    const importLine = isTs
      ? `import { BasePage } from './base.page';\n`
      : `import { BasePage } from './base.page.js';\n`;
    const exportPart = isTs
      ? `export const ${this.toLower(page.className)} = new ${page.className}();`
      : `export const ${this.toLower(page.className)} = new ${page.className}();`;

    return {
      path: `test/pageobjects/${this.toLower(page.className)}.page.${ext}`,
      content: `${importLine}
// Auto-generated — ${page.title}
class ${page.className} extends BasePage {

${getters.join('\n')}

${methods.join('\n\n')}
}

${exportPart}
`,
    };
  }

  // ─── Smoke spec ───────────────────────────────────────────────────────────────

  private buildSmokeSpec(page: PageInfo, ext: string, isTs: boolean): GeneratedFile {
    const objName  = this.toLower(page.className);
    const importPo = isTs
      ? `import { ${objName} } from '../../pageobjects/${objName}.page';`
      : `import { ${objName} } from '../../pageobjects/${objName}.page.js';`;

    return {
      path: `test/specs/smoke/${objName}.smoke.spec.${ext}`,
      content: `import { browser, $ } from '@wdio/globals';
${importPo}

// Auto-generated — ${page.title} | Smoke

describe('${page.title} — Smoke @smoke', () => {
  before(async () => {
    await ${objName}.open();
  });

  it('page loads successfully', async () => {
    const url = await browser.getUrl();
    expect(url).toContain(${JSON.stringify(page.path)});
    const body = await $('body');
    await expect(body).toBeDisplayed();
  });

  it('page has correct title', async () => {
    const title = await browser.getTitle();
    expect(title.length).toBeGreaterThan(0);
  });
});
`,
    };
  }

  // ─── Functional spec ──────────────────────────────────────────────────────────

  private buildFunctionalSpec(page: PageInfo, ext: string, isTs: boolean): GeneratedFile | null {
    const objName  = this.toLower(page.className);
    const importPo = isTs
      ? `import { ${objName} } from '../../pageobjects/${objName}.page';`
      : `import { ${objName} } from '../../pageobjects/${objName}.page.js';`;
    const tests: string[] = [];

    tests.push(`  it('key page elements are visible', async () => {
    const main = await $('header, nav, main, [role="main"]');
    await expect(main).toBeDisplayed();
  });`);

    if (page.hasTable) {
      tests.push(`  it('data table renders with rows', async () => {
    const table = await $('table, [role="grid"]');
    await expect(table).toBeDisplayed();
    const row = await $('tbody tr, [role="row"]');
    await expect(row).toBeDisplayed();
  });`);
    }

    for (const form of page.forms) {
      const safeId = this.toSafeId(form.id);
      const guard  = this.buildModalGuard(form);
      const valid  = this.uniqueFields(form.fields.filter(f => f.type !== 'hidden'));
      const fills  = valid.map(f => `    await ${objName}.${this.toSafeId(f.name)}Input.setValue(${this.wdioFaker(f)});`).join('\n');

      tests.push(`  it('${form.purpose} form [${form.id}] — happy path', async () => {
${guard}${fills}
    await ${objName}.submit${this.toPascal(safeId)}Form();
    await browser.pause(2000);
    const errorMsg = await $("[role='alert'], .error, .alert-danger");
    const hasError = await errorMsg.isDisplayed().catch(() => false);
    expect(hasError).toBe(false);
  });`);

      const reqField = form.fields.find(f => f.required && f.type !== 'hidden');
      if (reqField) {
        tests.push(`  it('${form.id} — required field validation', async () => {
${guard}    await ${objName}.submit${this.toPascal(safeId)}Form();
    await browser.pause(500);
    const invalid = await $(':invalid, [aria-invalid="true"], [role="alert"], .error');
    const hasValidation = await invalid.isExisting();
    expect(hasValidation).toBe(true);
  });`);
      }
    }

    if (page.isAuthProtected) {
      tests.push(`  it('unauthenticated access redirects to login', async () => {
    await browser.deleteCookies();
    await browser.url(${JSON.stringify(page.path)});
    await browser.pause(2000);
    const url = await browser.getUrl();
    expect(url).toMatch(/login|signin/);
  });`);
    }

    tests.push(`  it('non-existent route handled gracefully', async () => {
    const currentUrl = await browser.getUrl();
    const badUrl = currentUrl.replace(/\\/[^\\/]*$/, '/this-page-does-not-exist-xyz');
    await browser.url(badUrl);
    await browser.pause(1000);
    const body = await $('body');
    await expect(body).toExist();
  });`);

    if (!tests.length) return null;

    const fakerImport = isTs ? `import { faker } from '@faker-js/faker';\n` : `import { faker } from '@faker-js/faker';\n`;

    return {
      path: `test/specs/functional/${objName}.functional.spec.${ext}`,
      content: `import { browser, $ } from '@wdio/globals';
${fakerImport}${importPo}

// Auto-generated — ${page.title} | Functional

describe('${page.title} — Functional @functional', () => {
  before(async () => {
    await ${objName}.open();
  });

${tests.join('\n\n')}
});
`,
    };
  }

  // ─── Shared infrastructure ────────────────────────────────────────────────────

  private buildBasePage(ext: string, isTs: boolean): GeneratedFile {
    const asyncP = isTs ? ': Promise<void>' : '';
    return {
      path: `test/pageobjects/base.page.${ext}`,
      content: `import { browser } from '@wdio/globals';

export class BasePage {
  async open(path${isTs ? ': string' : ''})${asyncP} {
    await browser.url(path);
    await browser.waitUntil(
      async () => (await browser.execute(() => document.readyState)) === 'complete',
      { timeout: 10000, interval: 500 },
    );
    await browser.pause(500);
  }
}
`,
    };
  }

  private buildConfig(ext: string, isTs: boolean, baseUrl: string): GeneratedFile {
    const url = baseUrl || 'http://localhost:3000';
    if (isTs) {
      return {
        path: 'wdio.conf.ts',
        content: `import type { Options } from '@wdio/types';

export const config: Options.Testrunner = {
  runner: 'local',
  autoCompileOpts: {
    autoCompile: true,
    tsNodeOpts: { project: './tsconfig.json', transpileOnly: true },
  },
  specs: ['./test/specs/**/*.spec.ts'],
  maxInstances: 1,
  capabilities: [{
    browserName: 'chrome',
    'goog:chromeOptions': {
      args: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--window-size=1280,720'],
    },
  }],
  logLevel: 'warn',
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: { timeout: 60000 },
  baseUrl: process.env.BASE_URL ?? '${url}',
};
`,
      };
    }
    return {
      path: 'wdio.conf.js',
      content: `exports.config = {
  runner: 'local',
  specs: ['./test/specs/**/*.spec.js'],
  maxInstances: 1,
  capabilities: [{
    browserName: 'chrome',
    'goog:chromeOptions': {
      args: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--window-size=1280,720'],
    },
  }],
  logLevel: 'warn',
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: { timeout: 60000 },
  baseUrl: process.env.BASE_URL ?? '${url}',
};
`,
    };
  }

  private buildPackageJson(isTs: boolean): GeneratedFile {
    const confFile = isTs ? 'wdio.conf.ts' : 'wdio.conf.js';
    return {
      path: 'package.json',
      content: JSON.stringify({
        name: 'wdio-tests',
        version: '1.0.0',
        scripts: {
          test:              `wdio run ${confFile}`,
          'test:smoke':      `wdio run ${confFile} --grep "@smoke"`,
          'test:functional': `wdio run ${confFile} --grep "@functional"`,
        },
        devDependencies: {
          '@wdio/cli':          '^9.0.0',
          '@wdio/local-runner': '^9.0.0',
          '@wdio/mocha-framework': '^9.0.0',
          '@wdio/spec-reporter': '^9.0.0',
          '@wdio/globals':      '^9.0.0',
          '@types/mocha':       '^10.0.0',
          'chromedriver':       'latest',
          ...(isTs ? { typescript: '^5.5.0', 'ts-node': '^10.9.2' } : {}),
        },
        dependencies: {
          '@faker-js/faker': '^9.0.0',
        },
      }, null, 2) + '\n',
    };
  }

  private buildTsConfig(): GeneratedFile {
    return {
      path: 'tsconfig.json',
      content: JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          module: 'commonjs',
          lib: ['ES2020'],
          strict: false,
          esModuleInterop: true,
          moduleResolution: 'node',
          types: ['node', '@wdio/globals/types', 'mocha'],
        },
        include: ['test/**/*.ts', 'wdio.conf.ts'],
      }, null, 2) + '\n',
    };
  }

  private buildReadme(baseUrl: string, pageCount: number, isTs: boolean): GeneratedFile {
    const ext = isTs ? 'ts' : 'js';
    return {
      path: 'README.md',
      content: `# WebdriverIO ${isTs ? 'TypeScript' : 'JavaScript'} Test Suite

Auto-generated by Qlitz · ${pageCount} page(s) · Base URL: \`${baseUrl || 'http://localhost:3000'}\`

## Prerequisites
- Node.js 20+
- Google Chrome

## Setup
\`\`\`bash
npm install
\`\`\`

## Running Tests
\`\`\`bash
# All tests
npm test

# Smoke tests only
npm run test:smoke

# Functional tests only
npm run test:functional

# Set base URL
BASE_URL=https://your-site.com npm test
\`\`\`

## Project Structure
\`\`\`
test/
  pageobjects/
    base.page.${ext}           Base Page with browser helpers
    *.page.${ext}              Page Object classes
  specs/
    smoke/                 @smoke — fast sanity checks (2 tests per page)
    functional/            @functional — full feature coverage
wdio.conf.${ext}               WebdriverIO configuration
\`\`\`
`,
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private buildModalGuard(form: FormInfo): string {
    if (!form.isInModal) return '';
    const anchor   = form.fields.find(f => !['hidden', 'submit', 'button', 'reset'].includes(f.type) && f.name);
    const selector = anchor ? `[name="${anchor.name}"]` : '[type="submit"]';
    return `    const formEl = await $(${JSON.stringify(selector)});
    if (!(await formEl.isDisplayed().catch(() => false))) {
      console.warn('[Qlitz] Form [${form.id}] is in a closed modal — add a trigger to open it.');
      return;
    }
`;
  }

  private wdioFaker(field: FieldInfo): string {
    const t = field.type;
    const n = field.name.toLowerCase();
    if (t === 'email')    return 'faker.internet.email()';
    if (t === 'password') return 'faker.internet.password({ length: 12 })';
    if (t === 'number')   return 'String(faker.number.int({ min: 1, max: 999 }))';
    if (t === 'tel')      return 'faker.phone.number()';
    if (t === 'date')     return "faker.date.future().toISOString().split('T')[0]";
    if (t === 'url')      return 'faker.internet.url()';
    if (n.includes('name'))    return 'faker.person.fullName()';
    if (n.includes('address')) return 'faker.location.streetAddress()';
    if (n.includes('city'))    return 'faker.location.city()';
    return 'faker.lorem.word()';
  }

  private uniqueFields(fields: FieldInfo[]): FieldInfo[] {
    const seen = new Set<string>();
    return fields.filter(f => {
      const id = this.toSafeId(f.name);
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }

  private toSafeId(str: string): string {
    const cleaned = str.replace(/[^a-zA-Z0-9\-_\s]/g, '').trim();
    if (!cleaned) return '';
    const safe = cleaned.replace(/^\d+[\s\-_]*/g, '').trim();
    if (!safe) return '';
    return safe
      .replace(/[-_\s]+(.)/g, (_, c: string) => c.toUpperCase())
      .replace(/^(.)/, (c: string) => c.toLowerCase());
  }

  private toPascal(str: string): string {
    const c = this.toSafeId(str);
    return c.charAt(0).toUpperCase() + c.slice(1);
  }

  private toLower(className: string): string {
    return className.charAt(0).toLowerCase() + className.slice(1);
  }

  private starterPageMap(): PageMap {
    return {
      baseUrl: 'http://localhost:3000',
      pages: [{
        className:       'HomePage',
        title:           'Home Page',
        url:             'http://localhost:3000/',
        path:            '/',
        forms:           [],
        buttons:         [],
        navLinks:        [],
        headings:        [],
        hasTable:        false,
        hasModal:        false,
        isAuthProtected: false,
      }],
      crawledAt: new Date().toISOString(),
    };
  }
}
