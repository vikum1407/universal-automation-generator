import { Requirement } from '../rtm/rtm.model';

export class UIPOMGenerator {
  generate(pageUrl: string, requirements: Requirement[]): string {
    const className = this.buildClassName(pageUrl);

    let content = `import { Page } from '@playwright/test';

export class ${className} {
  constructor(private page: Page) {}

`;

    for (const req of requirements) {
      if (!req.selector) continue;

      const methodName = this.buildMethodName(req);

      content += `
  async ${methodName}() {
    return this.page.locator('${req.selector}');
  }
`;
    }

    content += `
}
`;

    return content;
  }

  private buildClassName(url: string): string {
    const name = url.split('/').filter(Boolean).pop() || 'home';
    return name.charAt(0).toUpperCase() + name.slice(1) + 'Page';
  }

  private buildMethodName(req: Requirement): string {
    return req.description
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .split(' ')
      .filter(Boolean)
      .slice(0, 3)
      .join('_')
      .toLowerCase();
  }
}
