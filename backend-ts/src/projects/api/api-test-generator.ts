import { Requirement } from '../../rtm/rtm.model';

export class APITestGenerator {
  generate(requirement: Requirement): string {
    const method = requirement.source.method?.toLowerCase() ?? 'get';
    const endpoint = requirement.source.endpointPath ?? '';
    const expectedStatus = 200;

    const safeDescription = this.sanitize(requirement.description);

    return `
import { test, expect } from '@playwright/test';

test('${requirement.id}: ${safeDescription}', async ({ request }) => {
  const response = await request.${method}(\`${endpoint}\`, {
    headers: { 'Content-Type': 'application/json' }
  });

  expect(response.status()).toBe(${expectedStatus});

  try {
    const json = await response.json();
    expect(json).toBeDefined();
  } catch {}
});
`;
  }

  private sanitize(text: string): string {
    return text
      .replace(/`/g, '\\`')
      .replace(/"/g, '\\"')
      .replace(/'/g, "\\'");
  }
}
