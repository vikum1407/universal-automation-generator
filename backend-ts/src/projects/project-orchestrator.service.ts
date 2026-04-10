import { Injectable, Logger, Inject, forwardRef } from "@nestjs/common";
import * as fs from "fs";
import { PrismaService } from "../../prisma/prisma.service";

import { UiUrlIngestor } from "../ui-scan/ui-url-ingestor";
import { UIMultiPageCrawler, ComponentMeta } from "../ui-scan/ui-multi-page-crawler";
import { UIFlowDetector, UIPage } from "../ui-scan/ui-flow-detector";

import { UiTestGenerationService } from "../projects/ui/ui-test-generation.service";
import { APIParser } from "../api-scan/api-parser";
import { ApiTestGenerationService } from "./api/api-test-generation.service";

import { Requirement, RTMDocument } from "../rtm/rtm.model";
import { ProjectService } from "./project.service";

@Injectable()
export class ProjectOrchestratorService {
  private readonly logger = new Logger(ProjectOrchestratorService.name);

  constructor(
    private readonly uiTestGen: UiTestGenerationService,
    private readonly apiTestGen: ApiTestGenerationService,
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ProjectService))
    private readonly projectService: ProjectService
  ) {}

  async runUIInitialization(project: any) {
    try {
      this.logger.log(`UI initialization started for project ${project.id}`);

      const ingestor = new UiUrlIngestor();
      await ingestor.ingest(project.url);

      const crawler = new UIMultiPageCrawler();
      const crawled = await crawler.crawl(project.url, project.crawlDepth);

      const pages: UIPage[] = crawled.map(p => ({
        url: p.url,
        nodes: this.toUIScanNodes(p.components || [], p.url)
      }));

      const flowDetector = new UIFlowDetector();
      const flowGraph = flowDetector.detect(pages);

      const base = `./generated-ui-project/${project.id}`;
      if (!fs.existsSync(base)) fs.mkdirSync(base, { recursive: true });

      // Build element-level nodes
      const elementNodes = pages.flatMap(page =>
        page.nodes.map((n: any, index: number) => ({
          id: `${page.url}#${n.selector || "root"}-${index}`,
          pageUrl: page.url,
          selector: n.selector,
          text: n.text,
          role: n.role,
          interactive: n.componentType === "interactive"
        }))
      );

      // Map page-level edges to element-level edges (use first interactive node on each page)
      const findFirstNodeForPage = (pageUrl: string) =>
        elementNodes.find(n => n.pageUrl === pageUrl) || null;

      const elementEdges = flowGraph.edges.map((e: any, index: number) => {
        const fromNode = findFirstNodeForPage(e.from);
        const toNode = findFirstNodeForPage(e.to);

        return {
          id: `edge-${index}`,
          from: fromNode ? fromNode.id : e.from,
          to: toNode ? toNode.id : e.to,
          action: e.action || "navigate",
          selector: e.selector
        };
      });

      const elementFlowGraph = {
        nodes: elementNodes,
        edges: elementEdges
      };

      fs.writeFileSync(`${base}/flow-graph.json`, JSON.stringify(elementFlowGraph, null, 2));

      // Persist flow steps at page level (unchanged)
      for (const edge of flowGraph.edges) {
        await this.projectService.recordFlowStep(
          project.id,
          edge.from,
          edge.to,
          edge.action || "navigate",
          edge.selector
        );
      }

      // Element-level RTM
      const requirements: Requirement[] = elementEdges.map((edge, index) => ({
        id: `ui-flow-${project.id}-${index}`,
        page: edge.from,
        description: edge.action || `Interaction from ${edge.from} to ${edge.to}`,
        selector: edge.selector,
        type: "ui",
        action: edge.action,
        source: "UI",
        coveredBy: []
      }));

      const rtm: RTMDocument = {
        generatedAt: new Date().toISOString(),
        requirements
      };

      fs.writeFileSync(`${base}/rtm.json`, JSON.stringify(rtm, null, 2));

      await this.uiTestGen.generateTests(base);

      await this.prisma.project.update({
        where: { id: project.id },
        data: { status: "ready" }
      });
    } catch (err) {
      this.logger.error(err);

      await this.prisma.project.update({
        where: { id: project.id },
        data: { status: "failed" }
      });
    }
  }

    private toUIScanNodes(components: ComponentMeta[], pageUrl: string) {
    return components.map(c => ({
      pageUrl,
      selector: c.selector,
      text: c.text,
      role: c.role,
      attributes: c.attributes || {},
      componentType: c.interactive ? "interactive" : "element"
    }));
  }

  async runAPIInitialization(project: any) {
    try {
      this.logger.log(`API initialization started for project ${project.id}`);

      const parser = new APIParser();
      const schema = await parser.loadSchema(project.swaggerUrl);

      const endpoints = parser.extractEndpoints(schema);

      const base = `./generated-api-project/${project.id}`;
      if (!fs.existsSync(base)) fs.mkdirSync(base, { recursive: true });

      fs.writeFileSync(`${base}/endpoints.json`, JSON.stringify(endpoints, null, 2));

      const requirements: Requirement[] = endpoints.map((ep: any, index: number) => ({
        id: `api-${project.id}-${index}`,
        page: ep.path,
        description: ep.summary || `${ep.method} ${ep.path}`,
        type: "api",
        method: ep.method,
        url: ep.path,
        requestBody: ep.requestBody,
        expectedStatus: 200,
        source: "API",
        coveredBy: []
      }));

      const rtm: RTMDocument = {
        generatedAt: new Date().toISOString(),
        requirements
      };

      fs.writeFileSync(`${base}/rtm.json`, JSON.stringify(rtm, null, 2));

      await this.apiTestGen.generateTests(base);

      await this.prisma.project.update({
        where: { id: project.id },
        data: { status: "ready" }
      });
    } catch (err) {
      this.logger.error(err);

      await this.prisma.project.update({
        where: { id: project.id },
        data: { status: "failed" }
      });
    }
  }
}
