import { Injectable } from '@nestjs/common';
import type { TestMetadata } from './mapping/test-metadata-builder';
import { buildTSTagComment, buildJavaTagComment, buildTestNGGroups, buildPythonTagComment } from './mapping/test-metadata-builder';

export interface APITestSpec {
  fileName:  string;
  content:   string;
  testCount: number;
}

function toTitleCase(s: string): string {
  return s.replace(/\b\w/g, c => c.toUpperCase()).replace(/[^a-zA-Z0-9]/g, '');
}

function methodVerb(method: string): string {
  const m: Record<string, string> = { GET: 'retrieve', POST: 'create', PUT: 'update', PATCH: 'patch', DELETE: 'delete' };
  return m[method.toUpperCase()] ?? 'call';
}

function statusForMethod(method: string): number {
  return method === 'POST' ? 201 : method === 'DELETE' ? 204 : 200;
}

@Injectable()
export class APITestGeneratorService {

  generate(
    framework:        string,
    language:         string,
    requirementKey:   string,
    requirementTitle: string,
    baseUrl:          string,
    endpoints:        { method: string; path: string }[],
    meta:             TestMetadata,
    strategy:         'smoke' | 'regression' | 'full' = 'smoke',
  ): APITestSpec {
    const fw   = framework.toLowerCase();
    const lang = language.toLowerCase();

    if (lang === 'java' && (fw === 'restassured' || fw === 'selenium')) {
      return this.restAssuredJava(requirementKey, requirementTitle, baseUrl, endpoints, meta, strategy);
    }
    if (lang === 'python') {
      return this.pythonRequests(requirementKey, requirementTitle, baseUrl, endpoints, meta, strategy);
    }
    // Default: Playwright API (TypeScript)
    return this.playwrightAPI(requirementKey, requirementTitle, baseUrl, endpoints, meta, strategy);
  }

  // ── Playwright API / TypeScript ──────────────────────────────────────────────

  private playwrightAPI(
    reqKey: string, title: string,
    baseUrl: string, endpoints: { method: string; path: string }[],
    meta: TestMetadata, strategy: string,
  ): APITestSpec {
    const tagComment = buildTSTagComment(meta);
    const ep = endpoints[0] ?? { method: 'GET', path: '/api' };

    const positiveTests = endpoints.slice(0, strategy === 'smoke' ? 1 : endpoints.length).map(e => {
      const verb = methodVerb(e.method);
      const status = statusForMethod(e.method);
      const hasBody = ['POST', 'PUT', 'PATCH'].includes(e.method.toUpperCase());
      return `
  test('${e.method} ${e.path} — should ${verb} successfully', async ({ request }) => {
    const response = await request.${e.method.toLowerCase()}(\`\${BASE_URL}${e.path}\`${hasBody ? `, {
      data: {
        // TODO: supply valid request payload
      },
    }` : ''});
    expect(response.status()).toBe(${status});
    ${e.method !== 'DELETE' ? "const body = await response.json();\n    expect(body).toBeDefined();" : '// No body for DELETE'}
  });`;
    }).join('\n');

    const negativeTest = strategy !== 'smoke' ? `
  test('${ep.method} ${ep.path} — should reject unauthorized request', async ({ request }) => {
    const response = await request.${ep.method.toLowerCase()}(\`\${BASE_URL}${ep.path}\`, {
      headers: { Authorization: 'Bearer invalid-token' },
    });
    expect(response.status()).toBe(401);
  });` : '';

    const boundaryTest = strategy === 'full' ? `
  test('${ep.method} ${ep.path} — should return 404 for unknown resource', async ({ request }) => {
    const response = await request.${ep.method.toLowerCase()}(\`\${BASE_URL}${ep.path}/non-existent-id-99999\`);
    expect([404, 400]).toContain(response.status());
  });` : '';

    const content = `import { test, expect } from '@playwright/test';

${tagComment}
// RTM: ${reqKey} — ${title}

const BASE_URL = process.env.BASE_URL ?? '${baseUrl}';

test.describe('API: ${reqKey} — ${title}', () => {
${positiveTests}
${negativeTest}
${boundaryTest}
});
`;
    const testCount = endpoints.length + (strategy !== 'smoke' ? 1 : 0) + (strategy === 'full' ? 1 : 0);
    return { fileName: `${reqKey}-api.spec.ts`.toLowerCase(), content, testCount };
  }

  // ── RestAssured / Java ───────────────────────────────────────────────────────

  private restAssuredJava(
    reqKey: string, title: string,
    baseUrl: string, endpoints: { method: string; path: string }[],
    meta: TestMetadata, strategy: string,
  ): APITestSpec {
    const className  = toTitleCase(reqKey) + 'APITest';
    const tagComment = buildJavaTagComment(meta);
    const groups     = buildTestNGGroups(meta);

    const positiveTests = endpoints.slice(0, strategy === 'smoke' ? 1 : endpoints.length).map(e => {
      const verb   = methodVerb(e.method);
      const status = statusForMethod(e.method);
      return `
${tagComment}
  @Test${groups}
  public void ${e.method.toLowerCase()}${toTitleCase(e.path)}Should${toTitleCase(verb)}() {
    given()
      .baseUri(BASE_URL)
      .contentType("application/json")
    .when()
      .${e.method.toLowerCase()}("${e.path}")
    .then()
      .statusCode(${status});
  }`;
    }).join('\n');

    const negativeTest = strategy !== 'smoke' ? `
  @Test${groups}
  public void shouldRejectUnauthorizedRequest() {
    given()
      .baseUri(BASE_URL)
      .header("Authorization", "Bearer invalid-token")
    .when()
      .get("${endpoints[0]?.path ?? '/api'}")
    .then()
      .statusCode(401);
  }` : '';

    const content = `package rtm.api;

import io.restassured.RestAssured;
import org.testng.annotations.*;
import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

/**
 * RTM API Test: ${reqKey} — ${title}
 *
 * @rtm-req  ${meta.requirementIds.join(' ')}
 * @rtm-key  ${meta.requirementKeys.join(' ')}
 * @rtm-endpoint ${meta.endpointIds.join(' ')}
 */
public class ${className} {
  private static final String BASE_URL = System.getenv().getOrDefault("BASE_URL", "${baseUrl}");

  @BeforeClass
  public static void setup() {
    RestAssured.baseURI = BASE_URL;
  }
${positiveTests}
${negativeTest}
}
`;
    const testCount = endpoints.length + (strategy !== 'smoke' ? 1 : 0);
    return { fileName: `${className}.java`, content, testCount };
  }

  // ── Python / requests ────────────────────────────────────────────────────────

  private pythonRequests(
    reqKey: string, title: string,
    baseUrl: string, endpoints: { method: string; path: string }[],
    meta: TestMetadata, strategy: string,
  ): APITestSpec {
    const tagComment = buildPythonTagComment(meta);

    const positiveTests = endpoints.slice(0, strategy === 'smoke' ? 1 : endpoints.length).map(e => {
      const verb   = methodVerb(e.method);
      const status = statusForMethod(e.method);
      return `
def test_${reqKey.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${e.method.toLowerCase()}_${e.path.replace(/\//g, '_').replace(/[^a-z0-9_]/g, '')}():
    response = requests.${e.method.toLowerCase()}(f"{BASE_URL}${e.path}")
    assert response.status_code == ${status}`;
    }).join('\n');

    const negativeTest = strategy !== 'smoke' ? `

def test_${reqKey.toLowerCase().replace(/[^a-z0-9]/g, '_')}_unauthorized():
    response = requests.${(endpoints[0]?.method ?? 'get').toLowerCase()}(
        f"{BASE_URL}${endpoints[0]?.path ?? '/api'}",
        headers={"Authorization": "Bearer invalid"}
    )
    assert response.status_code == 401` : '';

    const content = `${tagComment}
# RTM: ${reqKey} — ${title}

import pytest
import requests

BASE_URL = __import__('os').environ.get("BASE_URL", "${baseUrl}")
${positiveTests}
${negativeTest}
`;
    const testCount = endpoints.length + (strategy !== 'smoke' ? 1 : 0);
    return { fileName: `test_${reqKey.toLowerCase().replace(/[^a-z0-9]/g, '_')}_api.py`, content, testCount };
  }
}
