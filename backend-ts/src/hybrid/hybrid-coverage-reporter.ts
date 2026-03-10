import * as fs from 'fs';
import * as path from 'path';
import { HybridCoverageMap } from './hybrid-coverage-map';

export class HybridCoverageReporter {
  printReport(outputDir: string) {
    const coveragePath = path.join(outputDir, 'hybrid-coverage.json');

    if (!fs.existsSync(coveragePath)) {
      throw new Error(`Hybrid coverage file not found at ${coveragePath}. Run hybrid pipeline first.`);
    }

    const coverage: HybridCoverageMap = JSON.parse(
      fs.readFileSync(coveragePath, 'utf-8')
    );

    // Header
    console.log('=== Qlitz Hybrid Coverage Report ===\n');

    console.log(`Total hybrid flows: ${coverage.totalFlows}`);
    console.log(`Total API endpoints covered: ${coverage.apiEndpointsCovered.length}`);
    console.log(`Total pages covered: ${coverage.pagesCovered.length}\n`);

    console.log('Pages covered:');
    coverage.pagesCovered.forEach(p => console.log(`  - ${p}`));
    console.log('');

    console.log('API endpoints covered:');
    coverage.apiEndpointsCovered.forEach(a => console.log(`  - ${a}`));
    console.log('');

    console.log('Sample flows:');
    coverage.flowCoverage.slice(0, 10).forEach((f, idx) => {
      console.log(`\nFlow #${idx + 1}: ${f.flow.join(' → ')}`);
      if (f.apiCalls.length > 0) {
        console.log('  API calls:');
        f.apiCalls.forEach(api => {
          console.log(`    - [${api.method ?? 'GET'}] ${api.url}`);
        });
      } else {
        console.log('  API calls: none');
      }
    });

    console.log('\n=== End of Hybrid Coverage Report ===');
  }
}
