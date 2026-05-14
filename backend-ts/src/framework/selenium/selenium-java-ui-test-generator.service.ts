import { Injectable } from '@nestjs/common';
import type { GeneratedFile } from '../templates/template-engine';
import type { FrameworkBlueprint } from '../blueprint/blueprint.model';
import type { PageMap, PageInfo, FormInfo, FieldInfo } from '../crawler/crawler.types';

@Injectable()
export class SeleniumJavaUiTestGeneratorService {

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
    files.push(this.buildDriverFactory());
    files.push(this.buildPom());
    files.push(this.buildReadme(map.baseUrl, map.pages.length));

    return files;
  }

  // ─── Page Object ──────────────────────────────────────────────────────────────

  private buildPageObject(page: PageInfo): GeneratedFile {
    const fields:  string[] = [];
    const methods: string[] = [];
    const usedIds  = new Set<string>();

    const addField = (varName: string, cssSelector: string) => {
      if (!varName || usedIds.has(varName)) return;
      usedIds.add(varName);
      fields.push(`    @FindBy(css = "${cssSelector}")\n    private WebElement ${varName};`);
    };

    page.forms.forEach((form, i) => {
      for (const field of form.fields) {
        const id = this.toJavaId(field.name);
        if (!id) continue;
        addField(`${id}Input`, `[name='${field.name}'], [id='${field.name}']`);
      }
      const submitId = this.toJavaId(form.id) + 'SubmitBtn';
      if (!usedIds.has(submitId)) {
        usedIds.add(submitId);
        const nth = i === 0 ? 'form' : `form:nth-of-type(${i + 1})`;
        fields.push(`    @FindBy(css = "${nth} [type='submit'], ${nth} button:not([type='button']):not([type='reset'])")\n    private WebElement ${submitId};`);
      }
    });

    methods.push(`    public ${page.className}(WebDriver driver) {
        super(driver);
        PageFactory.initElements(driver, this);
    }

    public void open() {
        navigate("${page.path}");
        waitForLoad();
    }`);

    for (const form of page.forms) {
      const safeId = this.toJavaId(form.id);
      const valid  = this.uniqueFields(form.fields.filter(f => f.type !== 'hidden'));
      const params = valid.map(f => `String ${this.toJavaId(f.name)}`).join(', ');
      const fills  = valid.map(f => `        fillField(${this.toJavaId(f.name)}Input, ${this.toJavaId(f.name)});`).join('\n');
      methods.push(`    public void fill${this.toPascal(safeId)}Form(${params}) {
${fills}
    }

    public void submit${this.toPascal(safeId)}Form() {
        ${safeId}SubmitBtn.click();
        waitForLoad();
    }`);
    }

    return {
      path: `src/main/java/com/qa/pages/${page.className}.java`,
      content: `package com.qa.pages;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;

// Auto-generated — ${page.title}
public class ${page.className} extends BasePage {

${fields.join('\n\n')}

${methods.join('\n\n')}
}
`,
    };
  }

  // ─── Smoke test ───────────────────────────────────────────────────────────────

  private buildSmokeTest(page: PageInfo): GeneratedFile {
    return {
      path: `src/test/java/com/qa/smoke/${page.className}SmokeTest.java`,
      content: `package com.qa.smoke;

import com.qa.pages.${page.className};
import com.qa.utils.DriverFactory;
import org.junit.jupiter.api.*;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

// Auto-generated — ${page.title} | Smoke
@Tag("smoke")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class ${page.className}SmokeTest {

    private WebDriver driver;
    private ${page.className} page;

    @BeforeAll
    void setUpDriver() {
        driver = DriverFactory.getDriver();
    }

    @AfterAll
    void tearDown() {
        if (driver != null) driver.quit();
    }

    @BeforeEach
    void setUp() {
        page = new ${page.className}(driver);
        page.open();
    }

    @Test
    @DisplayName("smoke: page loads successfully")
    void testPageLoadsSuccessfully() {
        Assertions.assertFalse(driver.getCurrentUrl().isEmpty(), "Page URL should not be empty");
        Assertions.assertTrue(
            driver.findElement(By.tagName("body")).isDisplayed(),
            "Body element should be visible"
        );
    }

    @Test
    @DisplayName("smoke: page has a title")
    void testPageHasTitle() {
        Assertions.assertFalse(driver.getTitle().isEmpty(), "Page title should not be empty");
    }
}
`,
    };
  }

  // ─── Functional test ──────────────────────────────────────────────────────────

  private buildFunctionalTest(page: PageInfo): GeneratedFile | null {
    const tests: string[] = [];

    tests.push(`    @Test
    @DisplayName("functional: key page elements are visible")
    void testKeyElementsAreVisible() {
        boolean visible = !driver.findElements(By.cssSelector("header, nav, main, [role='main']")).isEmpty()
            && driver.findElement(By.cssSelector("header, nav, main, [role='main']")).isDisplayed();
        Assertions.assertTrue(visible, "Key page elements should be visible");
    }`);

    if (page.hasTable) {
      tests.push(`    @Test
    @DisplayName("functional: data table renders with rows")
    void testDataTableRendersWithRows() {
        Assertions.assertFalse(
            driver.findElements(By.cssSelector("table tbody tr, [role='grid'] [role='row']")).isEmpty(),
            "Table should have at least one row"
        );
    }`);
    }

    for (const form of page.forms) {
      const safeId = this.toJavaId(form.id);
      const pascal = this.toPascal(safeId);
      const guard  = this.buildModalGuard(form);
      const valid  = this.uniqueFields(form.fields.filter(f => f.type !== 'hidden'));
      const args   = valid.map(f => this.javaFaker(f)).join(', ');

      tests.push(`    @Test
    @DisplayName("functional: ${form.purpose} form [${form.id}] — happy path")
    void test${pascal}FormHappyPath() {
${guard}        page.fill${pascal}Form(${args});
        page.submit${pascal}Form();
        Thread.sleep(2000);
        boolean noError = driver.findElements(By.cssSelector("[role='alert'], .error, .alert-danger")).stream()
            .allMatch(e -> !e.isDisplayed());
        Assertions.assertTrue(noError, "No error messages should appear after valid submission");
    }`);

      const reqField = form.fields.find(f => f.required && f.type !== 'hidden');
      if (reqField) {
        tests.push(`    @Test
    @DisplayName("functional: ${form.id} — required field validation")
    void test${pascal}FormRequiredValidation() {
${guard}        page.submit${pascal}Form();
        Thread.sleep(500);
        boolean hasValidation = !driver.findElements(By.cssSelector(":invalid, [aria-invalid='true'], [role='alert'], .error")).isEmpty();
        Assertions.assertTrue(hasValidation, "Validation errors should appear for empty required fields");
    }`);
      }
    }

    if (page.isAuthProtected) {
      tests.push(`    @Test
    @DisplayName("functional: unauthenticated access redirects")
    void testUnauthenticatedAccessRedirects() {
        driver.manage().deleteAllCookies();
        driver.get("${page.url}");
        Thread.sleep(2000);
        String url = driver.getCurrentUrl();
        boolean redirected = url.contains("login") || url.contains("signin") || !url.equals("${page.url}");
        Assertions.assertTrue(redirected, "Unauthenticated access should redirect to login");
    }`);
    }

    tests.push(`    @Test
    @DisplayName("functional: non-existent route handled gracefully")
    void testNonExistentRouteHandled() throws Exception {
        String badUrl = driver.getCurrentUrl().replaceAll("/[^/]*$", "/this-page-does-not-exist-xyz");
        driver.get(badUrl);
        Thread.sleep(1000);
        // Verify the app doesn't crash — any response is acceptable
        Assertions.assertNotNull(driver.findElement(By.tagName("body")));
    }`);

    if (!tests.length) return null;

    return {
      path: `src/test/java/com/qa/functional/${page.className}FunctionalTest.java`,
      content: `package com.qa.functional;

import com.github.javafaker.Faker;
import com.qa.pages.${page.className};
import com.qa.utils.DriverFactory;
import org.junit.jupiter.api.*;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

// Auto-generated — ${page.title} | Functional
@Tag("functional")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class ${page.className}FunctionalTest {

    private WebDriver driver;
    private ${page.className} page;
    private static final Faker faker = new Faker();

    @BeforeAll
    void setUpDriver() {
        driver = DriverFactory.getDriver();
    }

    @AfterAll
    void tearDown() {
        if (driver != null) driver.quit();
    }

    @BeforeEach
    void setUp() throws InterruptedException {
        page = new ${page.className}(driver);
        page.open();
    }

${tests.join('\n\n')}
}
`,
    };
  }

  // ─── Shared infrastructure ────────────────────────────────────────────────────

  private buildBasePage(): GeneratedFile {
    return {
      path: 'src/main/java/com/qa/pages/BasePage.java',
      content: `package com.qa.pages;

import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

public class BasePage {

    protected final WebDriver driver;
    protected final WebDriverWait wait;
    private static final String BASE_URL = System.getenv().getOrDefault("BASE_URL", "http://localhost:3000");

    public BasePage(WebDriver driver) {
        this.driver = driver;
        this.wait   = new WebDriverWait(driver, Duration.ofSeconds(10));
    }

    protected void navigate(String path) {
        driver.get(BASE_URL + path);
    }

    protected void waitForLoad() {
        wait.until(d -> ((JavascriptExecutor) d).executeScript("return document.readyState").equals("complete"));
        try { Thread.sleep(500); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }

    protected void fillField(WebElement element, String value) {
        if (value != null && !value.isEmpty()) {
            wait.until(ExpectedConditions.visibilityOf(element));
            element.clear();
            element.sendKeys(value);
        }
    }
}
`,
    };
  }

  private buildDriverFactory(): GeneratedFile {
    return {
      path: 'src/main/java/com/qa/utils/DriverFactory.java',
      content: `package com.qa.utils;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;

public class DriverFactory {

    public static WebDriver getDriver() {
        WebDriverManager.chromedriver().setup();
        ChromeOptions options = new ChromeOptions();
        options.addArguments(
            "--headless=new",
            "--no-sandbox",
            "--disable-dev-shm-usage",
            "--window-size=1280,720"
        );
        return new ChromeDriver(options);
    }
}
`,
    };
  }

  private buildPom(): GeneratedFile {
    return {
      path: 'pom.xml',
      content: `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.qa</groupId>
    <artifactId>selenium-tests</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <properties>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <selenium.version>4.21.0</selenium.version>
        <wdm.version>5.8.0</wdm.version>
        <junit.version>5.10.2</junit.version>
        <faker.version>1.0.2</faker.version>
        <surefire.version>3.2.5</surefire.version>
        <groups></groups>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.seleniumhq.selenium</groupId>
            <artifactId>selenium-java</artifactId>
            <version>\${selenium.version}</version>
        </dependency>
        <dependency>
            <groupId>io.github.bonigarcia</groupId>
            <artifactId>webdrivermanager</artifactId>
            <version>\${wdm.version}</version>
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
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-surefire-plugin</artifactId>
                <version>\${surefire.version}</version>
                <configuration>
                    <groups>\${groups}</groups>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
`,
    };
  }

  private buildReadme(baseUrl: string, pageCount: number): GeneratedFile {
    return {
      path: 'README.md',
      content: `# Selenium Java Test Suite

Auto-generated by Qlitz · ${pageCount} page(s) · Base URL: \`${baseUrl || 'http://localhost:3000'}\`

## Prerequisites
- Java 17+
- Maven 3.8+
- Google Chrome

## Setup
\`\`\`bash
mvn install -DskipTests
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
  main/java/com/qa/
    pages/
      BasePage.java            Base Page with WebDriver helpers
      *.java                   Page Object classes (PageFactory)
    utils/
      DriverFactory.java       Headless Chrome WebDriver setup
  test/java/com/qa/
    smoke/                     @Tag("smoke") — fast sanity checks
    functional/                @Tag("functional") — full feature coverage
pom.xml
\`\`\`
`,
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private buildModalGuard(form: FormInfo): string {
    if (!form.isInModal) return '';
    const anchor   = form.fields.find(f => !['hidden', 'submit', 'button', 'reset'].includes(f.type) && f.name);
    const selector = anchor ? `[name='${anchor.name}']` : '[type="submit"]';
    return `        if (driver.findElements(By.cssSelector("${selector}")).isEmpty() || !driver.findElement(By.cssSelector("${selector}")).isDisplayed()) {
            System.out.println("[Qlitz] Form [${form.id}] is in a closed modal — add a trigger to open it.");
            return;
        }
`;
  }

  private javaFaker(field: FieldInfo): string {
    const t = field.type;
    const n = field.name.toLowerCase();
    if (t === 'email')    return 'faker.internet().emailAddress()';
    if (t === 'password') return 'faker.internet().password(8, 16)';
    if (t === 'number')   return 'String.valueOf(faker.number().numberBetween(1, 999))';
    if (t === 'tel')      return 'faker.phoneNumber().phoneNumber()';
    if (t === 'date')     return 'faker.date().future(30, java.util.concurrent.TimeUnit.DAYS).toString().substring(0, 10)';
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
    return safe
      .replace(/[-_\s]+(.)/g, (_, c: string) => c.toUpperCase())
      .replace(/^(.)/, (c: string) => c.toLowerCase());
  }

  private toPascal(str: string): string {
    const c = this.toJavaId(str);
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
