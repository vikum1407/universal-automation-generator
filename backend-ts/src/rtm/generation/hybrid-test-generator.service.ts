import { Injectable } from '@nestjs/common';
import type { TestMetadata } from './mapping/test-metadata-builder';
import { buildTSTagComment, buildJavaTagComment, buildTestNGGroups } from './mapping/test-metadata-builder';

export interface HybridTestSpec {
  fileName:  string;
  content:   string;
  testCount: number;
}

function toTitleCase(s: string): string {
  return s.replace(/\b\w/g, c => c.toUpperCase()).replace(/[^a-zA-Z0-9]/g, '');
}

@Injectable()
export class HybridTestGeneratorService {

  generate(
    framework:        string,
    language:         string,
    requirementKey:   string,
    requirementTitle: string,
    baseUrl:          string,
    uiFlows:          string[],
    endpoints:        { method: string; path: string }[],
    meta:             TestMetadata,
    strategy:         'smoke' | 'regression' | 'full' = 'smoke',
  ): HybridTestSpec {
    const lang = language.toLowerCase();
    if (lang === 'java') {
      return this.hybridJava(requirementKey, requirementTitle, baseUrl, uiFlows, endpoints, meta, strategy);
    }
    // Default: Playwright hybrid (TS/JS)
    return this.playwrightHybrid(requirementKey, requirementTitle, baseUrl, uiFlows, endpoints, meta, strategy);
  }

  // ── Playwright hybrid / TypeScript ───────────────────────────────────────────

  private playwrightHybrid(
    reqKey: string, title: string,
    baseUrl: string, flows: string[], endpoints: { method: string; path: string }[],
    meta: TestMetadata, strategy: string,
  ): HybridTestSpec {
    const tagComment = buildTSTagComment(meta);
    const ep = endpoints[0] ?? { method: 'GET', path: '/api' };
    const flowInfo = flows.length ? `// UI Flows: ${flows.join(' → ')}` : '// TODO: add UI flow steps';

    const setupTest = `
  test('API setup → UI verification for ${title}', async ({ page, request }) => {
    // Step 1: API setup — create/fetch prerequisite state
    const apiResponse = await request.${ep.method.toLowerCase()}(\`\${BASE_URL}${ep.path}\`);
    expect(apiResponse.status()).toBeLessThan(300);
    ${ep.method !== 'DELETE' ? "const apiData = await apiResponse.json();" : ''}

    // Step 2: Navigate to UI and verify state
    ${flowInfo}
    await page.goto('${baseUrl}');
    // TODO: assert UI reflects the API state
    // Example: await expect(page.locator('[data-testid="item"]')).toBeVisible();
    await expect(page.locator('body')).toBeVisible();
  });`;

    const verifyAPITest = strategy !== 'smoke' ? `
  test('UI action → API state verification for ${title}', async ({ page, request }) => {
    // Step 1: Perform UI action
    await page.goto('${baseUrl}');
    ${flowInfo}
    // TODO: interact with UI
    // Example: await page.click('[data-testid="submit"]');

    // Step 2: Verify API reflects the change
    const verifyResponse = await request.${ep.method.toLowerCase()}(\`\${BASE_URL}${ep.path}\`);
    expect(verifyResponse.status()).toBeLessThan(300);
  });` : '';

    const content = `import { test, expect } from '@playwright/test';

${tagComment}
// Hybrid Test: ${reqKey} — ${title}
// Pattern: API Setup → UI Verification and UI Action → API Verification

const BASE_URL = process.env.BASE_URL ?? '${baseUrl}';

test.describe('Hybrid: ${reqKey} — ${title}', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('${baseUrl}');
  });
${setupTest}
${verifyAPITest}
});
`;
    const testCount = 1 + (strategy !== 'smoke' ? 1 : 0);
    return { fileName: `${reqKey}-hybrid.spec.ts`.toLowerCase(), content, testCount };
  }

  // ── Selenium + RestAssured / Java hybrid ──────────────────────────────────────

  private hybridJava(
    reqKey: string, title: string,
    baseUrl: string, flows: string[], endpoints: { method: string; path: string }[],
    meta: TestMetadata, strategy: string,
  ): HybridTestSpec {
    const className  = toTitleCase(reqKey) + 'HybridTest';
    const tagComment = buildJavaTagComment(meta);
    const groups     = buildTestNGGroups(meta);
    const ep = endpoints[0] ?? { method: 'GET', path: '/api' };

    const content = `package rtm.hybrid;

import io.restassured.RestAssured;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.testng.annotations.*;
import static io.restassured.RestAssured.*;
import static org.testng.Assert.*;

/**
 * Hybrid Test: ${reqKey} — ${title}
 * Pattern: API setup → UI verification
 *
 * @rtm-req  ${meta.requirementIds.join(' ')}
 * @rtm-key  ${meta.requirementKeys.join(' ')}
 * @rtm-flow ${meta.uiFlowIds.join(' ')}
 * @rtm-endpoint ${meta.endpointIds.join(' ')}
 */
public class ${className} {
  private WebDriver driver;
  private static final String BASE_URL = System.getenv().getOrDefault("BASE_URL", "${baseUrl}");

  @BeforeMethod
  public void setUp() {
    RestAssured.baseURI = BASE_URL;
    driver = new ChromeDriver();
  }

  @AfterMethod
  public void tearDown() {
    if (driver != null) driver.quit();
  }

${tagComment}
  @Test${groups}
  public void apiSetupThenUIVerification() {
    // Step 1: API setup — establish state
    // Flows: ${flows.join(' → ')}
    given().contentType("application/json")
    .when().${ep.method.toLowerCase()}("${ep.path}")
    .then().statusCode(200);

    // Step 2: UI verification — confirm UI reflects state
    driver.get("${baseUrl}");
    // TODO: fill in WebDriver locators and assertions
    assertTrue(driver.getTitle() != null);
  }
${strategy !== 'smoke' ? `
  @Test${groups}
  public void uiActionThenAPIVerification() {
    // Step 1: UI action
    driver.get("${baseUrl}");
    // TODO: perform UI interaction

    // Step 2: API verification
    given().contentType("application/json")
    .when().${ep.method.toLowerCase()}("${ep.path}")
    .then().statusCode(200);
  }` : ''}
}
`;
    const testCount = 1 + (strategy !== 'smoke' ? 1 : 0);
    return { fileName: `${className}.java`, content, testCount };
  }
}
