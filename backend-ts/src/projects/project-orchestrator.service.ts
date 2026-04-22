import { Injectable, Logger, Inject, forwardRef } from "@nestjs/common";
import * as fs from "fs";
import { PrismaService } from "../../prisma/prisma.service";

import { UiUrlIngestor } from "../ui-scan/ui-url-ingestor";
import { UIMultiPageCrawler, ComponentMeta } from "../ui-scan/ui-multi-page-crawler";
import { UIFlowDetector, UIPage } from "../ui-scan/ui-flow-detector";

import { UiTestGenerationService } from "../projects/ui/ui-test-generation.service";
import { APIParser } from "../api-scan/api-parser";
import { ApiTestGenerationService } from "./api/api-test-generation.service";

import { Requirement } from "../rtm/rtm.model";
import { ProjectService } from "./project.service";
import { ProgressGateway } from "../gateways/progress.gateway";
import { progressService } from "../services/ProgressService";

@Injectable()
export class ProjectOrchestratorService {
  private readonly logger = new Logger(ProjectOrchestratorService.name);

  constructor(
    private readonly uiTestGen: UiTestGenerationService,
    private readonly apiTestGen: ApiTestGenerationService,
    private readonly prisma: PrismaService,
    private readonly gateway: ProgressGateway,
    @Inject(forwardRef(() => ProjectService))
    private readonly projectService: ProjectService
  ) {}

  private emit(projectId: string, percent: number, step: string) {
    progressService.update(projectId, percent, step);
    this.gateway.emitProjectStatus(projectId);
  }

  async runUIInitialization(project: any) {
    progressService.init(project.id, "initializing");
    this.gateway.emitProjectStatus(project.id);

    try {
      this.logger.log(`UI initialization started for project ${project.id}`);

      const base = `./generated-ui-project/${project.id}`;
      fs.mkdirSync(base, { recursive: true });

      this.emit(project.id, 10, "Scanning website…");
      const ingestor = new UiUrlIngestor();
      await ingestor.ingest(project.url);

      this.emit(project.id, 25, "Crawling pages…");
      const crawler = new UIMultiPageCrawler();
      const crawled = await crawler.crawl(project.url, project.crawlDepth);

      this.emit(project.id, 40, "Detecting flows…");
      const pages: UIPage[] = crawled.map(p => ({
        url: p.url,
        nodes: this.toUIScanNodes(p.components || [], p.url)
      }));

      const flowDetector = new UIFlowDetector();
      const flowGraph = flowDetector.detect(pages);

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

      fs.writeFileSync(
        `${base}/flow-graph.json`,
        JSON.stringify({ nodes: elementNodes, edges: elementEdges }, null, 2)
      );

      this.emit(project.id, 55, "Recording flow steps…");
      for (const edge of flowGraph.edges) {
        await this.projectService.recordFlowStep(
          project.id,
          edge.from,
          edge.to,
          edge.action || "navigate",
          edge.selector
        );
      }

      this.emit(project.id, 70, "Building requirements…");
      const requirements: Requirement[] = elementEdges.map((edge, index) => ({
        id: `ui-flow-${project.id}-${index}`,
        title: edge.action
          ? `${edge.action} from ${edge.from} to ${edge.to}`
          : `Interaction from ${edge.from} to ${edge.to}`,
        description: edge.action || `Interaction from ${edge.from} to ${edge.to}`,
        type: "ui",
        source: {
          pageName: edge.from
        },
        coveredBy: []
      }));

      fs.writeFileSync(
        `${base}/rtm.json`,
        JSON.stringify(
          { generatedAt: new Date().toISOString(), requirements },
          null,
          2
        )
      );

      this.emit(project.id, 85, "Generating tests…");
      await this.uiTestGen.generateTests(base);

      this.emit(project.id, 95, "Finalizing…");
      await this.prisma.project.update({
        where: { id: project.id },
        data: { status: "ready" }
      });

      progressService.complete(project.id);
      this.gateway.emitProjectStatus(project.id);
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
    progressService.init(project.id, "initializing");
    this.gateway.emitProjectStatus(project.id);

    try {
      this.logger.log(`API initialization started for project ${project.id}`);

      const base = `./generated-api-project/${project.id}`;
      fs.mkdirSync(base, { recursive: true });

      this.emit(project.id, 15, "Parsing Swagger…");
      const parser = new APIParser();
      const schema = await parser.loadSchema(project.swaggerUrl);

      this.emit(project.id, 35, "Extracting endpoints…");
      const endpoints = parser.extractEndpoints(schema);

      fs.writeFileSync(
        `${base}/endpoints.json`,
        JSON.stringify(endpoints, null, 2)
      );

      this.emit(project.id, 60, "Building requirements…");
      const requirements: Requirement[] = endpoints.map(
        (ep: any, index: number) => ({
          id: `api-${project.id}-${index}`,
          title: ep.summary || `${ep.method} ${ep.path}`,
          description: ep.summary || `${ep.method} ${ep.path}`,
          type: "api",
          source: {
            endpointPath: ep.path,
            method: ep.method
          },
          coveredBy: []
        })
      );

      fs.writeFileSync(
        `${base}/rtm.json`,
        JSON.stringify(
          { generatedAt: new Date().toISOString(), requirements },
          null,
          2
        )
      );

      this.emit(project.id, 80, "Generating tests…");
      await this.apiTestGen.generateTests(base);

      this.emit(project.id, 95, "Finalizing…");
      await this.prisma.project.update({
        where: { id: project.id },
        data: { status: "ready" }
      });

      progressService.complete(project.id);
      this.gateway.emitProjectStatus(project.id);
    } catch (err) {
      this.logger.error(err);
      await this.prisma.project.update({
        where: { id: project.id },
        data: { status: "failed" }
      });
    }
  }
}
