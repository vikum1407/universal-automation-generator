import { Injectable } from '@nestjs/common';
import type { GeneratedFile } from '../templates/template-engine';
import type { FrameworkBlueprint } from '../blueprint/blueprint.model';
import type { PageMap, PageInfo, FormInfo, FieldInfo } from '../crawler/crawler.types';

@Injectable()
export class CypressUiTestGeneratorService {

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
      if (wantSmoke)      files.push(this.buildSmokeSpec(page, ext));
      if (wantFunctional) {
        const f = this.buildFunctionalSpec(page, ext);
        if (f) files.push(f);
      }
    }

    files.push(this.buildBasePage(ext, isTs));
    files.push(this.buildCommands(ext, isTs));
    files.push(this.buildSupportEntry(ext));
    files.push(this.buildConfig(ext, isTs, map.baseUrl));
    files.push(this.buildPackageJson(isTs));
    if (isTs) files.push(this.buildTsConfig());
    files.push(this.buildReadme(map.baseUrl, map.pages.length, isTs));

    return files;
  }

  // ─── Page Object ──────────────────────────────────────────────────────────────

  private buildPageObject(page: PageInfo, ext: string, isTs: boolean): GeneratedFile {
    const chainType = isTs ? ': Cypress.Chainable<JQuery<HTMLElement>>' : '';
    const usedNames = new Set<string>();
    const getters:  string[] = [];
    const methods:  string[] = [];

    const addGetter = (name: string, selector: string) => {
      if (!name || usedNames.has(name)) return;
      usedNames.add(name);
      getters.push(`  get ${name}()${chainType} {
    return cy.get(${JSON.stringify(selector)}).first();
  }`);
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
        getters.push(`  get ${submitId}()${chainType} {
    return cy.get('form').eq(${i}).find('[type="submit"], button:not([type="button"]):not([type="reset"])').first();
  }`);
      }
    });

    for (const btn of page.buttons.filter(b => b.role !== 'submit').slice(0, 8)) {
      const id = this.toSafeId(btn.text);
      if (!id) continue;
      addGetter(`${id}Btn`, `button:contains("${btn.text.replace(/"/g, '\\"')}")`);
    }

    methods.push(`  visit()${isTs ? ': void' : ''} {
    cy.visit(${JSON.stringify(page.path)});
  }`);

    for (const form of page.forms) {
      const safeId = this.toSafeId(form.id);
      const valid  = this.uniqueFields(form.fields.filter(f => f.type !== 'hidden'));
      const params = valid.map(f => isTs ? `${this.toSafeId(f.name)}: string` : this.toSafeId(f.name)).join(', ');
      const fills  = valid.map(f =>
        `    this.${this.toSafeId(f.name)}Input.clear().type(${this.toSafeId(f.name)});`
      ).join('\n');
      methods.push(`  fill${this.toPascal(safeId)}Form(${params})${isTs ? ': void' : ''} {
${fills}
  }`);
      methods.push(`  submit${this.toPascal(safeId)}Form()${isTs ? ': void' : ''} {
    this.${safeId}SubmitBtn.click();
  }`);
    }

    const classDecl = isTs ? `export class ${page.className}` : `export class ${page.className}`;
    return {
      path: `cypress/pages/${page.className}.${ext}`,
      content: `${isTs ? "/// <reference types='cypress' />\n" : ''}${classDecl} {
${getters.join('\n\n')}

${methods.join('\n\n')}
}
`,
    };
  }

  // ─── Smoke spec ───────────────────────────────────────────────────────────────

  private buildSmokeSpec(page: PageInfo, ext: string): GeneratedFile {
    const pathRegex = page.path.replace(/\//g, '\\/').replace(/^\//, '');
    return {
      path: `cypress/e2e/smoke/${page.className}.smoke.cy.${ext}`,
      content: `import { ${page.className} } from '../../pages/${page.className}';

// Auto-generated — ${page.title} | Smoke

describe('${page.title} — Smoke', { tags: ['smoke'] }, () => {
  let pageObj${ext === 'ts' ? `: ${page.className}` : ''};

  beforeEach(() => {
    pageObj = new ${page.className}();
    pageObj.visit();
  });

  it('page loads successfully', () => {
    cy.url().should('match', /${pathRegex || ''}/);
    cy.get('body').should('be.visible');
  });

  it('page has correct title', () => {
    cy.title().should('not.be.empty');
  });
});
`,
    };
  }

  // ─── Functional spec ──────────────────────────────────────────────────────────

  private buildFunctionalSpec(page: PageInfo, ext: string): GeneratedFile | null {
    const isTs = ext === 'ts';
    const tests: string[] = [];

    tests.push(`  it('key page elements are visible', () => {
    cy.get('header, nav, main, [role="main"]').first().should('be.visible');
  });`);

    if (page.navLinks.filter(l => l.isInternal && l.path !== page.path).length > 0) {
      const link = page.navLinks.find(l => l.isInternal && l.path !== page.path)!;
      tests.push(`  it('internal navigation to ${link.path} works', () => {
    cy.get(\`a[href="${link.path}"]\`).first().then($el => {
      if ($el.is(':visible')) {
        cy.wrap($el).click();
        cy.url().should('include', '${link.path}');
      }
    });
  });`);
    }

    if (page.hasTable) {
      tests.push(`  it('data table renders with rows', () => {
    cy.get('table, [role="grid"]').first().should('be.visible');
    cy.get('tbody tr, [role="row"]').first().should('be.visible');
  });`);
    }

    for (const form of page.forms) {
      const safeId = this.toSafeId(form.id);
      const guard  = this.buildModalGuard(form);
      const valid  = this.uniqueFields(form.fields.filter(f => f.type !== 'hidden'));
      const fills  = valid.map(f => `    pageObj.${this.toSafeId(f.name)}Input.clear().type(${this.cyFaker(f)});`).join('\n');
      tests.push(`  it('${form.purpose} form [${form.id}] — happy path', () => {
${guard}${fills}
    pageObj.${safeId}SubmitBtn.click();
    cy.wait(2000);
    cy.get("[role='alert'], .error, .alert-danger").should('not.exist');
  });`);

      const reqField = form.fields.find(f => f.required && f.type !== 'hidden');
      if (reqField) {
        tests.push(`  it('${form.id} — required field validation', () => {
${guard}    pageObj.${safeId}SubmitBtn.click();
    cy.wait(500);
    cy.get(':invalid, [aria-invalid="true"], [role="alert"], .error').should('exist');
  });`);
      }
    }

    if (page.isAuthProtected) {
      tests.push(`  it('unauthenticated access redirects to login', () => {
    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.visit('${page.path}');
    cy.url().should('match', /login|signin/);
  });`);
    }

    tests.push(`  it('non-existent route is handled gracefully', () => {
    cy.request({ url: '/this-page-does-not-exist-xyz', failOnStatusCode: false })
      .its('status')
      .should('be.oneOf', [200, 301, 302, 404]);
  });`);

    if (!tests.length) return null;

    return {
      path: `cypress/e2e/functional/${page.className}.functional.cy.${ext}`,
      content: `import { faker } from '@faker-js/faker';
import { ${page.className} } from '../../pages/${page.className}';

// Auto-generated — ${page.title} | Functional

describe('${page.title} — Functional', { tags: ['functional'] }, () => {
  let pageObj${isTs ? `: ${page.className}` : ''};

  beforeEach(() => {
    pageObj = new ${page.className}();
    pageObj.visit();
  });

${tests.join('\n\n')}
});
`,
    };
  }

  // ─── Support files ────────────────────────────────────────────────────────────

  private buildBasePage(ext: string, isTs: boolean): GeneratedFile {
    return {
      path: `cypress/pages/BasePage.${ext}`,
      content: `${isTs ? "/// <reference types='cypress' />\n\n" : ''}export class BasePage {
  protected navigate(path${isTs ? ': string' : ''})${isTs ? ': void' : ''} {
    cy.visit(path);
    cy.get('body').should('be.visible');
  }

  protected waitForNetwork()${isTs ? ': void' : ''} {
    cy.intercept('**/*').as('anyRequest');
    cy.wait('@anyRequest', { timeout: 5000 }).then(() => {});
  }
}
`,
    };
  }

  private buildCommands(ext: string, isTs: boolean): GeneratedFile {
    const typeBlock = isTs ? `

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
    }
  }
}` : '';
    return {
      path: `cypress/support/commands.${ext}`,
      content: `${isTs ? "/// <reference types='cypress' />\n\n" : ''}Cypress.Commands.add('login', (email${isTs ? ': string' : ''}, password${isTs ? ': string' : ''}) => {
  cy.visit('/login');
  cy.get('input[type="email"], input[name="email"], input[name="username"]').first().type(email);
  cy.get('input[type="password"]').first().type(password);
  cy.get('[type="submit"]').first().click();
  cy.wait(2000);
});
${typeBlock}
`,
    };
  }

  private buildSupportEntry(ext: string): GeneratedFile {
    return {
      path: `cypress/support/e2e.${ext}`,
      content: `import './commands';
`,
    };
  }

  private buildConfig(ext: string, isTs: boolean, baseUrl: string): GeneratedFile {
    const url = baseUrl || 'http://localhost:3000';
    if (isTs) {
      return {
        path: 'cypress.config.ts',
        content: `import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: process.env.BASE_URL ?? '${url}',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    video: false,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 720,
  },
});
`,
      };
    }
    return {
      path: 'cypress.config.js',
      content: `const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: process.env.BASE_URL ?? '${url}',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    video: false,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 720,
  },
});
`,
    };
  }

  private buildPackageJson(isTs: boolean): GeneratedFile {
    const ext = isTs ? 'ts' : 'js';
    return {
      path: 'package.json',
      content: JSON.stringify({
        name: 'cypress-tests',
        version: '1.0.0',
        scripts: {
          test:              `cypress run`,
          'test:smoke':      `cypress run --env grepTags=smoke`,
          'test:functional': `cypress run --env grepTags=functional`,
          open:              `cypress open`,
        },
        devDependencies: {
          cypress:              '^13.13.0',
          '@faker-js/faker':    '^9.0.0',
          ...(isTs ? { typescript: '^5.5.0', 'ts-node': '^10.9.2' } : {}),
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
          lib: ['ES2020', 'DOM'],
          types: ['cypress'],
          strict: false,
          esModuleInterop: true,
          moduleResolution: 'node',
        },
        include: ['**/*.ts', 'cypress.config.ts'],
      }, null, 2) + '\n',
    };
  }

  private buildReadme(baseUrl: string, pageCount: number, isTs: boolean): GeneratedFile {
    const ext = isTs ? 'ts' : 'js';
    return {
      path: 'README.md',
      content: `# Cypress ${isTs ? 'TypeScript' : 'JavaScript'} Test Suite

Auto-generated by Qlitz · ${pageCount} page(s) · Base URL: \`${baseUrl || 'http://localhost:3000'}\`

## Prerequisites
- Node.js 20+

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

# Interactive mode
npm run open

# Set base URL
BASE_URL=https://your-site.com npm test
\`\`\`

## Project Structure
\`\`\`
cypress/
  e2e/
    smoke/                         Fast sanity checks (2 tests per page)
    functional/                    Full feature coverage (positive + negative)
  pages/                           Page Object classes
  support/
    commands.${ext}                     Custom Cypress commands (cy.login, etc.)
    e2e.${ext}                          Support file entry point
cypress.config.${ext}                   Cypress configuration
\`\`\`
`,
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private buildModalGuard(form: FormInfo): string {
    if (!form.isInModal) return '';
    const anchor   = form.fields.find(f => !['hidden', 'submit', 'button', 'reset'].includes(f.type) && f.name);
    const selector = anchor ? `[name="${anchor.name}"]` : '[type="submit"]';
    return `    cy.get(${JSON.stringify(selector)}).then($el => { if (!$el.is(':visible')) { cy.log('Form [${form.id}] is in a closed modal — open it first'); return; } });
`;
  }

  private cyFaker(field: FieldInfo): string {
    const t = field.type;
    const n = field.name.toLowerCase();
    if (t === 'email')    return 'faker.internet.email()';
    if (t === 'password') return 'faker.internet.password({ length: 12 })';
    if (t === 'number')   return 'String(faker.number.int({ min: 1, max: 999 }))';
    if (t === 'tel')      return 'faker.phone.number()';
    if (t === 'date')     return 'faker.date.future().toISOString().split("T")[0]';
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
    return this.toCamel(safe);
  }

  private toCamel(str: string): string {
    return str
      .replace(/[-_\s]+(.)/g, (_, c) => c.toUpperCase())
      .replace(/^(.)/, c => c.toLowerCase());
  }

  private toPascal(str: string): string {
    const c = this.toCamel(str);
    return c.charAt(0).toUpperCase() + c.slice(1);
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
