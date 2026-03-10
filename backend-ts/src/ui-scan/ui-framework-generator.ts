import { UITestGenerator } from './ui-test-generator';

export class UIFrameworkGenerator {
  async generate(grouped: Record<string, any[]>) {
    const testGen = new UITestGenerator();

    const results: Record<string, string[]> = {};

    for (const pageUrl of Object.keys(grouped)) {
      const reqs = grouped[pageUrl];
      results[pageUrl] = reqs.map(req => testGen.generate(req));
    }

    return results;
  }
}
