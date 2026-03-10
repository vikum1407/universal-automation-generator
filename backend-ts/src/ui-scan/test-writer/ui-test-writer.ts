import * as fs from 'fs';
import * as path from 'path';

import { ActionWriter } from './writers/action-writer';
import { NegativeWriter } from './writers/negative-writer';
import { JourneyWriter } from './writers/journey-writer';
import { ScenarioWriter } from './writers/scenario-writer';
import { StateWriter } from './writers/state-writer';
import { FlowWriter } from './writers/flow-writer';
import { CommentsWriter } from './writers/comments-writer';

import { RequirementLike, FlowGraph, UIJourney, UIScenario, UIStateGraph } from './writers/helpers';

export class UITestWriter {
  private actionWriter = new ActionWriter();
  private negativeWriter = new NegativeWriter();
  private journeyWriter = new JourneyWriter();
  private scenarioWriter = new ScenarioWriter();
  private stateWriter = new StateWriter();
  private flowWriter = new FlowWriter();
  private comments = new CommentsWriter();

  writeTests(
    requirements: RequirementLike[],
    outputDir: string,
    flowGraph?: FlowGraph,
    journeys?: UIJourney[],
    scenarios?: UIScenario[],
    stateGraph?: UIStateGraph,
    optimization?: any,
    regression?: any,
    rootCause?: any
  ) {
    if (!Array.isArray(requirements) || requirements.length === 0) return [];

    const testsRoot = path.join(outputDir, 'ui-tests');
    if (!fs.existsSync(testsRoot)) fs.mkdirSync(testsRoot, { recursive: true });

    const byPage: Record<string, RequirementLike[]> = {};
    for (const req of requirements) {
      if (!req.page) continue;
      if (!byPage[req.page]) byPage[req.page] = [];
      byPage[req.page].push(req);
    }

    const testFiles: { name: string; content: string }[] = [];

    for (const page of Object.keys(byPage)) {
      const safePage = page.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
      const fileName = `${safePage}.spec.ts`;
      const filePath = path.join(testsRoot, fileName);

      const content = this.buildTestFile(
        page,
        byPage[page],
        flowGraph,
        journeys,
        scenarios,
        stateGraph,
        optimization,
        regression,
        rootCause
      );

      fs.writeFileSync(filePath, content.trim() + '\n');

      testFiles.push({ name: fileName, content: content.trim() + '\n' });
    }

    return testFiles;
  }

  private buildTestFile(
    pageUrl: string,
    requirements: RequirementLike[],
    flowGraph?: FlowGraph,
    journeys?: UIJourney[],
    scenarios?: UIScenario[],
    stateGraph?: UIStateGraph,
    optimization?: any,
    regression?: any,
    rootCause?: any
  ): string {
    const tests: string[] = [];

    for (const req of requirements) {
      const action = this.actionWriter.build(req, pageUrl, optimization, regression, rootCause);
      if (action) tests.push(action);

      const negative = this.negativeWriter.build(req, pageUrl, optimization, regression, rootCause);
      if (negative) tests.push(negative);
    }

    if (flowGraph?.edges?.length) {
      tests.push(
        ...this.flowWriter.build(pageUrl, flowGraph, optimization, regression, rootCause)
      );
    }

    if (journeys?.length) {
      for (const j of journeys) {
        tests.push(this.journeyWriter.build(j, optimization, regression, rootCause));
      }
    }

    if (scenarios?.length) {
      for (const s of scenarios) {
        tests.push(this.scenarioWriter.build(s, optimization, regression, rootCause));
      }
    }

    if (stateGraph?.states?.length) {
      tests.push(
        this.stateWriter.build(pageUrl, stateGraph, optimization, regression, rootCause)
      );
    }

    return `
import { test, expect } from '@playwright/test';
import { selfHealClick, capturePageBaseline, aiAssertPageIdentity, aiAssertComponentPresence } from './helpers';

${tests.join('\n')}
`;
  }
}
