import { Controller, Get, Post, Param } from "@nestjs/common";
import * as fs from "fs";
import { UIMultiPageCrawler } from "../../ui-scan/ui-multi-page-crawler";
import { UIFlowDetector } from "../../ui-scan/ui-flow-detector";
import { db } from "../../core/db";

@Controller("projects/:id/ui")
export class UIController {
  // UI Flow Graph
  @Get("flows")
  async getFlows(@Param("id") id: string) {
    const file = `./generated-ui-project/${id}/flow-graph.json`;
    if (!fs.existsSync(file)) return { pages: [], edges: [] };
    return JSON.parse(fs.readFileSync(file, "utf8"));
  }

  // Recrawl UI
  @Post("recrawl")
  async recrawl(@Param("id") id: string) {
    const uiBase = `./generated-ui-project/${id}`;
    if (!fs.existsSync(uiBase)) return { updated: false };

    const project = await db.one(
      `SELECT * FROM projects WHERE id = $1`,
      [id]
    );

    const crawler = new UIMultiPageCrawler();
    const crawled = await crawler.crawl(project.url, project.crawlDepth);

    const pages = crawled.map(p => ({
      url: p.url,
      nodes: p.components.map((c: any) => ({
        selector: c.selector,
        text: c.text,
        role: c.role,
        interactive: c.interactive
      }))
    }));

    const oldFlow = JSON.parse(
      fs.readFileSync(`${uiBase}/flow-graph.json`, "utf8")
    );

    const flowDetector = new UIFlowDetector();
    const newFlow = flowDetector.detect(
      pages.map((p: any) => ({
        url: p.url,
        nodes: p.nodes.map((n: any) => ({
          pageUrl: p.url,
          selector: n.selector,
          text: n.text,
          role: n.role,
          attributes: {},
          componentType: n.interactive ? "interactive" : "element"
        }))
      }))
    );

    const selectorMap: Record<string, string> = {};

    oldFlow.edges.forEach((oldEdge: any) => {
      const match = newFlow.edges.find(
        (e: any) =>
          e.from === oldEdge.from &&
          e.to === oldEdge.to &&
          e.action === oldEdge.action
      );

      if (match && oldEdge.selector !== match.selector) {
        selectorMap[oldEdge.selector] = match.selector;
      }
    });

    const testFiles = fs
      .readdirSync(uiBase)
      .filter(f => f.endsWith(".spec.ts"));

    testFiles.forEach(file => {
      const path = `${uiBase}/${file}`;
      let content = fs.readFileSync(path, "utf8");

      Object.entries(selectorMap).forEach(([oldSel, newSel]) => {
        content = content.replaceAll(oldSel, newSel);
      });

      fs.writeFileSync(path, content);
    });

    fs.writeFileSync(
      `${uiBase}/flow-graph.json`,
      JSON.stringify(newFlow, null, 2)
    );

    const rtmFile = `${uiBase}/rtm.json`;
    const rtm = JSON.parse(fs.readFileSync(rtmFile, "utf8"));

    rtm.requirements.forEach((r: any) => {
      if (selectorMap[r.selector]) {
        r.selector = selectorMap[r.selector];
      }
    });

    fs.writeFileSync(rtmFile, JSON.stringify(rtm, null, 2));

    return {
      updated: true,
      selectorMap
    };
  }

  // Replay
  @Get("replay/:test")
  async getReplay(
    @Param("id") id: string,
    @Param("test") test: string
  ) {
    const base = `./generated-ui-project/${id}`;
    const file = `${base}/replay/${test}.json`;

    if (!fs.existsSync(file)) return [];
    return JSON.parse(fs.readFileSync(file, "utf8"));
  }
}
