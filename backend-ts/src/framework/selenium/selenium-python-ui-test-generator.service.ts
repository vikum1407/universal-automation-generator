import { Injectable } from '@nestjs/common';
import type { GeneratedFile } from '../templates/template-engine';
import type { FrameworkBlueprint } from '../blueprint/blueprint.model';
import type { PageMap, PageInfo, FormInfo, FieldInfo } from '../crawler/crawler.types';

@Injectable()
export class SeleniumPythonUiTestGeneratorService {

  generate(pageMap: PageMap | null, blueprint: FrameworkBlueprint): GeneratedFile[] {
    const map   = pageMap ?? this.starterPageMap();
    const level = blueprint.coverageLevel ?? 'functional';
    const files: GeneratedFile[] = [];

    const wantSmoke      = level === 'smoke'      || level === 'regression';
    const wantFunctional = level === 'functional' || level === 'regression';

    for (const page of map.pages) {
      files.push(this.buildPageObject(page));
      if (wantSmoke)      files.push(this.buildSmokeTest(page));
      if (wantFunctional) {
        const f = this.buildFunctionalTest(page);
        if (f) files.push(f);
      }
    }

    files.push(this.buildBasePage());
    files.push(this.buildConftest());
    files.push(this.buildRequirements());
    files.push(this.buildPytestIni());
    files.push(this.buildReadme(map.baseUrl, map.pages.length));

    // Python package markers
    files.push({ path: 'pages/__init__.py',            content: '' });
    files.push({ path: 'tests/__init__.py',            content: '' });
    files.push({ path: 'tests/smoke/__init__.py',      content: '' });
    files.push({ path: 'tests/functional/__init__.py', content: '' });

    return files;
  }

  // ─── Page Object ──────────────────────────────────────────────────────────────

  private buildPageObject(page: PageInfo): GeneratedFile {
    const moduleName = this.toModuleName(page.className);
    const locators:  string[] = [];
    const methods:   string[] = [];
    const usedIds    = new Set<string>();

    const addLocator = (name: string, selector: string) => {
      if (!name || usedIds.has(name)) return;
      usedIds.add(name);
      locators.push(`    ${name.toUpperCase()} = (By.CSS_SELECTOR, ${JSON.stringify(selector)})`);
    };

    page.forms.forEach((form, i) => {
      for (const field of form.fields) {
        const id = this.toSnakeId(field.name);
        if (!id) continue;
        addLocator(`${id}_input`, `[name='${field.name}'], [id='${field.name}']`);
      }
      const submitId = this.toSnakeId(form.id) + '_submit_btn';
      if (!usedIds.has(submitId)) {
        usedIds.add(submitId);
        const nth = i === 0 ? 'form' : `form:nth-of-type(${i + 1})`;
        locators.push(`    ${submitId.toUpperCase()} = (By.CSS_SELECTOR, "${nth} [type='submit'], ${nth} button:not([type='button']):not([type='reset'])")`);
      }
    });

    methods.push(`    def open(self) -> None:
        self.navigate("${page.path}")
        self.wait_for_load()`);

    for (const form of page.forms) {
      const safeId = this.toSnakeId(form.id);
      const valid  = this.uniqueFields(form.fields.filter(f => f.type !== 'hidden'));
      const params = valid.map(f => `${this.toSnakeId(f.name)}: str`).join(', ');
      const fills  = valid.map(f =>
        `        self.fill_field(self.${this.toSnakeId(f.name).toUpperCase()}_INPUT, ${this.toSnakeId(f.name)})`
      ).join('\n');

      // Adjust locator constant names to match what we defined
      const fillsFixed = fills.replace(/_INPUT,/g, '_INPUT,');

      methods.push(`    def fill_${safeId}_form(self, ${params}) -> None:
${fills}`);
      methods.push(`    def submit_${safeId}_form(self) -> None:
        self.click_element(self.${this.toSnakeId(form.id).toUpperCase()}_SUBMIT_BTN)
        self.wait_for_load()`);
    }

    const locatorBlock = locators.join('\n');
    return {
      path: `pages/${moduleName}.py`,
      content: `from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webdriver import WebDriver
from pages.base_page import BasePage


# Auto-generated — ${page.title}
class ${page.className}(BasePage):

${locatorBlock || '    # No form elements detected on this page'}

    def __init__(self, driver: WebDriver) -> None:
        super().__init__(driver)

${methods.join('\n\n')}
`,
    };
  }

  // ─── Smoke test ───────────────────────────────────────────────────────────────

  private buildSmokeTest(page: PageInfo): GeneratedFile {
    const moduleName = this.toModuleName(page.className);
    return {
      path: `tests/smoke/test_${moduleName}_smoke.py`,
      content: `import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webdriver import WebDriver
from pages.${moduleName} import ${page.className}

# Auto-generated — ${page.title} | Smoke


@pytest.mark.smoke
class Test${page.className}Smoke:

    def test_page_loads_successfully(self, driver: WebDriver) -> None:
        page = ${page.className}(driver)
        page.open()
        assert driver.current_url != "", "Page URL should not be empty"
        assert driver.find_element(By.TAG_NAME, "body").is_displayed(), "Body should be visible"

    def test_page_has_title(self, driver: WebDriver) -> None:
        page = ${page.className}(driver)
        page.open()
        assert driver.title != "", "Page title should not be empty"
`,
    };
  }

  // ─── Functional test ──────────────────────────────────────────────────────────

  private buildFunctionalTest(page: PageInfo): GeneratedFile | null {
    const moduleName = this.toModuleName(page.className);
    const tests: string[] = [];

    tests.push(`    def test_key_elements_are_visible(self, driver: WebDriver) -> None:
        page = ${page.className}(driver)
        page.open()
        elements = driver.find_elements(By.CSS_SELECTOR, "header, nav, main, [role='main']")
        assert elements and elements[0].is_displayed(), "Key page elements should be visible"`);

    if (page.hasTable) {
      tests.push(`    def test_data_table_renders(self, driver: WebDriver) -> None:
        page = ${page.className}(driver)
        page.open()
        rows = driver.find_elements(By.CSS_SELECTOR, "table tbody tr, [role='grid'] [role='row']")
        assert rows, "Table should have at least one row"`);
    }

    for (const form of page.forms) {
      const safeId = this.toSnakeId(form.id);
      const guard  = this.buildModalGuard(form);
      const valid  = this.uniqueFields(form.fields.filter(f => f.type !== 'hidden'));
      const args   = valid.map(f => this.pyFaker(f)).join(', ');

      tests.push(`    def test_${safeId}_happy_path(self, driver: WebDriver, fake: any) -> None:
        page = ${page.className}(driver)
        page.open()
${guard}        page.fill_${safeId}_form(${args})
        page.submit_${safeId}_form()
        import time; time.sleep(2)
        errors = driver.find_elements(By.CSS_SELECTOR, "[role='alert'], .error, .alert-danger")
        assert all(not e.is_displayed() for e in errors) if errors else True`);

      const reqField = form.fields.find(f => f.required && f.type !== 'hidden');
      if (reqField) {
        tests.push(`    def test_${safeId}_required_validation(self, driver: WebDriver) -> None:
        page = ${page.className}(driver)
        page.open()
${guard}        page.submit_${safeId}_form()
        import time; time.sleep(0.5)
        invalid = driver.find_elements(By.CSS_SELECTOR, ":invalid, [aria-invalid='true'], [role='alert'], .error")
        assert invalid, "Validation errors should appear for empty required fields"`);
      }
    }

    if (page.isAuthProtected) {
      tests.push(`    def test_unauthenticated_redirects(self, driver: WebDriver) -> None:
        driver.delete_all_cookies()
        driver.get("${page.url}")
        import time; time.sleep(2)
        assert "login" in driver.current_url or "signin" in driver.current_url, \\
            "Unauthenticated access should redirect to login"`);
    }

    tests.push(`    def test_non_existent_route_handled(self, driver: WebDriver) -> None:
        import re
        bad_url = re.sub(r"/[^/]*$", "/this-page-does-not-exist-xyz", driver.current_url)
        driver.get(bad_url)
        import time; time.sleep(1)
        assert driver.find_element(By.TAG_NAME, "body") is not None`);

    if (!tests.length) return null;

    return {
      path: `tests/functional/test_${moduleName}_functional.py`,
      content: `import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webdriver import WebDriver
from pages.${moduleName} import ${page.className}

# Auto-generated — ${page.title} | Functional


@pytest.mark.functional
class Test${page.className}Functional:

${tests.join('\n\n')}
`,
    };
  }

  // ─── Shared infrastructure ────────────────────────────────────────────────────

  private buildBasePage(): GeneratedFile {
    return {
      path: 'pages/base_page.py',
      content: `import os
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


class BasePage:
    BASE_URL = os.getenv("BASE_URL", "http://localhost:3000")

    def __init__(self, driver: WebDriver) -> None:
        self.driver = driver
        self.wait = WebDriverWait(driver, 10)

    def navigate(self, path: str) -> None:
        self.driver.get(self.BASE_URL + path)

    def wait_for_load(self) -> None:
        self.wait.until(
            lambda d: d.execute_script("return document.readyState") == "complete"
        )

    def fill_field(self, locator: tuple, value: str) -> None:
        if value:
            element = self.wait.until(EC.visibility_of_element_located(locator))
            element.clear()
            element.send_keys(value)

    def click_element(self, locator: tuple) -> None:
        element = self.wait.until(EC.element_to_be_clickable(locator))
        element.click()
`,
    };
  }

  private buildConftest(): GeneratedFile {
    return {
      path: 'conftest.py',
      content: `import pytest
from faker import Faker
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager


def pytest_configure(config) -> None:
    config.addinivalue_line("markers", "smoke: quick sanity checks")
    config.addinivalue_line("markers", "functional: detailed feature tests")


@pytest.fixture(scope="session")
def driver():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1280,720")
    d = webdriver.Chrome(
        service=Service(ChromeDriverManager().install()),
        options=options,
    )
    yield d
    d.quit()


@pytest.fixture
def fake() -> Faker:
    return Faker()
`,
    };
  }

  private buildRequirements(): GeneratedFile {
    return {
      path: 'requirements.txt',
      content: `selenium>=4.21.0
webdriver-manager>=4.0.1
pytest>=8.0.0
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

  private buildReadme(baseUrl: string, pageCount: number): GeneratedFile {
    return {
      path: 'README.md',
      content: `# Selenium Python Test Suite

Auto-generated by Qlitz · ${pageCount} page(s) · Base URL: \`${baseUrl || 'http://localhost:3000'}\`

## Prerequisites
- Python 3.11+
- pip
- Google Chrome

## Setup
\`\`\`bash
pip install -r requirements.txt
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
  base_page.py           Base Page with WebDriver helpers
  *.py                   Page Object classes (CSS locator tuples)
tests/
  smoke/                 @pytest.mark.smoke — fast sanity checks
  functional/            @pytest.mark.functional — full feature coverage
conftest.py              Session-scoped Chrome driver + markers
requirements.txt
pytest.ini
\`\`\`
`,
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private buildModalGuard(form: FormInfo): string {
    if (!form.isInModal) return '';
    const anchor   = form.fields.find(f => !['hidden', 'submit', 'button', 'reset'].includes(f.type) && f.name);
    const selector = anchor ? `[name='${anchor.name}']` : '[type="submit"]';
    return `        els = driver.find_elements(By.CSS_SELECTOR, "${selector}")
        if not els or not els[0].is_displayed():
            pytest.skip("Form [${form.id}] is in a closed modal — add a trigger to open it.")
            return
`;
  }

  private pyFaker(field: FieldInfo): string {
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
