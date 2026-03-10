const path = require('path');
const { UIPipelineOrchestrator } = require('../../backend-ts/dist/ui-scan/ui-pipeline-orchestrator');

async function generateUiFramework(url) {
  try {
    const outputDir = path.join(process.cwd(), 'generated-ui-project');

    const orchestrator = new UIPipelineOrchestrator();
    const rtm = await orchestrator.run(url, outputDir);

    console.log('UI framework generated successfully!');
    console.log(`Output directory: ${outputDir}`);
    console.log(`Total UI requirements: ${rtm.requirements.length}`);
  } catch (err) {
    console.error('Error generating UI framework:', err);
  }
}

module.exports = { generateUiFramework };
