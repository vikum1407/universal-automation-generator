import { Requirement } from '../rtm/rtm.model';

export class APITestGenerator {
  generate(requirement: Requirement): string {
    const method = requirement.source.method?.toLowerCase() ?? 'get';
    const url = requirement.source.endpointPath ?? '';
    const expectedStatus = 200;

    return `
import { test, expect } from '@playwright/test';

test('${requirement.id}: ${this.sanitize(requirement.description)}', async ({ request }) => {
  const response = await request.${method}('${url}', {
    data: undefined
  });

  expect(response.status()).toBe(${expectedStatus});

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
}
