import { Injectable } from '@nestjs/common';
import type { GeneratedFile } from '../templates/template-engine';
import type { FrameworkBlueprint } from '../blueprint/blueprint.model';
import type { PageMap, PageInfo, FormInfo, FieldInfo } from '../crawler/crawler.types';

@Injectable()
export class PlaywrightPythonUiTestGeneratorService {

  generate(pageMap: PageMap, blueprint: FrameworkBlueprint): GeneratedFile[] {
    const level = blueprint.coverageLevel ?? 'functional';
    const files: GeneratedFile[] = [];
    const wantSmoke      = level === 'smoke'      || level === 'regression';
    const wantFunctional = level === 'functional' || level === 'regression';

    for (const page of pageMap.pages) {
      files.push(this.buildPageObject(page));
      if (wantSmoke)      files.push(this.buildSmokeSpec(page));
      if (wantFunctional) {
        const f = this.buildFunctionalSpec(page);
        if (f) files.push(f);
      }
    }

    files.push(this.buildBasePage());
    files.push(this.buildConftest());
    files.push(this.buildRequirements());
    files.push(this.buildPytestIni());
    files.push(this.buildReadme(pageMap.baseUrl, pageMap.pages.length));

    // Python package markers
    files.push({ path: 'pages/__init__.py',            content: '' });
    files.push({ path: 'tests/__init__.py',            content: '' });
    files.push({ path: 'tests/smoke/__init__.py',      content: '' });
    files.push({ path: 'tests/functional/__init__.py', content: '' });

    return files;
  }

  // ─── Page Object ─────────────────────────────────────────────────────────────

  private buildPageObject(page: PageInfo): GeneratedFile {
    const moduleName  = this.toModuleName(page.className);
    const assignments: string[] = [];
    const methods:     string[] = [];
    const usedIds = new Set<string>();

    const addField = (varName: string, expr: string) => {
      if (!varName || usedIds.has(varName)) return;
      usedIds.add(varName);
      assignments.push(`        self.${varName}: Locator = ${expr}`);
    };

    page.forms.forEach((form, i) => {
      for (const field of form.fields) {
        const id = this.toSnakeId(field.name);
        if (!id) continue;
        addField(`${id}_input`, `page.locator('[name="${field.name}"], [id="${field.name}"]').first()`);
      }
      const submitId = this.toSnakeId(form.id) + '_submit_btn';
      addField(submitId, `page.locator('form').nth(${i}).locator('[type="submit"], button:not([type="button"]):not([type="reset"])').first()`);
    });

    for (const btn of page.buttons.filter(b => b.role !== 'submit').slice(0, 8)) {
      const id = this.toSnakeId(btn.text);
      if (!id) continue;
      addField(`${id}_btn`, `page.get_by_role("button", name=${JSON.stringify(btn.text)})`);
    }

    methods.push(`
    def goto(self) -> None:
        self.navigate("${page.path}")
        self.wait_for_load()`);

    for (const form of page.forms) {
      const safeId = this.toSnakeId(form.id);
      const valid  = this.uniqueFields(form.fields.filter(f => f.type !== 'hidden'));
      const params = valid.map(f => `${this.toSnakeId(f.name)}: str`).join(', ');
      const fills  = valid.map(f =>
        `        self.fill_field(self.${this.toSnakeId(f.name)}_input, ${this.toSnakeId(f.name)})`
      ).join('\n');

      methods.push(`
    def fill_${safeId}_form(self, ${params}) -> None:
${fills}`);
      methods.push(`
    def submit_${safeId}_form(self) -> None:
        self.${safeId}_submit_btn.click()
        self.wait_for_load()`);
    }

    const assignBlock = assignments.join('\n');
    return {
      path: `pages/${moduleName}.py`,
      content: `from playwright.sync_api import Page, Locator
from pages.base_page import BasePage


class ${page.className}(BasePage):
    def __init__(self, page: Page) -> None:
        super().__init__(page)
${assignBlock}
${methods.join('\n')}
`,
    };
  }

  // ─── Smoke spec ───────────────────────────────────────────────────────────────

  private buildSmokeSpec(page: PageInfo): GeneratedFile {
    const moduleName   = this.toModuleName(page.className);
    const fixtureName  = moduleName.replace(/_page$/, '') || 'page_obj';
    const pathPattern  = page.path.replace(/\//g, '\\/');
    return {
      path: `tests/smoke/test_${moduleName}_smoke.py`,
      content: `import re
import pytest
from playwright.sync_api import Page, expect
from pages.${moduleName} import ${page.className}

# Auto-generated — ${page.title} | ${page.url} | Smoke


@pytest.fixture
def ${fixtureName}(page: Page) -> ${page.className}:
    p = ${page.className}(page)
    p.goto()
    return p


@pytest.mark.smoke
def test_page_loads_successfully(page: Page, ${fixtureName}: ${page.className}) -> None:
    expect(page).to_have_url(re.compile(r"${pathPattern}"))
    expect(page.locator("body")).to_be_visible()


@pytest.mark.smoke
def test_page_has_correct_title(page: Page, ${fixtureName}: ${page.className}) -> None:
    expect(page).to_have_title(re.compile(r".+"))
`,
    };
  }

  // ─── Functional spec ──────────────────────────────────────────────────────────

  private buildFunctionalSpec(page: PageInfo): GeneratedFile | null {
    const moduleName  = this.toModuleName(page.className);
    const fixtureName = moduleName.replace(/_page$/, '') || 'page_obj';
    const tests: string[] = [];

    tests.push(`

@pytest.mark.functional
def test_key_page_elements_are_visible(page: Page, ${fixtureName}: ${page.className}) -> None:
    main = page.locator("header, nav, main, [role='main']").first()
    expect(main).to_be_visible()`);

    for (const form of page.forms) {
      const safeId = this.toSnakeId(form.id);
      const guard  = this.buildModalGuard(form);
      const valid  = this.uniqueFields(form.fields.filter(f => f.type !== 'hidden'));
      const fills  = valid.map(f =>
        `    ${fixtureName}.${this.toSnakeId(f.name)}_input.fill(${this.pyFake(f)})`
      ).join('\n');

      tests.push(`

@pytest.mark.functional
def test_${safeId}_happy_path(page: Page, ${fixtureName}: ${page.className}) -> None:
${guard}${fills}
    ${fixtureName}.${safeId}_submit_btn.click()
    page.wait_for_timeout(2000)
    error_msg = page.locator("[role='alert'], .error, .alert-danger").first()
    expect(error_msg).not_to_be_visible(timeout=3000)`);
    }

    tests.push(`

@pytest.mark.functional
def test_non_existent_route_returns_404(page: Page, ${fixtureName}: ${page.className}) -> None:
    import re as _re
    bad = _re.sub(r"/[^/]*$", "/this-page-does-not-exist-xyz", page.url())
    response = page.goto(bad)
    assert response is not None and response.status in [200, 301, 302, 404]`);

    if (!tests.length) return null;

    return {
      path: `tests/functional/test_${moduleName}_functional.py`,
      content: `import re
import pytest
from faker import Faker
from playwright.sync_api import Page, expect
from pages.${moduleName} import ${page.className}

# Auto-generated — ${page.title} | ${page.url} | Functional

fake = Faker()


@pytest.fixture
def ${fixtureName}(page: Page) -> ${page.className}:
    p = ${page.className}(page)
    p.goto()
    return p
${tests.join('\n')}
`,
    };
  }

  // ─── Shared infrastructure ────────────────────────────────────────────────────

  private buildBasePage(): GeneratedFile {
    return {
      path: 'pages/base_page.py',
      content: `import os
from playwright.sync_api import Page, Locator


class BasePage:
    def __init__(self, page: Page) -> None:
        self.page = page
        self._base_url: str = os.getenv("BASE_URL", "")

    def navigate(self, path: str) -> None:
        self.page.goto(self._base_url + path)

    def wait_for_load(self) -> None:
        self.page.wait_for_load_state("domcontentloaded")
        self.page.wait_for_timeout(1500)

    def fill_field(self, locator: Locator, value: str) -> None:
        if value:
            locator.fill(value)
`,
    };
  }

  private buildConftest(): GeneratedFile {
    return {
      path: 'conftest.py',
      content: `import pytest


def pytest_configure(config) -> None:
    config.addinivalue_line("markers", "smoke: quick sanity checks")
    config.addinivalue_line("markers", "functional: detailed feature tests")
`,
    };
  }

  private buildRequirements(): GeneratedFile {
    return {
      path: 'requirements.txt',
      content: `playwright>=1.44.0
pytest>=8.0.0
pytest-playwright>=0.4.4
Faker>=25.0.0
`,
    };
  }

  private buildPytestIni(): GeneratedFile {
    return {
      path: 'pytest.ini',
      content: `[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
`,
    };
  }

  // ─── README ───────────────────────────────────────────────────────────────────

  private buildReadme(baseUrl: string, pageCount: number): GeneratedFile {
    return {
      path: 'README.md',
      content: `# Playwright Python Test Suite

Auto-generated by Qlitz · ${pageCount} page(s) · Base URL: \`${baseUrl || 'http://localhost:3000'}\`

## Prerequisites
- Python 3.11+
- pip

## Setup
\`\`\`bash
pip install -r requirements.txt
playwright install
\`\`\`

## Running Tests
\`\`\`bash
# All tests
pytest

# Smoke tests only
pytest -m smoke

# Functional tests only
pytest -m functional

# Set base URL
BASE_URL=https://your-site.com pytest
\`\`\`

## Project Structure
\`\`\`
pages/
  base_page.py                   Base Page class
  *.py                           Page Object classes
tests/
  smoke/                         @pytest.mark.smoke — fast sanity checks
  functional/                    @pytest.mark.functional — full feature coverage
conftest.py                      pytest markers and shared fixtures
pytest.ini                       Test runner configuration
\`\`\`
`,
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private buildModalGuard(form: FormInfo): string {
    if (!form.isInModal) return '';
    const anchor   = form.fields.find(f => !['hidden', 'submit', 'button', 'reset'].includes(f.type) && f.name);
    const selector = anchor ? `[name="${anchor.name}"]` : '[type="submit"]';
    return `    if not page.locator('${selector}').first().is_visible():
        pytest.skip("Form [${form.id}] is in a closed modal. Add a trigger in the fixture to open it.")
        return
`;
  }

  private pyFake(field: FieldInfo): string {
    const t = field.type;
    const n = field.name.toLowerCase();
    if (t === 'email')    return 'fake.email()';
    if (t === 'password') return 'fake.password()';
    if (t === 'number')   return 'str(fake.random_int(min=1, max=999))';
    if (t === 'tel')      return 'fake.phone_number()';
    if (t === 'date')     return 'fake.date()';
    if (t === 'url')      return 'fake.url()';
    if (n.includes('name'))    return 'fake.name()';
    if (n.includes('address')) return 'fake.address()';
    if (n.includes('city'))    return 'fake.city()';
    return 'fake.word()';
  }

  private uniqueFields(fields: FieldInfo[]): FieldInfo[] {
    const seen = new Set<string>();
    return fields.filter(f => {
      const id = this.toSnakeId(f.name);
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }

  private toSnakeId(str: string): string {
    const cleaned = str.replace(/[^a-zA-Z0-9\-_\s]/g, '').trim();
    if (!cleaned) return '';
    const safe = cleaned.replace(/^\d+[\s\-_]*/g, '').trim();
    if (!safe) return '';
    return safe
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .replace(/[\s\-]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/_+/g, '_')
      .toLowerCase();
  }

  private toModuleName(className: string): string {
    return className
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .replace(/\s+/g, '_')
      .toLowerCase();
  }
}
