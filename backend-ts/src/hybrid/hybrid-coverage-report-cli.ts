#!/usr/bin/env node
import * as path from 'path';
import { HybridCoverageReporter } from './hybrid-coverage-reporter';

async function main() {
  const [, , outputDirArg] = process.argv;

  if (!outputDirArg) {
    console.error('Usage: qlitz hybrid-report <outputDir>');
    process.exit(1);
  }

  const outputDir = path.resolve(process.cwd(), outputDirArg);
  const reporter = new HybridCoverageReporter();

  try {
    reporter.printReport(outputDir);
  } catch (err: any) {
    console.error(`Error running hybrid report: ${err.message}`);
    process.exit(1);
  }
}

main();
