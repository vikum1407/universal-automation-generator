const path = require('path');
const { HybridOrchestrator } = require('../../backend-ts/dist/hybrid/hybrid-orchestrator.js');

async function generateFramework(url) {
  try {
    const outputDir = path.join(process.cwd(), 'qlitz-output');

    const orchestrator = new HybridOrchestrator();
    const result = await orchestrator.run(url, outputDir);

    console.log('Hybrid framework generated successfully!');
    console.log(`UI requirements: ${result.ui.requirements.length}`);
    console.log(`API requirements: ${result.api.requirements.length}`);
    console.log(`Total requirements: ${result.total}`);
  } catch (err) {
    console.error('Error generating hybrid framework:', err);
  }
}

module.exports = { generateFramework };
