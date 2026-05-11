import { Injectable } from '@nestjs/common';
import type { GeneratedFile } from '../templates/template-engine';
import type { FrameworkBlueprint } from '../blueprint/blueprint.model';
import type { PageMap, PageInfo, FormInfo, FieldInfo } from '../crawler/crawler.types';

@Injectable()
export class PlaywrightJavaUiTestGeneratorService {
  private readonly pkg = 'com.qlitz';

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
    files.push(this.buildBaseTest());
    files.push(this.buildPomXml());
    files.push(this.buildReadme(pageMap.baseUrl, pageMap.pages.length));

    return files;
  }

  // ─── Page Object ─────────────────────────────────────────────────────────────

  private buildPageObject(page: PageInfo): GeneratedFile {
    const declarations: string[] = [];
    const assignments:  string[] = [];
    const methods:      string[] = [];
    const usedIds = new Set<string>();

    const addField = (varName: string, expr: string) => {
      if (!varName || usedIds.has(varName)) return;
      usedIds.add(varName);
      declarations.push(`  public final Locator ${varName};`);
      assignments.push(`    this.${varName} = ${expr};`);
    };

    page.forms.forEach((form, i) => {
      for (const field of form.fields) {
        const id = this.toJavaId(field.name);
        if (!id) continue;
        addField(`${id}Input`, `page.locator("[name=\\"${field.name}\\"], [id=\\"${field.name}\\"]").first()`);
      }
      const submitId = this.toJavaId(form.id) + 'SubmitBtn';
      addField(submitId, `page.locator("form").nth(${i}).locator("[type=\\"submit\\"], button:not([type=\\"button\\"]):not([type=\\"reset\\"])").first()`);
    });

    for (const btn of page.buttons.filter(b => b.role !== 'submit').slice(0, 8)) {
      const id = this.toJavaId(btn.text);
      if (!id) continue;
      addField(`${id}Btn`, `page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName(${JSON.stringify(btn.text)}))`);
    }

    methods.push(`
  public void open() {
    navigate("${page.path}");
    waitForLoad();
  }`);

    for (const form of page.forms) {
      const safeId = this.toJavaId(form.id);
      const pascal = this.toPascalCase(safeId);
      const valid  = this.uniqueFields(form.fields.filter(f => f.type !== 'hidden'));
      const params = valid.map(f => `String ${this.toJavaId(f.name)}`).join(', ');
      const fills  = valid.map(f => `    fillField(${this.toJavaId(f.name)}Input, ${this.toJavaId(f.name)});`).join('\n');

      methods.push(`
  public void fill${pascal}Form(${params}) {
${fills}
  }`);
      methods.push(`
  public void submit${pascal}Form() {
    ${safeId}SubmitBtn.click();
    waitForLoad();
  }`);
    }

    const pkgPath = this.pkg.replace(/\./g, '/');
    return {
      path: `src/main/java/${pkgPath}/pages/${page.className}.java`,
      content: `package ${this.pkg}.pages;

import com.microsoft.playwright.*;
import com.microsoft.playwright.options.AriaRole;

public class ${page.className} extends BasePage {
${declarations.length ? '\n' + declarations.join('\n') + '\n' : ''}
  public ${page.className}(Page page) {
    super(page);
${assignments.join('\n')}
  }
${methods.join('\n')}
}
`,
    };
  }

  // ─── Smoke spec ───────────────────────────────────────────────────────────────

  private buildSmokeSpec(page: PageInfo): GeneratedFile {
    const pkgPath = this.pkg.replace(/\./g, '/');
    const pathFragment = page.path.replace(/\//g, '\\/');
    return {
      path: `src/test/java/${pkgPath}/tests/smoke/${page.className}SmokeTest.java`,
      content: `package ${this.pkg}.tests.smoke;

import ${this.pkg}.pages.${page.className};
import ${this.pkg}.tests.BaseTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

// Auto-generated — ${page.title} | ${page.url} | Smoke
@Tag("smoke")
class ${page.className}SmokeTest extends BaseTest {
  private ${page.className} pageObj;

  @BeforeEach
  @Override
  protected void setup() {
    super.setup();
    pageObj = new ${page.className}(page);
    pageObj.open();
  }

  @Test
  void pageLoadsSuccessfully() {
    assertTrue(page.url().contains("${pathFragment}"));
    assertTrue(page.locator("body").isVisible());
  }

  @Test
  void pageHasCorrectTitle() {
    assertFalse(page.title().isEmpty());
  }
}
`,
    };
  }

  // ─── Functional spec ──────────────────────────────────────────────────────────

  private buildFunctionalSpec(page: PageInfo): GeneratedFile | null {
    const pkgPath = this.pkg.replace(/\./g, '/');
    const tests:   string[] = [];

    tests.push(`
  @Test
  void keyPageElementsAreVisible() {
    assertTrue(page.locator("header, nav, main, [role='main']").first().isVisible());
  }`);

    for (const form of page.forms) {
      const guard  = this.buildModalGuard(form);
      const safeId = this.toJavaId(form.id);
      const valid  = this.uniqueFields(form.fields.filter(f => f.type !== 'hidden'));
      const fills  = valid.map(f =>
        `    pageObj.${this.toJavaId(f.name)}Input.fill(${this.javaFake(f)});`
      ).join('\n');

      tests.push(`
  @Test
  void test${this.toPascalCase(safeId)}HappyPath() {
${guard}${fills}
    pageObj.${safeId}SubmitBtn.click();
    page.waitForTimeout(2000);
    assertFalse(page.locator("[role='alert'], .error, .alert-danger").first().isVisible());
  }`);
    }

    tests.push(`
  @Test
  void nonExistentRouteReturns404OrRedirect() {
    var response = page.navigate(page.url().replaceAll("/[^/]*$", "/this-page-does-not-exist-xyz"));
    int status = response != null ? response.status() : 0;
    assertTrue(status == 200 || status == 301 || status == 302 || status == 404);
  }`);

    return {
      path: `src/test/java/${pkgPath}/tests/functional/${page.className}FunctionalTest.java`,
      content: `package ${this.pkg}.tests.functional;

import ${this.pkg}.pages.${page.className};
import ${this.pkg}.tests.BaseTest;
import com.github.javafaker.Faker;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

// Auto-generated — ${page.title} | ${page.url} | Functional
@Tag("functional")
class ${page.className}FunctionalTest extends BaseTest {
  private ${page.className} pageObj;
  private final Faker faker = new Faker();

  @BeforeEach
  @Override
  protected void setup() {
    super.setup();
    pageObj = new ${page.className}(page);
    pageObj.open();
  }
${tests.join('\n')}
}
`,
    };
  }

  // ─── Shared infrastructure ────────────────────────────────────────────────────

  private buildBasePage(): GeneratedFile {
    const pkgPath = this.pkg.replace(/\./g, '/');
    return {
      path: `src/main/java/${pkgPath}/pages/BasePage.java`,
      content: `package ${this.pkg}.pages;

import com.microsoft.playwright.*;
import com.microsoft.playwright.options.LoadState;

public abstract class BasePage {
  protected final Page page;

  public BasePage(Page page) {
    this.page = page;
  }

  protected void navigate(String path) {
    String base = System.getenv().getOrDefault("BASE_URL", "");
    page.navigate(base + path);
  }

  protected void waitForLoad() {
    page.waitForLoadState(LoadState.DOMCONTENTLOADED);
    page.waitForTimeout(1500);
  }

  protected void fillField(Locator locator, String value) {
    if (value != null && !value.isEmpty()) locator.fill(value);
  }
}
`,
    };
  }

  private buildBaseTest(): GeneratedFile {
    const pkgPath = this.pkg.replace(/\./g, '/');
    return {
      path: `src/test/java/${pkgPath}/tests/BaseTest.java`,
      content: `package ${this.pkg}.tests;

import com.microsoft.playwright.*;
import org.junit.jupiter.api.*;

public abstract class BaseTest {
  protected static Playwright playwright;
  protected static Browser    browser;
  protected BrowserContext    context;
  protected Page              page;

  @BeforeAll
  static void launchBrowser() {
    playwright = Playwright.create();
    browser    = playwright.chromium().launch(new BrowserType.LaunchOptions().setHeadless(true));
  }

  @AfterAll
  static void closeBrowser() {
    playwright.close();
  }

  @BeforeEach
  protected void setup() {
    String base = System.getenv().getOrDefault("BASE_URL", "http://localhost:3000");
    context = browser.newContext(new Browser.NewContextOptions().setBaseURL(base));
    page    = context.newPage();
  }

  @AfterEach
  void tearDown() {
    context.close();
  }
}
`,
    };
  }

  private buildPomXml(): GeneratedFile {
    return {
      path: 'pom.xml',
      content: `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
           http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <groupId>${this.pkg}</groupId>
  <artifactId>playwright-tests</artifactId>
  <version>1.0.0-SNAPSHOT</version>

  <properties>
    <maven.compiler.source>17</maven.compiler.source>
    <maven.compiler.target>17</maven.compiler.target>
    <playwright.version>1.44.0</playwright.version>
    <junit.version>5.10.2</junit.version>
    <faker.version>1.0.2</faker.version>
  </properties>

  <dependencies>
    <dependency>
      <groupId>com.microsoft.playwright</groupId>
      <artifactId>playwright</artifactId>
      <version>\${playwright.version}</version>
    </dependency>
    <dependency>
      <groupId>org.junit.jupiter</groupId>
      <artifactId>junit-jupiter</artifactId>
      <version>\${junit.version}</version>
      <scope>test</scope>
    </dependency>
    <dependency>
      <groupId>com.github.javafaker</groupId>
      <artifactId>javafaker</artifactId>
      <version>\${faker.version}</version>
      <scope>test</scope>
    </dependency>
  </dependencies>

  <build>
    <plugins>
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-surefire-plugin</artifactId>
        <version>3.2.5</version>
        <configuration>
          <!-- Run by group: mvn test -Dgroups=smoke  or  mvn test -Dgroups=functional -->
          <groups>\${groups}</groups>
        </configuration>
      </plugin>
    </plugins>
  </build>
</project>
`,
    };
  }

  // ─── README ───────────────────────────────────────────────────────────────────

  private buildReadme(baseUrl: string, pageCount: number): GeneratedFile {
    return {
      path: 'README.md',
      content: `# Playwright Java Test Suite

Auto-generated by Qlitz · ${pageCount} page(s) · Base URL: \`${baseUrl || 'http://localhost:3000'}\`

## Prerequisites
- Java 17+
- Maven 3.9+

## Setup
\`\`\`bash
# Install Playwright browsers
mvn exec:java -e -D exec.mainClass=com.microsoft.playwright.CLI -D exec.args="install"
\`\`\`

## Running Tests
\`\`\`bash
# All tests
mvn test

# Smoke tests only
mvn test -Dgroups=smoke

# Functional tests only
mvn test -Dgroups=functional

# Set base URL
BASE_URL=https://your-site.com mvn test
\`\`\`

## Project Structure
\`\`\`
src/
  main/java/com/qlitz/pages/          Page Object classes
  test/java/com/qlitz/tests/
    BaseTest.java                      Playwright lifecycle (BeforeAll/AfterAll)
    smoke/                             @Tag("smoke") — fast sanity checks
    functional/                        @Tag("functional") — full feature coverage
\`\`\`
`,
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private buildModalGuard(form: FormInfo): string {
    if (!form.isInModal) return '';
    const anchor   = form.fields.find(f => !['hidden', 'submit', 'button', 'reset'].includes(f.type) && f.name);
    const selector = anchor ? `[name=\\"${anchor.name}\\"]` : '[type=\\"submit\\"]';
    return `    if (!page.locator("${selector}").first().isVisible()) {
      System.out.println("[Qlitz] Form [${form.id}] is in a closed modal. Add a trigger in setup() to open it.");
      return;
    }
`;
  }

  private javaFake(field: FieldInfo): string {
    const t = field.type;
    const n = field.name.toLowerCase();
    if (t === 'email')    return 'faker.internet().emailAddress()';
    if (t === 'password') return 'faker.internet().password(12, 16)';
    if (t === 'number')   return 'String.valueOf(faker.number().numberBetween(1, 999))';
    if (t === 'tel')      return 'faker.phoneNumber().phoneNumber()';
    if (t === 'date')     return 'faker.date().birthday().toString()';
    if (t === 'url')      return 'faker.internet().url()';
    if (n.includes('name'))    return 'faker.name().fullName()';
    if (n.includes('address')) return 'faker.address().streetAddress()';
    if (n.includes('city'))    return 'faker.address().city()';
    return 'faker.lorem().word()';
  }

  private uniqueFields(fields: FieldInfo[]): FieldInfo[] {
    const seen = new Set<string>();
    return fields.filter(f => {
      const id = this.toJavaId(f.name);
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }

  private toJavaId(str: string): string {
    const cleaned = str.replace(/[^a-zA-Z0-9\-_\s]/g, '').trim();
    if (!cleaned) return '';
    const safe = cleaned.replace(/^\d+[\s\-_]*/g, '').trim();
    if (!safe) return '';
    return this.toCamelCase(safe);
  }

  private toCamelCase(str: string): string {
    return str.replace(/[-_\s]+(.)/g, (_, c: string) => c.toUpperCase()).replace(/^(.)/, (c: string) => c.toLowerCase());
  }

  private toPascalCase(str: string): string {
    const cc = this.toCamelCase(str);
    return cc.charAt(0).toUpperCase() + cc.slice(1);
  }
}
