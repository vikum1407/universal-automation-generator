import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { UIMultiPageCrawler } from "../../ui-scan/ui-multi-page-crawler";

@Injectable()
export class UiRecrawlService {
  constructor(private readonly prisma: PrismaService) {}

  async recrawl(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) return { updated: false };

    const crawler = new UIMultiPageCrawler();
    const pages = await crawler.crawl(project.url, project.crawlDepth);

    const selectorMap: Record<string, any> = {};
    for (const p of pages) {
      selectorMap[p.url] = p.components?.map(c => ({
        selector: c.selector,
        text: c.text,
        role: c.role
      }));
    }

    return {
      updated: true,
      selectorMap
    };
  }
}
