import { RTMDocument } from './rtm.model';
import { RTMExecutionDocument } from './rtm.execution.model';
import { RTMAnalyticsEngine } from './rtm.analytics';

export class RTMDashboardBuilder {
  build(rtm: RTMDocument, exec?: RTMExecutionDocument): string {
    const analytics = new RTMAnalyticsEngine().compute(rtm, exec);

    return `
<!DOCTYPE html>
<html>
<head>
  <title>Qlitz RTM Dashboard</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; background: #fafafa; }
    h1 { margin-bottom: 10px; }
    .summary-container { display: flex; gap: 20px; margin-bottom: 20px; }
    .card {
      background: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      flex: 1;
    }
    .card h2 { margin: 0 0 8px 0; font-size: 18px; }
    .card .value { font-size: 28px; font-weight: bold; }

    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; vertical-align: top; }
    th { background: #f4f4f4; }

    .status-pass { color: green; font-weight: bold; }
    .status-fail { color: red; font-weight: bold; }
    .status-none { color: #777; }

    .risk-high { background: #ffe5e5; }
    .risk-medium { background: #fff5cc; }
    .risk-low { background: #e8ffe8; }
  </style>
</head>
<body>

  <h1>Qlitz Requirements Traceability Dashboard</h1>
  <p>Generated: ${rtm.generatedAt}</p>

  <!-- Summary Cards -->
  <div class="summary-container">
    <div class="card">
      <h2>Coverage</h2>
      <div class="value">${analytics.coverage.coveragePercent.toFixed(1)}%</div>
      <div>${analytics.coverage.covered}/${analytics.coverage.totalRequirements} covered</div>
    </div>

    <div class="card">
      <h2>Execution</h2>
      <div class="value">${analytics.execution.executionPercent.toFixed(1)}%</div>
      <div>${analytics.execution.passed} passed, ${analytics.execution.failed} failed</div>
    </div>

    <div class="card">
      <h2>High‑Risk Areas</h2>
      <div class="value">${analytics.highRiskAreas.length}</div>
      <div>Areas needing attention</div>
    </div>

    <div class="card">
      <h2>AI Enrichment</h2>
      <div class="value">${analytics.coverage.aiEnrichedCount}</div>
      <div>Requirements with AI logic</div>
    </div>
  </div>

  <!-- Requirements Table -->
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Type</th>
        <th>Page</th>
        <th>Description</th>
        <th>Selector</th>
        <th>Covered By</th>
        <th>Coverage</th>
        <th>Execution</th>
        <th>AI Steps</th>
        <th>AI Assertions</th>
        <th>AI Negative Tests</th>
      </tr>
    </thead>
    <tbody>
      ${this.renderRows(rtm, exec)}
    </tbody>
  </table>

</body>
</html>
    `;
  }

  private renderRows(rtm: RTMDocument, exec?: RTMExecutionDocument): string {
    const execMap = new Map<string, string>();
    if (exec) {
      for (const r of exec.results) {
        execMap.set(r.requirementId, r.status);
      }
    }

    return rtm.requirements
      .map(req => {
        const covered = req.coveredBy?.length ? 'Covered' : 'Missing';
        const execStatus = execMap.get(req.id) || '-';

        const riskClass =
          execStatus === 'failed'
            ? 'risk-high'
            : !req.coveredBy?.length
            ? 'risk-medium'
            : 'risk-low';

        const aiSteps = req.aiLogic?.steps.map(s => `<li>${s}</li>`).join('') || '';
        const aiAssertions = req.aiLogic?.assertions.map(a => `<li>${a}</li>`).join('') || '';
        const aiNegatives =
          req.aiLogic?.negativeTests
            .map(
              neg => `
          <li>
            <strong>${neg.case}</strong>
            <ul>
              ${neg.steps.map(s => `<li>Step: ${s}</li>`).join('')}
              ${neg.assertions.map(a => `<li>Assert: ${a}</li>`).join('')}
            </ul>
          </li>
        `
            )
            .join('') || '';

        return `
        <tr class="${riskClass}">
          <td>${req.id}</td>
          <td>${req.type}</td>
          <td>${req.page}</td>
          <td>${req.description}</td>
          <td>${req.selector ?? '-'}</td>
          <td>${req.coveredBy?.join(', ') || '-'}</td>
          <td>${covered}</td>
          <td class="status-${execStatus === 'passed' ? 'pass' : execStatus === 'failed' ? 'fail' : 'none'}">
            ${execStatus}
          </td>
          <td><ul>${aiSteps}</ul></td>
          <td><ul>${aiAssertions}</ul></td>
          <td><ul>${aiNegatives}</ul></td>
        </tr>
      `;
      })
      .join('');
  }
}
