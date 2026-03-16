#!/usr/bin/env node

const { scan } = require('./commands/scan');
const { review } = require('./commands/review');
const { generate } = require('./commands/generate');

const { scanApi } = require('./commands/scan-api');
const { generateApi } = require('./commands/generate-api');

const { generateUiFramework } = require('./commands/generate-ui-framework');
const { generateApiFramework } = require('./commands/generate-api-framework');
const { generateFramework } = require('./commands/generate-framework');

const { hybridRun } = require('./commands/hybrid-run');
const { runUi } = require('./commands/run-ui');  

const { generateDashboard } = require('./dashboard');
const { enhance } = require('./enhance');

// NEW: Hybrid Dashboard CLI
const hybridDashboard = require('./commands/hybrid-dashboard');

const args = process.argv.slice(2);
const command = args[0];
const url = args[1];
const outputDir = args[2];
const port = args[3]; // optional for hybrid-dashboard

if (command === 'scan') scan(url);
if (command === 'review') review();
if (command === 'generate') generate();
if (command === 'scan-api') scanApi(url);
if (command === 'generate-api') generateApi();
if (command === 'generate-ui-framework') generateUiFramework(url);
if (command === 'generate-api-framework') generateApiFramework(url);
if (command === 'generate-framework') generateFramework(url);
if (command === 'run-ui') runUi(url, outputDir);   // ✅ NOW IT WORKS
if (command === 'hybrid-run') hybridRun(url, outputDir);
if (command === 'dashboard') generateDashboard();
if (command === 'enhance') enhance();

// NEW: hybrid-dashboard command
if (command === 'hybrid-dashboard') hybridDashboard(outputDir, port);
