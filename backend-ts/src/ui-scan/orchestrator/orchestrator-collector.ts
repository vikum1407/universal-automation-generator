import { chromium } from 'playwright';

export class OrchestratorCollector {
  async explore(url: string, config: any) {
    if (!config.enableExploration) return { pages: [] };

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1500);

    const html = await page.content();
    await browser.close();

    return { pages: [{ url, nodes: [] }] };
  }

  mergePages(url: string, exploration: any) {
    return [{ url, nodes: [] }, ...exploration.pages];
  }

  generateJourneys(config: any, flowGraph: any, reqs: any, gen: any) {
    return config.enableJourneys ? gen.generate(flowGraph, reqs) : [];
  }

  generateScenarios(config: any, journeys: any, reqs: any, engine: any) {
    return config.enableScenarios ? engine.generate(journeys, reqs) : [];
  }

  generateStateGraph(config: any, journeys: any, scenarios: any, reqs: any, engine: any) {
    return config.enableStateGraph
      ? engine.buildStateGraph(journeys, scenarios, reqs)
      : { states: [], transitions: [] };
  }

  collectPlannedTestTitles(reqs: any[], flowGraph: any, journeys: any[], scenarios: any[], stateGraph: any) {
    const titles = new Set<string>();

    for (const r of reqs) {
      titles.add(r.description);
      titles.add(`${r.description} - negative: invalid credentials`);
      titles.add(`${r.description} - negative: add to cart without inventory`);
      titles.add(`${r.description} - negative: checkout with missing data`);
    }

    if (flowGraph?.edges) {
      for (const e of flowGraph.edges) {
        titles.add(`Navigate from ${e.from} to ${e.to}`);
      }
    }

    for (const j of journeys) titles.add(j.title);
    for (const s of scenarios) titles.add(s.title);
    for (const st of stateGraph.states) titles.add(`State invariants for ${st.label}`);

    return Array.from(titles);
  }

  optimize(config: any, titles: any[], scenarios: any[], stateGraph: any, reinforcement: any, engine: any) {
    return config.enableOptimization
      ? engine.optimize(titles, scenarios, stateGraph, reinforcement)
      : {
          testPlan: titles.map((t) => ({ title: t, priority: 3, reason: 'No optimization.' })),
          driftHotspots: [],
          explorationPlan: {},
          selectorEvolutionPlan: [],
          prunedScenarios: []
        };
  }

  prepareForRefactor(reqs: any[]) {
    return reqs.map((r) => ({
      id: r.id,
      page: r.page,
      description: r.description,
      selector: r.selector,
      evolvedSelector: r.evolvedSelector,
      type: r.type,
      action: r.action,
      tags: r.tags ?? [],
      meta: r.meta ?? {}
    }));
  }
}
