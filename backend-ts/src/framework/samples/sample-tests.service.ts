import * as fs from 'fs';
import * as path from 'path';
import { Injectable, Logger } from '@nestjs/common';
import type { FrameworkBlueprint, BlueprintSamples } from '../blueprint/blueprint.model';

// SampleTestsService seeds a generated project with ready-to-run sample tests.
// It is deliberately decoupled from the full UI/API/hybrid scan pipelines —
// it writes static, parameterised sample files, not AI-generated flows.
// The coupling point is: (a) the blueprint metadata, (b) the output path.

export interface SeedResult {
  uiTests:    string[];
  apiTests:   string[];
  hybridTests: string[];
}

@Injectable()
export class SampleTestsService {
  private readonly logger = new Logger(SampleTestsService.name);

  async seedSamples(
    blueprint: FrameworkBlueprint,
    projectRoot: string,
  ): Promise<SeedResult> {
    const samples = blueprint.samples ?? {};
    const result: SeedResult = { uiTests: [], apiTests: [], hybridTests: [] };

    if (samples.uiTests)     result.uiTests     = await this.writeUISamples(blueprint, projectRoot);
    if (samples.apiTests)    result.apiTests    = await this.writeAPISamples(blueprint, projectRoot);
    if (samples.hybridFlows) result.hybridTests = await this.writeHybridSamples(blueprint, projectRoot);

    return result;
  }

  // ─── UI sample tests ────────────────────────────────────────────────────────

  private writeUISamples(blueprint: FrameworkBlueprint, root: string): string[] {
    const { framework, language } = blueprint;
    const baseUrl  = (blueprint.executionConfig as any)?.baseUrl ?? 'https://example.com';
    const files: Array<{ rel: string; content: string }> = [];

    if (framework === 'playwright' && language === 'typescript') {
      files.push({
        rel: 'tests/ui/login.spec.ts',
        content: playwrightUISample(baseUrl),
      });
    } else if (framework === 'cypress') {
      files.push({
        rel: 'cypress/e2e/ui/login.cy.ts',
        content: cypressUISample(baseUrl),
      });
    } else if (framework === 'selenium' && language === 'java') {
      files.push({
        rel: 'src/test/java/sample/LoginTest.java',
        content: seleniumJavaUISample(baseUrl),
      });
    } else if (framework === 'selenium' && language === 'python') {
      files.push({
        rel: 'tests/ui/test_login.py',
        content: seleniumPythonUISample(baseUrl),
      });
    } else {
      this.logger.warn(`No UI sample template for ${framework}/${language}`);
    }

    return this.writeFiles(root, files);
  }

  // ─── API sample tests ────────────────────────────────────────────────────────

  private writeAPISamples(blueprint: FrameworkBlueprint, root: string): string[] {
    const { framework, language } = blueprint;
    const baseUrl = (blueprint.executionConfig as any)?.baseUrl ?? 'https://example.com';
    const files: Array<{ rel: string; content: string }> = [];

    if (language === 'typescript' || language === 'javascript') {
      files.push({
        rel: 'tests/api/users.api.spec.ts',
        content: playwrightAPISample(baseUrl),
      });
    } else if (language === 'python') {
      files.push({
        rel: 'tests/api/test_users_api.py',
        content: pythonAPISample(baseUrl),
      });
    } else if (language === 'java') {
      files.push({
        rel: 'src/test/java/sample/UsersApiTest.java',
        content: javaAPISample(baseUrl),
      });
    } else {
      this.logger.warn(`No API sample template for ${framework}/${language}`);
    }

    return this.writeFiles(root, files);
  }

  // ─── Hybrid sample tests ──────────────────────────────────────────────────

  private writeHybridSamples(blueprint: FrameworkBlueprint, root: string): string[] {
    const { framework, language } = blueprint;
    const baseUrl = (blueprint.executionConfig as any)?.baseUrl ?? 'https://example.com';
    const files: Array<{ rel: string; content: string }> = [];

    if (language === 'typescript' || language === 'javascript') {
      files.push({
        rel: 'tests/hybrid/checkout-flow.spec.ts',
        content: playwrightHybridSample(baseUrl),
      });
    } else if (language === 'python') {
      files.push({
        rel: 'tests/hybrid/test_checkout_flow.py',
        content: pythonHybridSample(baseUrl),
      });
    } else {
      this.logger.warn(`No hybrid sample template for ${framework}/${language}`);
    }

    return this.writeFiles(root, files);
  }

  // ─── File writer ─────────────────────────────────────────────────────────────

  private writeFiles(root: string, files: Array<{ rel: string; content: string }>): string[] {
    const written: string[] = [];
    for (const f of files) {
      const abs = path.join(root, f.rel);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, f.content, 'utf8');
      written.push(f.rel);
    }
    return written;
  }
}

// ─── Sample content factories ─────────────────────────────────────────────────

function playwrightUISample(baseUrl: string): string {
  return `import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('${baseUrl}');
    await expect(page).toHaveTitle(/.*/);
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('${baseUrl}/login');
    await page.fill('[data-testid="email"]', 'invalid@example.com');
    await page.fill('[data-testid="password"]', 'wrongpassword');
    await page.click('[data-testid="login-btn"]');
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });
});
`;
}

function cypressUISample(baseUrl: string): string {
  return `describe('Login Flow', () => {
  beforeEach(() => {
    cy.visit('${baseUrl}/login');
  });

  it('should display the login form', () => {
    cy.get('[data-testid="email"]').should('be.visible');
    cy.get('[data-testid="password"]').should('be.visible');
  });

  it('should show error on invalid login', () => {
    cy.get('[data-testid="email"]').type('invalid@example.com');
    cy.get('[data-testid="password"]').type('wrongpassword');
    cy.get('[data-testid="login-btn"]').click();
    cy.get('[data-testid="error-message"]').should('be.visible');
  });
});
`;
}

function seleniumJavaUISample(baseUrl: string): string {
  return `package sample;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.testng.annotations.*;
import static org.testng.Assert.*;

public class LoginTest {
  private WebDriver driver;

  @BeforeMethod
  public void setUp() {
    driver = new ChromeDriver();
    driver.get("${baseUrl}/login");
  }

  @Test(description = "Login form is visible")
  public void loginFormVisible() {
    assertTrue(driver.findElement(By.cssSelector("[data-testid='email']")).isDisplayed());
  }

  @Test(description = "Invalid login shows error")
  public void invalidLoginShowsError() {
    driver.findElement(By.cssSelector("[data-testid='email']")).sendKeys("invalid@example.com");
    driver.findElement(By.cssSelector("[data-testid='password']")).sendKeys("wrongpassword");
    driver.findElement(By.cssSelector("[data-testid='login-btn']")).click();
    assertTrue(driver.findElement(By.cssSelector("[data-testid='error-message']")).isDisplayed());
  }

  @AfterMethod
  public void tearDown() {
    if (driver != null) driver.quit();
  }
}
`;
}

function seleniumPythonUISample(baseUrl: string): string {
  return `import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By


@pytest.fixture
def driver():
    d = webdriver.Chrome()
    d.get("${baseUrl}/login")
    yield d
    d.quit()


def test_login_form_visible(driver):
    assert driver.find_element(By.CSS_SELECTOR, "[data-testid='email']").is_displayed()


def test_invalid_login_shows_error(driver):
    driver.find_element(By.CSS_SELECTOR, "[data-testid='email']").send_keys("invalid@example.com")
    driver.find_element(By.CSS_SELECTOR, "[data-testid='password']").send_keys("wrongpassword")
    driver.find_element(By.CSS_SELECTOR, "[data-testid='login-btn']").click()
    assert driver.find_element(By.CSS_SELECTOR, "[data-testid='error-message']").is_displayed()
`;
}

function playwrightAPISample(baseUrl: string): string {
  return `import { test, expect, request } from '@playwright/test';

test.describe('Users API', () => {
  test('GET /api/users returns 200', async ({ request }) => {
    const response = await request.get('${baseUrl}/api/users');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('POST /api/users creates a user', async ({ request }) => {
    const response = await request.post('${baseUrl}/api/users', {
      data: { name: 'Test User', email: 'test@example.com' },
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toHaveProperty('id');
  });
});
`;
}

function pythonAPISample(baseUrl: string): string {
  return `import requests


BASE_URL = "${baseUrl}"


def test_get_users_returns_200():
    response = requests.get(f"{BASE_URL}/api/users")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_create_user_returns_201():
    payload = {"name": "Test User", "email": "test@example.com"}
    response = requests.post(f"{BASE_URL}/api/users", json=payload)
    assert response.status_code == 201
    assert "id" in response.json()
`;
}

function javaAPISample(baseUrl: string): string {
  return `package sample;

import io.restassured.RestAssured;
import io.restassured.response.Response;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;
import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

public class UsersApiTest {

  @BeforeClass
  public void setUp() {
    RestAssured.baseURI = "${baseUrl}";
  }

  @Test(description = "GET /api/users returns 200")
  public void getUsersReturns200() {
    given().when().get("/api/users")
      .then().statusCode(200).body("$", hasSize(greaterThanOrEqualTo(0)));
  }

  @Test(description = "POST /api/users creates a user")
  public void createUserReturns201() {
    given().contentType("application/json")
      .body("{\\"name\\":\\"Test User\\",\\"email\\":\\"test@example.com\\"}")
      .when().post("/api/users")
      .then().statusCode(201).body("id", notNullValue());
  }
}
`;
}

function playwrightHybridSample(baseUrl: string): string {
  return `import { test, expect, request } from '@playwright/test';

// Hybrid flow: API setup → UI verification
test.describe('Checkout Flow (Hybrid)', () => {
  test('API creates order, UI confirms it', async ({ page, request }) => {
    // Step 1: Create an order via API
    const apiResponse = await request.post('${baseUrl}/api/orders', {
      data: { productId: 'prod-001', quantity: 1 },
    });
    expect(apiResponse.status()).toBe(201);
    const { orderId } = await apiResponse.json();

    // Step 2: Verify the order appears in the UI
    await page.goto('${baseUrl}/orders/' + orderId);
    await expect(page.locator('[data-testid="order-id"]')).toContainText(orderId);
    await expect(page.locator('[data-testid="order-status"]')).toContainText('pending');
  });
});
`;
}

function pythonHybridSample(baseUrl: string): string {
  return `import requests
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By


BASE_URL = "${baseUrl}"


@pytest.fixture
def driver():
    d = webdriver.Chrome()
    yield d
    d.quit()


def test_api_creates_order_ui_confirms(driver):
    # Step 1: Create an order via API
    response = requests.post(f"{BASE_URL}/api/orders", json={"productId": "prod-001", "quantity": 1})
    assert response.status_code == 201
    order_id = response.json()["orderId"]

    # Step 2: Verify the order appears in the UI
    driver.get(f"{BASE_URL}/orders/{order_id}")
    assert order_id in driver.find_element(By.CSS_SELECTOR, "[data-testid='order-id']").text
`;
}
