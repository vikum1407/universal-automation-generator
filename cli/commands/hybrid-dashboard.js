#!/usr/bin/env node

const path = require('path');
const { HybridDashboardApi } = require('../../backend-ts/dist/hybrid/hybrid-dashboard-api');

module.exports = async function hybridDashboardCommand(outputDir, port = 5050) {
  if (!outputDir) {
    console.error('Usage: qlitz hybrid-dashboard <outputDir> [port]');
    process.exit(1);
  }

  const resolved = path.resolve(process.cwd(), outputDir);

  try {
    const api = new HybridDashboardApi(resolved);
    api.start(port);
  } catch (err) {
    console.error('Error starting Hybrid Dashboard:', err.message);
    process.exit(1);
  }
};
