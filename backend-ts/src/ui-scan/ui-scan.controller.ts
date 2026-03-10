import { Controller, Post, Body } from '@nestjs/common';
import { UICrawler } from './ui-crawler';
import { UIRequirementGenerator } from './ui-requirement-generator';
import { RTMBuilder } from '../rtm/rtm.builder';

@Controller('scan-ui')
export class UIScanController {
  @Post()
  async scan(@Body() body: { url: string }) {
    const crawler = new UICrawler(body.url, 1, 20);
    const result = await crawler.crawl();

    const requirementGen = new UIRequirementGenerator();
    const allRequirements = [];

    for (const page of result.pages) {
      const selectors = Array.isArray(page.selectors) ? page.selectors : [];
      if (selectors.length === 0) continue;

      const reqs = requirementGen.generate(selectors);
      allRequirements.push(...reqs);
    }

    const rtm = new RTMBuilder().build(allRequirements);

    const flowGraph = {
      pages: result.pages.map((p) => ({
        url: p.url,
        title: p.title
      })),
      edges: result.pages
        .filter((p) => p.url !== body.url)
        .map((p) => ({
          from: body.url,
          to: p.url,
          via: 'auto-detected'
        }))
    };

    return {
      scan: result,
      requirements: allRequirements,
      rtmJson: rtm,
      flowGraph
    };
  }
}
