import { Injectable } from '@nestjs/common';
import type { TestMetadata } from './mapping/test-metadata-builder';
import { buildTSTagComment, buildJavaTagComment, buildPythonTagComment, buildTestNGGroups } from './mapping/test-metadata-builder';

export interface UITestSpec {
  fileName:  string;
  content:   string;
  testCount: number;
}

function toTitleCase(str: string): string {
  return str.replace(/\b\w/g, c => c.toUpperCase()).replace(/[^a-zA-Z0-9]/g, '');
}

function toDescription(title: string): string {
  return title.replace(/\b\w/g, c => c.toLowerCase()).replace(/^./, c => c.toLowerCase());
}

@Injectable()
export class UITestGeneratorService {

  generate(
    framework: string,
    language:  string,
    requirementKey:   string,
    requirementTitle: string,
    requirementDesc:  string,
    baseUrl:          string,
    flowNames:        string[],
    meta:             TestMetadata,
    strategy:         'smoke' | 'regression' | 'full' = 'smoke',
  ): UITestSpec {
    const fw = framework.toLowerCase();
    const lang = language.toLowerCase();

    if ((fw === 'playwright' || fw === 'selenium') && (lang === 'typescript' || lang === 'javascript')) {
      return this.playwrightTS(requirementKey, requirementTitle, requirementDesc, baseUrl, flowNames, meta, strategy);
    }
    if (fw === 'cypress' && (lang === 'typescript' || lang === 'javascript')) {
      return this.cypressTS(requirementKey, requirementTitle, requirementDesc, baseUrl, flowNames, meta, strategy);
    }
    if ((fw === 'selenium' || fw === 'appium') && lang === 'java') {
      return this.seleniumJava(requirementKey, requirementTitle, requirementDesc, baseUrl, flowNames, meta, strategy);
    }
    if (lang === 'python') {
      return this.pythonSelenium(requirementKey, requirementTitle, requirementDesc, baseUrl, flowNames, meta, strategy);
    }
    // Default: Playwright TS
    return this.playwrightTS(requirementKey, requirementTitle, requirementDesc, baseUrl, flowNames, meta, strategy);
  }

  // ── Playwright / TypeScript ──────────────────────────────────────────────────

  private playwrightTS(
    reqKey: string, title: string, desc: string,
    baseUrl: string, flows: string[], meta: TestMetadata,
    strategy: string,
  ): UITestSpec {
    const descTag = `${reqKey} — ${title}`;
    const descTest = toDescription(title);
    const flowInfo = flows.length ? flows.map(f => `// Flow: ${f}`).join('\n') : '// No UI flows mapped yet';
    const tagComment = buildTSTagComment(meta);

    const positiveTest = `
  test('should ${descTest}', async ({ page }) => {
    await page.goto('${baseUrl}');
    ${flows.length ? `// Navigate through: ${flows.join(' → ')}` : '// TODO: add navigation steps'}
    // TODO: fill in selectors and interactions from the UI flow
    // Example: await page.click('button[data-testid="submit"]');
    await expect(page.locator('body')).toBeVisible();
  });`;

    const negativeTest = strategy !== 'smoke' ? `
  test('should handle invalid input for ${descTest}', async ({ page }) => {
    await page.goto('${baseUrl}');
    // TODO: submit invalid/empty data and assert error state
    // Example: await page.click('[data-testid="submit"]');
    // await expect(page.locator('[data-testid="error"]')).toBeVisible();
  });` : '';

    const boundaryTest = strategy === 'full' ? `
  test('should handle boundary conditions for ${descTest}', async ({ page }) => {
    await page.goto('${baseUrl}');
    // TODO: test boundary values (empty, max-length, special chars)
  });` : '';

    const content = `import { test, expect } from '@playwright/test';

${tagComment}
${flowInfo}

test.describe('${descTag}', () => {
${positiveTest}
${negativeTest}
${boundaryTest}
});
`;
    const testCount = 1 + (strategy !== 'smoke' ? 1 : 0) + (strategy === 'full' ? 1 : 0);
    return { fileName: `${reqKey}-ui.spec.ts`.toLowerCase(), content, testCount };
  }

  // ── Cypress / TypeScript ─────────────────────────────────────────────────────

  private cypressTS(
    reqKey: string, title: string, desc: string,
    baseUrl: string, flows: string[], meta: TestMetadata,
    strategy: string,
  ): UITestSpec {
    const descTag = `${reqKey} — ${title}`;
    const descTest = toDescription(title);
    const tagComment = buildTSTagComment(meta);

    const positiveTest = `
  it('should ${descTest}', () => {
    cy.visit('${baseUrl}');
    ${flows.length ? `// Flows: ${flows.join(' → ')}` : '// TODO: add flow steps'}
    // TODO: fill in Cypress commands
    cy.get('body').should('be.visible');
  });`;

    const negativeTest = strategy !== 'smoke' ? `
  it('should reject invalid input for ${descTest}', () => {
    cy.visit('${baseUrl}');
    // TODO: test negative path
  });` : '';

    const content = `${tagComment}

describe('${descTag}', () => {
  beforeEach(() => {
    cy.visit('${baseUrl}');
  });
${positiveTest}
${negativeTest}
});
`;
    const testCount = 1 + (strategy !== 'smoke' ? 1 : 0);
    return { fileName: `${reqKey}-ui.cy.ts`.toLowerCase(), content, testCount };
  }

  // ── Selenium / Java ──────────────────────────────────────────────────────────

  private seleniumJava(
    reqKey: string, title: string, desc: string,
    baseUrl: string, flows: string[], meta: TestMetadata,
    strategy: string,
  ): UITestSpec {
    const className = toTitleCase(reqKey) + 'UITest';
    const methodName = 'should' + toTitleCase(title);
    const tagComment = buildJavaTagComment(meta);
    const groups     = buildTestNGGroups(meta);

    const positiveTest = `
${tagComment}
  @Test${groups}
  public void ${methodName}() throws Exception {
    driver.get("${baseUrl}");
    ${flows.length ? `// Flows: ${flows.join(' → ')}` : '// TODO: add WebDriver interactions'}
    // TODO: fill in By locators and WebDriver interactions
    // Example: driver.findElement(By.cssSelector("[data-testid='btn']")).click();
    assertTrue(driver.getTitle() != null);
  }`;

    const negativeTest = strategy !== 'smoke' ? `
  @Test${groups}
  public void ${methodName}WithInvalidInput() throws Exception {
    driver.get("${baseUrl}");
    // TODO: test negative scenario
  }` : '';

    const content = `package rtm.ui;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.By;
import org.testng.annotations.*;
import static org.testng.Assert.*;

/**
 * RTM Test: ${reqKey} — ${title}
 * ${desc}
 *
 * @rtm-req ${meta.requirementIds.join(' ')}
 * @rtm-key ${meta.requirementKeys.join(' ')}
 */
public class ${className} {
  private WebDriver driver;

  @BeforeMethod
  public void setUp() {
    driver = new ChromeDriver();
  }

  @AfterMethod
  public void tearDown() {
    if (driver != null) driver.quit();
  }
${positiveTest}
${negativeTest}
}
`;
    const testCount = 1 + (strategy !== 'smoke' ? 1 : 0);
    return { fileName: `${className}.java`, content, testCount };
  }

  // ── Python / Selenium ────────────────────────────────────────────────────────

  private pythonSelenium(
    reqKey: string, title: string, desc: string,
    baseUrl: string, flows: string[], meta: TestMetadata,
    strategy: string,
  ): UITestSpec {
    const tagComment = buildPythonTagComment(meta);
    const methodName = `test_${reqKey.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    const positiveTest = `
def ${methodName}(driver):
    driver.get("${baseUrl}")
    ${flows.length ? `# Flows: ${flows.join(' → ')}` : '# TODO: add Selenium interactions'}
    # TODO: fill in selectors
    assert driver.title is not None`;

    const negativeTest = strategy !== 'smoke' ? `

def ${methodName}_invalid_input(driver):
    driver.get("${baseUrl}")
    # TODO: test negative path
    pass` : '';

    const content = `${tagComment}

import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By

"""
RTM: ${reqKey} — ${title}
${desc}
"""
${positiveTest}
${negativeTest}
`;
    const testCount = 1 + (strategy !== 'smoke' ? 1 : 0);
    return { fileName: `test_${reqKey.toLowerCase().replace(/[^a-z0-9]/g, '_')}_ui.py`, content, testCount };
  }
}
