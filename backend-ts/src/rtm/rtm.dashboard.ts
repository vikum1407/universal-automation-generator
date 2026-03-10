import { RTMDocument } from './rtm.model';
import { RTMExecutionDocument } from './rtm.execution.model';

export class RTMDashboardBuilder {
  build(rtm: RTMDocument, exec?: RTMExecutionDocument): string {
    const execMap = new Map<string, string>();

    if (exec) {
      for (const r of exec.results) {
        execMap.set(r.requirementId, r.status);
      }
    }

    let rows = '';

    for (const req of rtm.requirements) {
      const covered = req.coveredBy?.length ? 'Covered' : 'Missing';
      const execStatus = execMap.get(req.id) || '-';

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

      rows += `
        <tr>
          <td>${req.id}</td>
          <td>${req.type}</td>
          <td>${req.page}</td>
          <td>${req.description}</td>
          <td>${req.selector ?? '-'}</td>
          <td>${req.coveredBy?.join(', ') || '-'}</td>
          <td>${covered}</td>
          <td>${execStatus}</td>
          <td>
            <ul>${aiSteps}</ul>
          </td>
          <td>
            <ul>${aiAssertions}</ul>
          </td>
          <td>
            <ul>${aiNegatives}</ul>
          </td>
        </tr>
      `;
    }

    return `
<!DOCTYPE html>
<html>
<head>
  <title>Qlitz RTM Dashboard</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ccc; padding: 8px; vertical-align: top; }
    th { background: #f4f4f4; }
    .header { font-size: 24px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">Qlitz Requirements Traceability Dashboard</div>
  <p>Generated: ${rtm.generatedAt}</p>

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
      ${rows}
    </tbody>
  </table>
</body>
</html>
    `;
  }
}
