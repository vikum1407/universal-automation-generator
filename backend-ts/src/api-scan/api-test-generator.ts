import { Requirement } from '../rtm/rtm.model';

export class APITestGenerator {
  generate(requirement: Requirement): string {
    return `
import { test, expect } from '@playwright/test';

test('${requirement.id}: ${this.sanitize(requirement.description)}', async ({ request }) => {
  const response = await request.${requirement.method?.toLowerCase()}('${requirement.url}', {
    data: ${this.formatBody(requirement.requestBody)}
  });

  expect(response.status()).toBe(${requirement.expectedStatus});

  const json = await response.json().catch(() => null);
  expect(json).not.toBeNull();
});
`;
  }

  private sanitize(text: string): string {
    return text
      .replace(/`/g, '\\`')
      .replace(/"/g, '\\"')
      .replace(/'/g, "\\'");
  }

  private formatBody(body: any): string {
    if (!body) return 'undefined';
    try {
      return JSON.stringify(body, null, 2);
    } catch {
      return 'undefined';
    }
  }
}
