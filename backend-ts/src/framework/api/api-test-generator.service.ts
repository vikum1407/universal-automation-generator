import { Injectable } from '@nestjs/common';
import type { GeneratedFile } from '../templates/template-engine';
import type { FrameworkBlueprint } from '../blueprint/blueprint.model';
import type { SwaggerSummary, ParsedEndpoint, HttpMethod } from '../swagger/swagger.types';

@Injectable()
export class ApiTestGeneratorService {

  generate(summary: SwaggerSummary, blueprint: FrameworkBlueprint): GeneratedFile[] {
    const archNode    = blueprint.nodes?.find(n => n.nodeId === blueprint.architecture);
    const pkg         = (archNode?.config?.basePackage as string) ?? 'com.qlitz';
    const pkgPath     = pkg.replace(/\./g, '/');
    const level       = blueprint.coverageLevel ?? 'smoke';
    const runner      = this.detectRunner(blueprint);
    const dataStrat   = blueprint.testDataStrategy ?? 'faker';
    const reporting   = this.detectReporting(blueprint);
    const files: GeneratedFile[] = [];

    // Group endpoints by tag
    const byTag = this.groupByTag(summary.endpoints);

    for (const [tag, endpoints] of Object.entries(byTag)) {
      const className = this.toClassName(tag);
      files.push({
        path:    `src/test/java/${pkgPath}/tests/${className}Test.java`,
        content: this.buildTestClass(pkg, className, tag, endpoints, level, runner, dataStrat, reporting),
      });
    }

    // TestNG: dynamic testng.xml; JUnit5: no xml needed
    if (runner === 'testng') {
      files.push(this.buildTestNgXml(pkg, Object.keys(byTag).map(t => this.toClassName(t))));
    }

    // Extent listener — generated programmatically so it matches the chosen runner
    if (reporting === 'extent') {
      files.push(this.buildExtentListenerFile(pkg, pkgPath, runner));
    }

    // Retry analyzer — generated programmatically so it matches the chosen runner
    const hasRetry = (blueprint.nodes ?? []).some(n => n.nodeId === 'restassured-java-retry');
    if (hasRetry) {
      files.push(this.buildRetryFile(pkg, pkgPath, runner, blueprint));
    }

    // Sample CSV (always generated — used by both faker and custom strategies)
    files.push(this.buildSampleCsv(summary.endpoints));

    return files;
  }

  private detectRunner(blueprint: FrameworkBlueprint): 'testng' | 'junit5' {
    const ids = (blueprint.nodes ?? []).map(n => n.nodeId);
    return ids.some(id => id.includes('junit5')) ? 'junit5' : 'testng';
  }

  private detectReporting(blueprint: FrameworkBlueprint): 'allure' | 'extent' | 'none' {
    const ids = (blueprint.nodes ?? []).map(n => n.nodeId);
    if (ids.some(id => id.includes('allure')))  return 'allure';
    if (ids.some(id => id.includes('extent')))  return 'extent';
    return 'none';
  }

  // ─── Test class builder ───────────────────────────────────────────────────────

  private buildTestClass(
    pkg: string,
    className: string,
    tag: string,
    endpoints: ParsedEndpoint[],
    level: 'smoke' | 'functional',
    runner: 'testng' | 'junit5',
    dataStrat: string,
    reporting: 'allure' | 'extent' | 'none',
  ): string {
    const testMethods = endpoints.flatMap(ep => this.buildTestMethods(ep, level, runner, dataStrat, reporting, className));

    // ── Runner imports ────────────────────────────────────────────────────────
    const runnerImports = runner === 'junit5'
      ? (reporting === 'allure'
          ? `import org.junit.jupiter.api.Test;\nimport org.junit.jupiter.api.Assertions;\nimport org.junit.jupiter.api.extension.ExtendWith;\nimport io.qameta.allure.junit5.AllureJunit5;`
          : reporting === 'extent'
            ? `import org.junit.jupiter.api.Test;\nimport org.junit.jupiter.api.Assertions;\nimport org.junit.jupiter.api.extension.ExtendWith;`
            : `import org.junit.jupiter.api.Test;\nimport org.junit.jupiter.api.Assertions;`)
      : `import org.testng.Assert;\nimport org.testng.annotations.*;`;

    // ── Reporting-specific imports ────────────────────────────────────────────
    const reportingImport = reporting === 'allure'
      ? `\nimport io.qameta.allure.*;`
      : reporting === 'extent'
        ? `\nimport ${pkg}.listeners.ExtentReportListener;`
        : '';

    // ── Class-level annotation ────────────────────────────────────────────────
    const classAnnotation = this.buildClassAnnotation(runner, tag, reporting);

    const dataFakerImport = dataStrat === 'faker' ? `\nimport ${pkg}.util.TestDataFaker;` : '';
    const csvImport = dataStrat === 'custom' ? `\nimport ${pkg}.util.CsvDataReader;\nimport java.util.Map;` : '';

    const csvDataProvider = (dataStrat === 'custom' && runner === 'testng') ? `
    @org.testng.annotations.DataProvider(name = "csvEndpointData")
    public Object[][] csvEndpointData() {
        return CsvDataReader.asObjectArray("testdata/${className.toLowerCase()}_data.csv");
    }
` : '';

    return `package ${pkg}.tests;

import ${pkg}.base.BaseApiTest;${dataFakerImport}${csvImport}${reportingImport}
import io.restassured.response.Response;
${runnerImports}

import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

/**
 * Auto-generated API tests — ${tag}
 * Coverage: ${level} | Runner: ${runner} | Reporting: ${reporting} | Data: ${dataStrat}
 * Generated by Qlitz Framework Generator
 */
${classAnnotation}
public class ${className}Test extends BaseApiTest {
${csvDataProvider}
${testMethods.join('\n\n')}
}
`;
  }

  private buildClassAnnotation(runner: 'testng' | 'junit5', tag: string, reporting: 'allure' | 'extent' | 'none'): string {
    if (reporting === 'allure') {
      return runner === 'junit5'
        ? `@ExtendWith(AllureJunit5.class)\n@Epic("API Tests")\n@Feature("${tag}")`
        : `@Epic("API Tests")\n@Feature("${tag}")`;
    }
    if (reporting === 'extent') {
      return runner === 'junit5'
        ? `@ExtendWith(ExtentReportListener.class)`
        : `@Listeners(ExtentReportListener.class)`;
    }
    return '';
  }

  // ─── Extent listener file (runner-aware, generated programmatically) ──────────

  private buildExtentListenerFile(pkg: string, pkgPath: string, runner: 'testng' | 'junit5'): GeneratedFile {
    return {
      path:    `src/test/java/${pkgPath}/listeners/ExtentReportListener.java`,
      content: runner === 'junit5'
        ? this.buildExtentListenerJunit5(pkg)
        : this.buildExtentListenerTestng(pkg),
    };
  }

  private buildExtentListenerTestng(pkg: string): string {
    return `package ${pkg}.listeners;

import com.aventstack.extentreports.ExtentReports;
import com.aventstack.extentreports.ExtentTest;
import com.aventstack.extentreports.Status;
import com.aventstack.extentreports.reporter.ExtentSparkReporter;
import com.aventstack.extentreports.reporter.configuration.Theme;
import org.testng.ITestContext;
import org.testng.ITestListener;
import org.testng.ITestResult;

public class ExtentReportListener implements ITestListener {

    private static final ExtentReports extent = createReport();
    private static final ThreadLocal<ExtentTest> testThread = new ThreadLocal<>();

    public static ExtentTest getTest() { return testThread.get(); }

    @Override
    public void onTestStart(ITestResult result) {
        ExtentTest test = extent.createTest(result.getMethod().getMethodName())
                .assignCategory(result.getTestClass().getRealClass().getSimpleName());
        testThread.set(test);
        test.log(Status.INFO, "Test started");
    }

    @Override
    public void onTestSuccess(ITestResult result) {
        testThread.get().log(Status.PASS, "Passed in " + (result.getEndMillis() - result.getStartMillis()) + " ms");
    }

    @Override
    public void onTestFailure(ITestResult result) {
        Throwable t = result.getThrowable();
        testThread.get()
                .log(Status.FAIL, t != null ? t.getMessage() : "Test failed")
                .fail(t != null ? t : new AssertionError("Test failed"));
    }

    @Override
    public void onTestSkipped(ITestResult result) {
        testThread.get().log(Status.SKIP, "Test skipped");
    }

    @Override
    public void onStart(ITestContext context) {
        extent.setSystemInfo("Suite", context.getName());
        extent.setSystemInfo("Base URL", System.getProperty("api.base.url", "see config.properties"));
    }

    @Override
    public void onFinish(ITestContext context) {
        extent.flush();
        testThread.remove();
    }

    private static ExtentReports createReport() {
        String path = System.getProperty("extent.report.path", "target/extent-reports/api-test-report.html");
        ExtentSparkReporter spark = new ExtentSparkReporter(path);
        spark.config().setDocumentTitle("API Test Report");
        spark.config().setReportName("API Test Report");
        spark.config().setTheme(Theme.DARK);
        spark.config().setEncoding("UTF-8");
        ExtentReports ext = new ExtentReports();
        ext.attachReporter(spark);
        ext.setSystemInfo("Framework", "REST Assured");
        ext.setSystemInfo("Environment", System.getProperty("env", "default"));
        return ext;
    }
}
`;
  }

  private buildExtentListenerJunit5(pkg: string): string {
    return `package ${pkg}.listeners;

import com.aventstack.extentreports.ExtentReports;
import com.aventstack.extentreports.ExtentTest;
import com.aventstack.extentreports.Status;
import com.aventstack.extentreports.reporter.ExtentSparkReporter;
import com.aventstack.extentreports.reporter.configuration.Theme;
import org.junit.jupiter.api.extension.*;

import java.util.Optional;

public class ExtentReportListener implements TestWatcher, BeforeAllCallback, AfterAllCallback {

    private static final ExtentReports extent = createReport();
    private static final ThreadLocal<ExtentTest> testThread = new ThreadLocal<>();

    public static ExtentTest getTest() { return testThread.get(); }

    @Override
    public void beforeAll(ExtensionContext context) {
        extent.setSystemInfo("Suite", context.getDisplayName());
        extent.setSystemInfo("Base URL", System.getProperty("api.base.url", "see config.properties"));
    }

    @Override
    public void testSuccessful(ExtensionContext context) {
        ExtentTest test = extent.createTest(context.getDisplayName())
                .assignCategory(context.getRequiredTestClass().getSimpleName());
        test.log(Status.PASS, "Test passed");
        testThread.set(test);
    }

    @Override
    public void testFailed(ExtensionContext context, Throwable cause) {
        ExtentTest test = extent.createTest(context.getDisplayName())
                .assignCategory(context.getRequiredTestClass().getSimpleName());
        test.log(Status.FAIL, cause.getMessage()).fail(cause);
        testThread.set(test);
    }

    @Override
    public void testAborted(ExtensionContext context, Throwable cause) {
        ExtentTest test = extent.createTest(context.getDisplayName());
        test.log(Status.SKIP, "Test aborted: " + cause.getMessage());
        testThread.set(test);
    }

    @Override
    public void testDisabled(ExtensionContext context, Optional<String> reason) {
        ExtentTest test = extent.createTest(context.getDisplayName());
        test.log(Status.SKIP, "Disabled: " + reason.orElse("no reason"));
        testThread.set(test);
    }

    @Override
    public void afterAll(ExtensionContext context) {
        extent.flush();
        testThread.remove();
    }

    private static ExtentReports createReport() {
        String path = System.getProperty("extent.report.path", "target/extent-reports/api-test-report.html");
        ExtentSparkReporter spark = new ExtentSparkReporter(path);
        spark.config().setDocumentTitle("API Test Report");
        spark.config().setReportName("API Test Report");
        spark.config().setTheme(Theme.DARK);
        spark.config().setEncoding("UTF-8");
        ExtentReports ext = new ExtentReports();
        ext.attachReporter(spark);
        ext.setSystemInfo("Framework", "REST Assured");
        ext.setSystemInfo("Environment", System.getProperty("env", "default"));
        return ext;
    }
}
`;
  }

  // ─── Retry file (runner-aware) ────────────────────────────────────────────────

  private buildRetryFile(pkg: string, pkgPath: string, runner: 'testng' | 'junit5', blueprint: FrameworkBlueprint): GeneratedFile {
    const maxRetry = (blueprint.nodes ?? [])
      .find(n => n.nodeId === 'restassured-java-retry')?.config?.['maxRetry'] as number ?? 2;
    return {
      path:    `src/test/java/${pkgPath}/util/ApiRetryAnalyzer.java`,
      content: runner === 'junit5'
        ? this.buildRetryJunit5(pkg, maxRetry)
        : this.buildRetryTestng(pkg, maxRetry),
    };
  }

  private buildRetryTestng(pkg: string, maxRetry: number): string {
    return `package ${pkg}.util;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.testng.IRetryAnalyzer;
import org.testng.ITestResult;

/**
 * TestNG retry analyzer for flaky API tests.
 *
 * Attach to a test method:
 *   @Test(retryAnalyzer = ApiRetryAnalyzer.class)
 *   public void smoke_addPet() { ... }
 */
public class ApiRetryAnalyzer implements IRetryAnalyzer {

    private static final Logger log = LogManager.getLogger(ApiRetryAnalyzer.class);
    private static final int MAX_RETRY = ${maxRetry};

    private int retryCount = 0;

    @Override
    public boolean retry(ITestResult result) {
        if (retryCount < MAX_RETRY) {
            retryCount++;
            log.warn("Retrying '{}' — attempt {}/{} — reason: {}",
                    result.getName(), retryCount, MAX_RETRY,
                    result.getThrowable() != null ? result.getThrowable().getMessage() : "unknown");
            return true;
        }
        return false;
    }
}
`;
  }

  private buildRetryJunit5(pkg: string, maxRetry: number): string {
    return `package ${pkg}.util;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.jupiter.api.extension.TestExecutionExceptionHandler;

/**
 * JUnit5 retry handler for flaky API tests.
 *
 * Retries up to MAX_RETRY times before propagating the failure.
 *
 * Usage — annotate a test class or method:
 *   @ExtendWith(ApiRetryAnalyzer.class)
 *   public class PetTest extends BaseApiTest { ... }
 *
 * For annotation-level retry (@RetryingTest), add junit-pioneer:
 *   <dependency>
 *     <groupId>org.junit-pioneer</groupId>
 *     <artifactId>junit-pioneer</artifactId>
 *     <version>2.2.0</version>
 *     <scope>test</scope>
 *   </dependency>
 */
public class ApiRetryAnalyzer implements TestExecutionExceptionHandler {

    private static final Logger log = LogManager.getLogger(ApiRetryAnalyzer.class);
    private static final int MAX_RETRY = ${maxRetry};

    private final ThreadLocal<Integer> attempts = ThreadLocal.withInitial(() -> 0);

    @Override
    public void handleTestExecutionException(ExtensionContext context, Throwable throwable) throws Throwable {
        int attempt = attempts.get() + 1;
        if (attempt <= MAX_RETRY) {
            attempts.set(attempt);
            log.warn("Test '{}' failed (attempt {}/{}): {}",
                    context.getDisplayName(), attempt, MAX_RETRY, throwable.getMessage());
        } else {
            attempts.remove();
            throw throwable;
        }
    }
}
`;
  }

  private buildTestMethods(
    ep: ParsedEndpoint,
    level: 'smoke' | 'functional',
    runner: 'testng' | 'junit5',
    dataStrat: string,
    reporting: 'allure' | 'extent' | 'none',
    className: string,
  ): string[] {
    const methods: string[] = [];
    const safeId = this.toMethodName(ep.operationId);
    const useCsv    = dataStrat === 'custom';
    const pathArgs  = this.buildPathArgs(ep, useCsv);
    const queryArgs = this.buildQueryArgs(ep, useCsv);
    const bodyArg   = this.buildBodyArg(ep, useCsv);
    const chain = this.buildChain(ep, pathArgs, queryArgs, bodyArg);

    const expectedStatus = this.expectedStatus(ep);
    const statusMatcher = this.buildStatusMatcher(ep, expectedStatus);

    const testAnnotation = runner === 'junit5'
      ? '@org.junit.jupiter.api.Test'
      : (useCsv ? '@Test(dataProvider = "csvEndpointData")' : '@Test');
    const assertClass    = runner === 'junit5' ? 'Assertions' : 'Assert';

    // TestNG: csvRow arrives as a @DataProvider parameter; JUnit5: read inline at method start
    const csvParam    = (useCsv && runner === 'testng') ? 'Map<String, String> csvRow' : '';
    const methodParam = csvParam ? `(${csvParam})` : '()';
    const csvPreamble = (useCsv && runner === 'junit5')
      ? `        Map<String, String> csvRow = CsvDataReader.firstRow("testdata/${className.toLowerCase()}_data.csv");\n`
      : '';
    // Edge-case methods (auth/validation) use literal path values — no data strategy dependency
    const edgeCasePathArgs = this.buildPathArgsLiteral(ep);

    // ── Allure method-level annotations ───────────────────────────────────────
    const smokeAnnotations     = this.buildMethodAnnotations(reporting, 'NORMAL',   `Smoke: ${ep.method} ${ep.path} — status ${expectedStatus}`,   `Verify that ${ep.method} ${ep.path} returns HTTP ${expectedStatus}. ${ep.summary}`);
    const perfAnnotations      = this.buildMethodAnnotations(reporting, 'MINOR',    `Performance: ${ep.method} ${ep.path} — response time`,         `Verify that ${ep.method} ${ep.path} responds within 5 seconds.`);
    const contentAnnotations   = this.buildMethodAnnotations(reporting, 'NORMAL',   `Functional: ${ep.method} ${ep.path} — content type`,           `Verify that ${ep.method} ${ep.path} returns JSON content type.`);
    const authAnnotations      = this.buildMethodAnnotations(reporting, 'CRITICAL', `Security: ${ep.method} ${ep.path} — no auth returns 401`,      `Verify that ${ep.method} ${ep.path} returns 401 Unauthorized when no auth token is provided.`);
    const validationAnnotations= this.buildMethodAnnotations(reporting, 'NORMAL',   `Validation: ${ep.method} ${ep.path} — empty body returns 400`, `Verify that ${ep.method} ${ep.path} returns 400 Bad Request when an empty body is submitted.`);

    // ── Smoke ─────────────────────────────────────────────────────────────────
    methods.push(`    ${testAnnotation}${smokeAnnotations}
    public void smoke_${safeId}${methodParam} {
${csvPreamble}${chain}
            .statusCode(${statusMatcher})
            .extract().response();
    }`);

    if (level === 'functional') {
      // ── Response time ───────────────────────────────────────────────────────
      methods.push(`    ${testAnnotation}${perfAnnotations}
    public void perf_${safeId}_responseTime${methodParam} {
${csvPreamble}${chain}
            .statusCode(${statusMatcher})
            .time(lessThan(5000L))
            .extract().response();
    }`);

      // ── Content-Type (skip DELETE) ──────────────────────────────────────────
      if (ep.method !== 'DELETE') {
        methods.push(`    ${testAnnotation}${contentAnnotations}
    public void functional_${safeId}_contentType${methodParam} {
${csvPreamble}${chain}
            .statusCode(${statusMatcher})
            .contentType("application/json")
            .extract().response();
    }`);
      }

      // ── Auth failure — always uses literal path values, no data strategy ────
      if (ep.requiresAuth) {
        methods.push(`    ${testAnnotation}${authAnnotations}
    public void security_${safeId}_noAuth_unauthorized() {
        Response response = given()
                .baseUri(baseUri)
                .header("Content-Type", "application/json")
        .when()
                .${ep.method.toLowerCase()}("${ep.path}"${edgeCasePathArgs ? `, ${edgeCasePathArgs}` : ''})
        .then()
                .statusCode(anyOf(equalTo(401), equalTo(403)))
                .extract().response();

        ${assertClass}.assertTrue(response.statusCode() == 401 || response.statusCode() == 403,
            "Expected 401 or 403 without auth token, got: " + response.statusCode());
    }`);
      }

      // ── Empty body validation — always uses literal path values ─────────────
      if (['POST', 'PUT', 'PATCH'].includes(ep.method) && ep.requestBodyRequired) {
        methods.push(`    ${testAnnotation}${validationAnnotations}
    public void validation_${safeId}_emptyBody_returns400() {
        given()
                .spec(requestSpec)
                .body("{}")
        .when()
                .${ep.method.toLowerCase()}("${ep.path}"${edgeCasePathArgs ? `, ${edgeCasePathArgs}` : ''})
        .then()
                .statusCode(anyOf(equalTo(400), equalTo(422)))
                .extract().response();
    }`);
      }
    }

    return methods;
  }

  private buildMethodAnnotations(
    reporting: 'allure' | 'extent' | 'none',
    severity: string,
    story: string,
    description: string,
  ): string {
    if (reporting !== 'allure') return '';
    return `\n    @Severity(SeverityLevel.${severity})\n    @Story("${story}")\n    @Description("${description}")`;
  }

  // ─── Build RestAssured chain ──────────────────────────────────────────────────

  private buildChain(ep: ParsedEndpoint, pathArgs: string, queryArgs: string, bodyArg: string): string {
    const lines: string[] = [
      '        Response response = given()',
      '                .spec(requestSpec)',
    ];
    if (queryArgs) lines.push(`                ${queryArgs}`);
    if (bodyArg)   lines.push(`                ${bodyArg}`);
    lines.push('        .when()');
    lines.push(`                .${ep.method.toLowerCase()}("${ep.path}"${pathArgs ? `, ${pathArgs}` : ''})`);
    lines.push('        .then()');
    return lines.join('\n');
  }

  private buildPathArgs(ep: ParsedEndpoint, useCsv: boolean): string {
    const pathParams = ep.parameters.filter(p => p.in === 'path');
    if (!pathParams.length) return '';
    const args = pathParams.map(p =>
      useCsv
        ? `csvRow.getOrDefault("${p.name}", "1")`
        : `TestDataFaker.forParam("${p.name}", "${p.type}")`
    ).join(', ');
    return args;
  }

  private buildQueryArgs(ep: ParsedEndpoint, useCsv: boolean): string {
    const qParams = ep.parameters.filter(p => p.in === 'query' && p.required);
    if (!qParams.length) return '';
    const parts = qParams.map(p => {
      const value = useCsv
        ? `csvRow.getOrDefault("${p.name}", "")`
        : (p.enum?.length ? `"${p.enum[0]}"` : `TestDataFaker.forParam("${p.name}", "${p.type}")`);
      return `"${p.name}", ${value}`;
    }).join(', ');
    return `.queryParams(${parts})`;
  }

  private buildBodyArg(ep: ParsedEndpoint, useCsv: boolean): string {
    if (!['POST', 'PUT', 'PATCH'].includes(ep.method)) return '';
    if (!ep.requestBodySchema) return '';
    if (useCsv) return '.body(csvRow)';
    return `.body(TestDataFaker.buildBody(${JSON.stringify(JSON.stringify(ep.requestBodySchema ?? {}))}))`;
  }

  private buildPathArgsLiteral(ep: ParsedEndpoint): string {
    const pathParams = ep.parameters.filter(p => p.in === 'path');
    if (!pathParams.length) return '';
    return pathParams.map(p =>
      (p.type === 'integer' || p.type === 'number') ? '"1"' : '"test"'
    ).join(', ');
  }

  private expectedStatus(ep: ParsedEndpoint): number {
    const codes = Object.keys(ep.responses).map(Number).filter(n => !isNaN(n)).sort();
    const ok = codes.find(c => c >= 200 && c < 300);
    return ok ?? 200;
  }

  private buildStatusMatcher(ep: ParsedEndpoint, expected: number): string {
    if (ep.method === 'DELETE') {
      return 'anyOf(equalTo(200), equalTo(204), equalTo(404))';
    }
    if (ep.method === 'GET' && ep.parameters.some(p => p.in === 'path')) {
      return `anyOf(equalTo(${expected}), equalTo(404))`;
    }
    return `equalTo(${expected})`;
  }

  // ─── testng.xml ───────────────────────────────────────────────────────────────

  private buildTestNgXml(pkg: string, classNames: string[]): GeneratedFile {
    const classTags = classNames.map(c =>
      `            <class name="${pkg}.tests.${c}Test"/>`
    ).join('\n');

    return {
      path: 'src/test/resources/testng.xml',
      content: `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE suite SYSTEM "https://testng.org/testng-1.0.dtd">
<suite name="Qlitz API Test Suite" parallel="methods" thread-count="4" verbose="1">

    <listeners>
        <listener class-name="io.qameta.allure.testng.AllureTestNg"/>
    </listeners>

    <test name="API Tests">
        <classes>
${classTags}
        </classes>
    </test>

</suite>
`,
    };
  }

  // ─── Sample CSV ───────────────────────────────────────────────────────────────

  private buildSampleCsv(endpoints: ParsedEndpoint[]): GeneratedFile {
    const rows: string[][] = [];
    const header = ['endpoint', 'method', 'expected_status', 'description'];
    rows.push(header);

    for (const ep of endpoints.slice(0, 20)) {
      rows.push([
        ep.path,
        ep.method,
        String(this.expectedStatus(ep)),
        ep.summary.replace(/,/g, ';'),
      ]);
    }

    return {
      path: 'src/test/resources/testdata/api_endpoints.csv',
      content: rows.map(r => r.join(',')).join('\n') + '\n',
    };
  }

  // ─── Utilities ────────────────────────────────────────────────────────────────

  private groupByTag(endpoints: ParsedEndpoint[]): Record<string, ParsedEndpoint[]> {
    const map: Record<string, ParsedEndpoint[]> = {};
    for (const ep of endpoints) {
      if (!map[ep.tag]) map[ep.tag] = [];
      map[ep.tag].push(ep);
    }
    return map;
  }

  private toClassName(tag: string): string {
    return tag
      .split(/[\s_-]+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join('');
  }

  private toMethodName(opId: string): string {
    return opId
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }
}
