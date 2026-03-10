import * as fs from 'fs';
import * as path from 'path';
import { DashboardGenerator } from './dashboard/dashboard-generator';

export function generateDashboard() {
  const rtmPath = path.join(process.cwd(), 'rtm.json');

  if (!fs.existsSync(rtmPath)) {
    console.error('❌ No rtm.json found. Run generate-framework first.');
    return;
  }

  const rtm = JSON.parse(fs.readFileSync(rtmPath, 'utf-8'));
  const generator = new DashboardGenerator();

  generator.generate(rtm, process.cwd());

  console.log('✅ Dashboard generated at ./generated-dashboard/index.html');
}
