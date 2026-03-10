const path = require('path');
const { APIPipelineOrchestrator } = require('../../backend-ts/dist/api-scan/api-pipeline-orchestrator');

async function generateApiFramework(url) {
  try {
    const outputDir = path.join(process.cwd(), 'generated-api-project');

    const orchestrator = new APIPipelineOrchestrator();
    const rtm = await orchestrator.run(url, outputDir);

    console.log('API framework generated successfully!');
    console.log(`Output directory: ${outputDir}`);
    console.log(`Total API requirements: ${rtm.requirements.length}`);
  } catch (err) {
    console.error('Error generating API framework:', err);
  }
}

module.exports = { generateApiFramework };
