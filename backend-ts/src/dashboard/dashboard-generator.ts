import * as fs from 'fs';
import * as path from 'path';
import { RTMDocument } from '../rtm/rtm.model';

export class DashboardGenerator {
  generate(rtm: RTMDocument, outputDir: string) {
    if (!rtm || !Array.isArray(rtm.requirements)) return;

    const dashboardDir = path.join(outputDir, 'generated-dashboard');
    if (!fs.existsSync(dashboardDir)) fs.mkdirSync(dashboardDir, { recursive: true });

    const html = this.buildHtml(rtm);
    fs.writeFileSync(path.join(dashboardDir, 'index.html'), html.trim());
  }

  private buildHtml(rtm: RTMDocument): string {
    const grouped: Record<string, any[]> = {};

    for (const req of rtm.requirements) {
      const key = req.page || 'Unknown';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(req);
    }

    const sections = Object.keys(grouped)
      .map((page) => {
        const items = grouped[page]
          .map((req) => {
            return `
              <div class="req-item">
                <div class="req-id">${req.id}</div>
                <div class="req-desc">${req.description}</div>
                <div class="req-meta">
                  <span class="tag type-${req.type}">${req.type.toUpperCase()}</span>
                  ${(req.tags || [])
                    .map((t: string) => `<span class="tag">${t}</span>`)
                    .join('')}
                </div>
              </div>
            `;
          })
          .join('');

        return `
          <div class="section">
            <div class="section-header" onclick="toggleSection(this)">
              <span>${page}</span>
              <span class="count">${grouped[page].length}</span>
            </div>
            <div class="section-body">
              ${items}
            </div>
          </div>
        `;
      })
      .join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Qlitz Dashboard</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    h1 { margin-bottom: 20px; }
    .section { background: #fff; margin-bottom: 12px; border-radius: 6px; overflow: hidden; }
    .section-header { padding: 14px; background: #222; color: #fff; cursor: pointer; display: flex; justify-content: space-between; }
    .section-body { padding: 10px 14px; display: none; }
    .req-item { padding: 10px 0; border-bottom: 1px solid #eee; }
    .req-item:last-child { border-bottom: none; }
    .req-id { font-weight: bold; margin-bottom: 4px; }
    .req-desc { margin-bottom: 6px; }
    .tag { display: inline-block; padding: 3px 8px; background: #ddd; border-radius: 4px; margin-right: 6px; font-size: 12px; }
    .type-ui { background: #4caf50; color: #fff; }
    .type-api { background: #2196f3; color: #fff; }
    .count { background: #444; padding: 2px 8px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>Qlitz RTM Dashboard</h1>
  <div>${sections}</div>

  <script>
    function toggleSection(header) {
      const body = header.nextElementSibling;
      body.style.display = body.style.display === 'block' ? 'none' : 'block';
    }
  </script>
</body>
</html>
`;
  }
}
