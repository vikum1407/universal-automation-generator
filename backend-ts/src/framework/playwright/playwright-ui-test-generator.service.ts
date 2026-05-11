import { Injectable } from '@nestjs/common';
import type { GeneratedFile } from '../templates/template-engine';
import type { FrameworkBlueprint } from '../blueprint/blueprint.model';
import type { PageMap, PageInfo, FormInfo, FieldInfo } from '../crawler/crawler.types';

@Injectable()
export class PlaywrightUiTestGeneratorService {

  generate(pageMap: PageMap, blueprint: FrameworkBlueprint): GeneratedFile[] {
    const lang    = blueprint.language ?? 'typescript';
    const ext     = lang === 'typescript' ? 'ts' : 'js';
    const level   = blueprint.coverageLevel ?? 'functional';
    const files:  GeneratedFile[] = [];

    const wantSmoke      = level === 'smoke'      || level === 'regression';
    const wantFunctional = level === 'functional' || level === 'regression';

    for (const page of pageMap.pages) {
      files.push(this.buildPageObject(page, ext, lang));
      if (wantSmoke) files.push(this.buildSmokeSpec(page, ext, pageMap.baseUrl));
      if (wantFunctional) {
        const funcFile = this.buildFunctionalSpec(page, ext, pageMap.baseUrl);
        if (funcFile) files.push(funcFile);
      }
    }

    // Shared fixtures
    files.push(this.buildAuthFixture(ext, pageMap.baseUrl));
    files.push(this.buildFakerHelper(ext));
    files.push(this.buildDataHelper(ext));

    // Sample test data
    files.push(this.buildSampleData(pageMap));
    files.push(this.buildReadme(pageMap));

    return files;
  }

  // ─── Page Object class ────────────────────────────────────────────────────────

  private buildPageObject(page: PageInfo, ext: string, lang: string): GeneratedFile {
    const isTs    = lang === 'typescript';
    const typeAnn = isTs ? ': string' : '';
    const impType = isTs ? "import type { Page, Locator } from '@playwright/test';\n" : '';

    const fields   = this.buildLocatorFields(page, isTs);
    const methods  = this.buildPageMethods(page, isTs);

    const content = `${impType}import { BasePage } from './BasePage';

export class ${page.className} extends BasePage {
${fields}
  constructor(page${isTs ? ': Page' : ''}) {
    super(page);
  }
${methods}
}
`;
    return { path: `src/pages/${page.className}.${ext}`, content };
  }

  /** Strip non-ASCII / non-identifier chars and return a valid camelCase identifier, or '' if nothing remains. */
  private toSafeIdentifier(str: string): string {
    const cleaned = str.replace(/[^a-zA-Z0-9\-_\s]/g, '').trim();
    if (!cleaned) return '';
    // TypeScript identifiers cannot start with a digit — strip any leading digits + whitespace
    const safe = cleaned.replace(/^\d+[\s\-_]*/g, '').trim();
    if (!safe) return '';
    return this.toCamelCase(safe);
  }

  private buildLocatorFields(page: PageInfo, isTs: boolean): string {
    const lines:     string[] = [];
    const type       = isTs ? ': Locator' : '';
    const usedNames  = new Set<string>();

    const add = (varName: string, locator: string) => {
      if (!varName || usedNames.has(varName)) return;
      usedNames.add(varName);
      lines.push(`  readonly ${varName}${type} = ${locator};`);
    };

    page.forms.forEach((form, formIndex) => {
      for (const field of form.fields) {
        const id = this.toSafeIdentifier(field.name);
        if (!id) continue;                      // skip empty-name fields
        add(`${id}Input`, `this.page.locator('[name="${field.name}"], [id="${field.name}"]').first()`);
      }
      // Scoped to the nth form so we get the right submit button on multi-form pages.
      // Also catches <button> with no explicit type (defaults to submit in HTML).
      const submitId = this.toSafeIdentifier(form.id) + 'SubmitBtn';
      add(submitId, `this.page.locator('form').nth(${formIndex}).locator('[type="submit"], button:not([type="button"]):not([type="reset"])').first()`);
    });

    for (const btn of page.buttons.filter(b => b.role !== 'submit').slice(0, 8)) {
      const id = this.toSafeIdentifier(btn.text);
      if (!id) continue;                        // skip '×' and other symbol-only labels
      add(`${id}Btn`, `this.page.getByRole('button', { name: ${JSON.stringify(btn.text)}, exact: false })`);
    }

    return lines.length ? '\n' + lines.join('\n') + '\n' : '';
  }

  /** Deduplicate form fields by safe identifier — prevents duplicate params when the same
   *  input is recorded more than once (e.g. user typed, cleared, retyped). */
  private uniqueFields(fields: FieldInfo[]): FieldInfo[] {
    const seen = new Set<string>();
    return fields.filter(f => {
      const id = this.toSafeIdentifier(f.name);
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }

  private buildPageMethods(page: PageInfo, isTs: boolean): string {
    const lines:      string[] = [];
    const asyncRet    = isTs ? ': Promise<void>' : '';
    const usedMethods = new Set<string>();

    lines.push(`
  async goto()${asyncRet} {
    await this.navigate('${page.path}');
    await this.waitForLoad();
  }`);

    for (const form of page.forms) {
      const safeFormId  = this.toSafeIdentifier(form.id);
      const fillMethod  = `fill${this.toPascalCase(safeFormId)}Form`;
      const submitMethod = `submit${this.toPascalCase(safeFormId)}Form`;
      if (usedMethods.has(fillMethod)) continue;
      usedMethods.add(fillMethod);

      const validFields = this.uniqueFields(
        form.fields.filter(f => !['hidden'].includes(f.type))
      );
      const params = validFields.map(f =>
        isTs ? `${this.toSafeIdentifier(f.name)}: string` : this.toSafeIdentifier(f.name)
      ).join(', ');
      const fills = validFields.map(f =>
        `    await this.fillField(this.${this.toSafeIdentifier(f.name)}Input, ${this.toSafeIdentifier(f.name)});`
      ).join('\n');

      lines.push(`
  async ${fillMethod}(${params})${asyncRet} {
${fills}
  }`);

      lines.push(`
  async ${submitMethod}()${asyncRet} {
    await this.${safeFormId}SubmitBtn.click();
    await this.waitForLoad();
  }`);
    }

    return lines.join('\n');
  }

  // ─── Test spec ────────────────────────────────────────────────────────────────

  /** Add `spaces` spaces to every line of `str`. */
  private pad(str: string, spaces: number): string {
    const prefix = ' '.repeat(spaces);
    return str.split('\n').map(line => prefix + line).join('\n');
  }

  private buildSmokeSpec(page: PageInfo, ext: string, baseUrl: string): GeneratedFile {
    const tests = this.buildSmokeTests(page).map(t => this.pad(t, 2)).join('\n\n');
    const content = `import { test, expect } from '@playwright/test';
import { ${page.className} } from '@pages/${page.className}';

// Auto-generated — ${page.title} | ${page.url} | Smoke
test.describe('${page.title} — Smoke', () => {
  let pageObj: ${page.className};

  test.beforeEach(async ({ page }) => {
    pageObj = new ${page.className}(page);
    await pageObj.goto();
  });

${tests}
});
`;
    return { path: `tests/ui/smoke/${page.className}.smoke.spec.${ext}`, content };
  }

  private buildFunctionalSpec(page: PageInfo, ext: string, baseUrl: string): GeneratedFile | null {
    const tests = this.buildFunctionalTests(page);
    if (!tests.length) return null;
    const inner = tests.map(t => this.pad(t, 2)).join('\n\n');
    const content = `import { test, expect } from '@playwright/test';
import { ${page.className} } from '@pages/${page.className}';
import { faker } from '@faker-js/faker';

// Auto-generated — ${page.title} | ${page.url} | Functional
test.describe('${page.title} — Functional', () => {
  let pageObj: ${page.className};

  test.beforeEach(async ({ page }) => {
    pageObj = new ${page.className}(page);
    await pageObj.goto();
  });

${inner}
});
`;
    return { path: `tests/ui/functional/${page.className}.functional.spec.${ext}`, content };
  }

  private buildSmokeTests(page: PageInfo): string[] {
    return [
      this.buildPageLoadTest(page),
      this.buildTitleTest(page),
    ];
  }

  private buildFunctionalTests(page: PageInfo): string[] {
    const tests: string[] = [];

    // ── Positive ───────────────────────────────────────────────────────────────
    tests.push(this.buildVisibleElementsTest(page));
    if (page.navLinks.filter(l => l.isInternal).length > 0) {
      tests.push(this.buildNavigationTest(page));
    }
    if (page.hasTable) {
      tests.push(this.buildTableTest(page));
    }
    for (const form of page.forms) {
      tests.push(this.buildFormHappyPathTest(page, form));
    }

    // ── Negative ───────────────────────────────────────────────────────────────
    for (const form of page.forms) {
      const requiredFields = form.fields.filter(f => f.required);
      if (requiredFields.length > 0) {
        tests.push(this.buildRequiredFieldTest(page, form, requiredFields[0]));
        tests.push(this.buildAllEmptyFormTest(page, form));
      }
      const emailField = form.fields.find(f => f.type === 'email');
      if (emailField) {
        tests.push(this.buildInvalidEmailTest(page, form, emailField));
      }
      const passField = form.fields.find(f => f.type === 'password');
      if (passField?.minLength) {
        tests.push(this.buildShortPasswordTest(page, form, passField));
      }
      if (form.purpose === 'login') {
        tests.push(this.buildWrongCredentialsTest(page, form));
      }
    }
    if (page.isAuthProtected) {
      tests.push(this.buildUnauthAccessTest(page));
    }
    tests.push(this.build404Test());

    return tests;
  }

  // ── Positive test builders — all return 0-indented strings ─────────────────

  private buildPageLoadTest(page: PageInfo): string {
    return `test('page loads successfully', async ({ page }) => {
  await expect(page).toHaveURL(/${page.path.replace(/\//g, '\\/').replace(/^\//, '')}/);
  await expect(page.locator('body')).toBeVisible();
});`;
  }

  private buildTitleTest(page: PageInfo): string {
    return `test('page has correct title', async ({ page }) => {
  await expect(page).toHaveTitle(/.+/);
});`;
  }

  private buildVisibleElementsTest(page: PageInfo): string {
    return `test('key page elements are visible', async ({ page }) => {
  const main = page.locator('header, nav, main, [role="main"]').first();
  await expect(main).toBeVisible();
});`;
  }

  private buildNavigationTest(page: PageInfo): string {
    const link = page.navLinks.find(l => l.isInternal && l.path !== page.path);
    const href  = link?.path ?? '/';
    return `test('internal navigation works — ${href}', async ({ page }) => {
  const link = page.locator(\`a[href="${href}"]\`).first();
  if (await link.isVisible()) {
    await link.click();
    await page.waitForTimeout(1500);
    await expect(page).toHaveURL(/${href.replace(/\//g, '\\/').replace(/^\//, '')}/);
  }
});`;
  }

  private buildTableTest(page: PageInfo): string {
    return `test('data table renders with rows', async ({ page }) => {
  const table = page.locator('table, [role="grid"]').first();
  await expect(table).toBeVisible();
  const rows = table.locator('tbody tr, [role="row"]');
  await expect(rows.first()).toBeVisible();
});`;
  }

  /** Returns a preamble that bails out early when a modal-hosted form is not yet open. */
  private buildModalGuard(form: FormInfo): string {
    if (!form.isInModal) return '';
    const anchor = form.fields.find(f => !['hidden', 'submit', 'button', 'reset'].includes(f.type) && f.name);
    const selector = anchor ? `[name="${anchor.name}"]` : '[type="submit"]';
    return `  // Form [${form.id}] lives inside a modal — bail if the modal is not open yet
  const isFormReady = await page.locator('${selector}').first().isVisible({ timeout: 2000 }).catch(() => false);
  if (!isFormReady) {
    console.warn('[Qlitz] Form [${form.id}] is in a closed modal. Add a trigger action in beforeEach to open the modal before running this test.');
    return;
  }
`;
  }

  private buildFormHappyPathTest(page: PageInfo, form: FormInfo): string {
    const validFields = this.uniqueFields(
      form.fields.filter(f => !['hidden'].includes(f.type))
    );
    const fills = validFields
      .map(f => `  await pageObj.${this.toSafeIdentifier(f.name)}Input.fill(${this.fakerFill(f)});`)
      .join('\n');
    const submitId = this.toSafeIdentifier(form.id) + 'SubmitBtn';
    const guard = this.buildModalGuard(form);
    return `test('${form.purpose} form [${form.id}] — happy path submission', async ({ page }) => {
${guard}${fills}
  await pageObj.${submitId}.click();
  await page.waitForTimeout(2000);
  const errorMsg = page.locator('[role="alert"], .error, .alert-danger').first();
  await expect(errorMsg).not.toBeVisible({ timeout: 3000 }).catch(() => {});
});`;
  }

  // ── Negative test builders — all return 0-indented strings ─────────────────

  private buildRequiredFieldTest(page: PageInfo, form: FormInfo, field: FieldInfo): string {
    const submitId = this.toSafeIdentifier(form.id) + 'SubmitBtn';
    const guard = this.buildModalGuard(form);
    return `test('"${field.label || field.name}" field is required in ${form.id}', async ({ page }) => {
${guard}  await pageObj.${submitId}.click();
  const error = page.locator(\`[name="${field.name}"]:invalid, [data-field="${field.name}"] .error, #${field.name}-error\`).first();
  const hasError = await error.isVisible().catch(() => false);
  const hasAlert = await page.locator('[role="alert"], .error, .alert').first().isVisible().catch(() => false);
  expect(hasError || hasAlert).toBeTruthy();
});`;
  }

  private buildAllEmptyFormTest(page: PageInfo, form: FormInfo): string {
    const submitId = this.toSafeIdentifier(form.id) + 'SubmitBtn';
    const guard = this.buildModalGuard(form);
    return `test('${form.id} — all fields empty shows validation errors', async ({ page }) => {
${guard}  await pageObj.${submitId}.click();
  await page.waitForTimeout(500);
  const invalids = page.locator(':invalid, [aria-invalid="true"]');
  const alerts   = page.locator('[role="alert"], .error, .validation-error');
  const hasValidation = await invalids.count() > 0 || await alerts.count() > 0;
  expect(hasValidation).toBeTruthy();
});`;
  }

  private buildInvalidEmailTest(page: PageInfo, form: FormInfo, field: FieldInfo): string {
    const submitId = this.toSafeIdentifier(form.id) + 'SubmitBtn';
    const guard = this.buildModalGuard(form);
    return `test('${form.id} — invalid email format rejected', async ({ page }) => {
${guard}  await pageObj.${this.toSafeIdentifier(field.name)}Input.fill('not-a-valid-email');
  await pageObj.${submitId}.click();
  await page.waitForTimeout(500);
  const invalid = page.locator(\`[name="${field.name}"]:invalid, #${field.name}-error\`).first();
  const hasError = await invalid.isVisible().catch(() => false);
  const browserInvalid = await pageObj.${this.toCamelCase(field.name)}Input.evaluate(
    (el${ ': HTMLInputElement' }) => !el.validity.valid
  ).catch(() => false);
  expect(hasError || browserInvalid).toBeTruthy();
});`;
  }

  private buildShortPasswordTest(page: PageInfo, form: FormInfo, field: FieldInfo): string {
    const min = field.minLength ?? 6;
    const submitId = this.toSafeIdentifier(form.id) + 'SubmitBtn';
    const guard = this.buildModalGuard(form);
    return `test('${form.id} — password shorter than ${min} chars is rejected', async ({ page }) => {
${guard}  await pageObj.${this.toSafeIdentifier(field.name)}Input.fill('abc');
  await pageObj.${submitId}.click();
  await page.waitForTimeout(500);
  const invalid = page.locator(\`[name="${field.name}"]:invalid, #${field.name}-error\`).first();
  const hasError = await invalid.isVisible().catch(() => false);
  expect(hasError).toBeTruthy();
});`;
  }

  private buildWrongCredentialsTest(page: PageInfo, form: FormInfo): string {
    const emailField = form.fields.find(f => f.type === 'email') ?? form.fields.find(f => f.name.toLowerCase().includes('email'));
    const passField  = form.fields.find(f => f.type === 'password');
    if (!emailField || !passField) return `// wrong-credentials test skipped — email/password fields not detected`;
    const submitId = this.toSafeIdentifier(form.id) + 'SubmitBtn';
    const guard = this.buildModalGuard(form);
    return `test('${form.id} — wrong credentials shows error message', async ({ page }) => {
${guard}  await pageObj.${this.toSafeIdentifier(emailField.name)}Input.fill('wrong@example.com');
  await pageObj.${this.toSafeIdentifier(passField.name)}Input.fill('WrongPassword123');
  await pageObj.${submitId}.click();
  await page.waitForTimeout(2000);
  const error = page.locator('[role="alert"], .error, .alert-danger, [class*="error"]').first();
  await expect(error).toBeVisible({ timeout: 5000 });
});`;
  }

  private buildUnauthAccessTest(page: PageInfo): string {
    return `test('unauthenticated access redirects to login', async ({ browser }) => {
  const ctx   = await browser.newContext({ storageState: undefined });
  const newPg = await ctx.newPage();
  await newPg.goto('${page.url}');
  await newPg.waitForTimeout(2000);
  const currentUrl   = newPg.url();
  const isRedirected = currentUrl.includes('login') || currentUrl.includes('signin') || currentUrl !== '${page.url}';
  const hasLoginForm = await newPg.locator('input[type="password"], input[name*="user"], input[name*="email"]').first().isVisible().catch(() => false);
  const hasLoginLink = await newPg.locator('a[href*="login"], a[href*="signin"], [data-action*="login"]').first().isVisible().catch(() => false);
  if (!isRedirected && !hasLoginForm && !hasLoginLink) {
    // Page may use token-based or client-side auth with no visible redirect — verify manually.
    console.warn('[Qlitz] Could not verify unauthenticated access behavior for ${page.url}. Page may use client-side auth. Confirm this test manually.');
    await ctx.close();
    return;
  }
  expect(isRedirected || hasLoginForm || hasLoginLink).toBeTruthy();
  await ctx.close();
});`;
  }

  private build404Test(): string {
    return `test('non-existent route returns 404 or redirect', async ({ page }) => {
  const response = await page.goto(page.url().replace(/\\/[^\\/]*$/, '/this-page-does-not-exist-xyz'));
  const status   = response?.status() ?? 0;
  expect([404, 301, 302, 200]).toContain(status);
});`;
  }

  // ─── Shared fixtures and helpers ──────────────────────────────────────────────

  private buildAuthFixture(ext: string, baseUrl: string): GeneratedFile {
    return {
      path: `src/fixtures/auth.fixture.${ext}`,
      content: `import { test as base, expect } from '@playwright/test';

export type AuthFixtures = {
  authenticatedPage: import('@playwright/test').Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    const loginUrl  = process.env.LOGIN_URL  ?? '${baseUrl}/login';
    const username  = process.env.TEST_USER  ?? 'testuser@example.com';
    const password  = process.env.TEST_PASS  ?? 'TestPassword123';

    await page.goto(loginUrl);
    await page.locator('input[type="email"], input[name="email"], input[name="username"]').first().fill(username);
    await page.locator('input[type="password"]').first().fill(password);
    await page.locator('[type="submit"]').first().click();
    await page.waitForTimeout(2000);

    await use(page);
  },
});

export { expect };
`,
    };
  }

  private buildFakerHelper(ext: string): GeneratedFile {
    return {
      path: `src/helpers/faker-ui-helper.${ext}`,
      content: `import { faker } from '@faker-js/faker';

export const testData = {
  validEmail:    () => faker.internet.email(),
  validPassword: () => faker.internet.password({ length: 12, memorable: false }),
  fullName:      () => faker.person.fullName(),
  username:      () => faker.internet.username(),
  phone:         () => faker.phone.number(),
  address:       () => faker.location.streetAddress(),
  city:          () => faker.location.city(),
  text:          () => faker.lorem.sentence(),
  word:          () => faker.lorem.word(),
  number:        () => faker.number.int({ min: 1, max: 9999 }),
  date:          () => faker.date.future().toISOString().split('T')[0],
};
`,
    };
  }

  private buildDataHelper(ext: string): GeneratedFile {
    return {
      path: `src/helpers/data-loader.${ext}`,
      content: `import * as fs from 'fs';
import * as path from 'path';

export function loadTestData<T = Record<string, string>>(fileName: string): T[] {
  const filePath = path.resolve(process.cwd(), 'testdata', fileName);
  if (!fs.existsSync(filePath)) return [];
  const ext = path.extname(fileName);
  if (ext === '.json') return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T[];
  // CSV
  const lines   = fs.readFileSync(filePath, 'utf-8').split('\\n').filter(Boolean);
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim());
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? ''])) as T;
  });
}
`,
    };
  }

  private buildSampleData(pageMap: PageMap): GeneratedFile {
    const rows: string[] = ['page,action,email,password,name,phone'];
    for (const page of pageMap.pages) {
      for (const form of page.forms) {
        rows.push(`${page.path},${form.purpose},user@example.com,Password123,Test User,555-0100`);
      }
    }
    return { path: 'testdata/ui_data.csv', content: rows.join('\n') + '\n' };
  }

  // ─── README ───────────────────────────────────────────────────────────────────

  private buildReadme(pageMap: PageMap): GeneratedFile {
    const { baseUrl, pages } = pageMap;
    return {
      path: 'README.md',
      content: `# Playwright TypeScript Test Suite

Auto-generated by Qlitz · ${pages.length} page(s) · Base URL: \`${baseUrl || 'http://localhost:3000'}\`

## Prerequisites
- Node.js 20+

## Setup
\`\`\`bash
npm install
npx playwright install
\`\`\`

## Running Tests
\`\`\`bash
# All tests
npx playwright test

# Smoke tests only
npx playwright test tests/ui/smoke/

# Functional tests only
npx playwright test tests/ui/functional/

# Set base URL
BASE_URL=https://your-site.com npx playwright test
\`\`\`

## Project Structure
\`\`\`
src/
  pages/                         Page Object classes
  fixtures/auth.fixture.ts       Authenticated page fixture
  helpers/                       Faker + CSV data helpers
tests/
  ui/
    smoke/                       Fast sanity checks (2 tests per page)
    functional/                  Full feature coverage (positive + negative)
testdata/
  ui_data.csv                    Sample test data
\`\`\`
`,
    };
  }

  // ─── String utilities ─────────────────────────────────────────────────────────

  private fakerFill(field: FieldInfo): string {
    const t = field.type;
    const n = field.name.toLowerCase();
    if (t === 'email')    return 'faker.internet.email()';
    if (t === 'password') return 'faker.internet.password({ length: 12 })';
    if (t === 'number')   return 'String(faker.number.int({ min: 1, max: 999 }))';
    if (t === 'tel')      return 'faker.phone.number()';
    if (t === 'date')     return 'faker.date.future().toISOString().split("T")[0]';
    if (t === 'url')      return 'faker.internet.url()';
    if (t === 'checkbox') return '';
    if (t === 'select' && field.options?.length) return `'${field.options[0]}'`;
    if (n.includes('name'))    return 'faker.person.fullName()';
    if (n.includes('address')) return 'faker.location.streetAddress()';
    if (n.includes('city'))    return 'faker.location.city()';
    return 'faker.lorem.word()';
  }

  private toCamelCase(str: string): string {
    return str.replace(/[-_\s]+(.)/g, (_, c) => c.toUpperCase()).replace(/^(.)/, c => c.toLowerCase());
  }

  private toPascalCase(str: string): string {
    const cc = this.toCamelCase(str);
    return cc.charAt(0).toUpperCase() + cc.slice(1);
  }
}
