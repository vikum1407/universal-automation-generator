import { RTMDocument } from './rtm.model';

export class RTMMarkdownBuilder {
  build(rtm: RTMDocument): string {
    let md = `# Qlitz Requirements Traceability Matrix\nGenerated: ${rtm.generatedAt}\n\n`;

    for (const req of rtm.requirements) {
      md += `## ${req.id} — ${req.description}\n`;
      md += `**Type:** ${req.type}\n\n`;
      md += `**Page:** ${req.page}\n\n`;
      md += `**Selector:** ${req.selector ?? '-'}\n\n`;
      md += `**Covered By:** ${req.coveredBy?.join(', ') || '-'}\n\n`;

      // AI Logic
      md += `### AI‑Generated Steps\n`;
      req.aiLogic?.steps.forEach(s => (md += `- ${s}\n`));
      md += `\n`;

      md += `### AI‑Generated Assertions\n`;
      req.aiLogic?.assertions.forEach(a => (md += `- ${a}\n`));
      md += `\n`;

      md += `### Negative Tests\n`;
      req.aiLogic?.negativeTests.forEach(neg => {
        md += `- **${neg.case}**\n`;
        neg.steps.forEach(s => (md += `  - Step: ${s}\n`));
        neg.assertions.forEach(a => (md += `  - Assert: ${a}\n`));
      });

      md += `\n---\n\n`;
    }

    return md;
  }
}
