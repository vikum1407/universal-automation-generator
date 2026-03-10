const axios = require('axios');
const path = require('path');
const fs = require('fs');

async function hybridRun(url, outDir) {
  try {
    console.log(`🚀 Running hybrid pipeline for: ${url}`);
    console.log(`📁 Output directory: ${outDir}`);

    // Ensure output directory exists
    if (!fs.existsSync(outDir)) {
      console.log(`❌ Output directory not found: ${outDir}`);
      return;
    }

    // Hybrid pipeline expects rtm.json
    const rtmPath = path.join(outDir, 'rtm.json');
    if (!fs.existsSync(rtmPath)) {
      throw new Error(`RTM not found at ${rtmPath}. Run UI + API pipelines first.`);
    }

    // Call backend hybrid pipeline
    const response = await axios.post('http://localhost:3000/hybrid-run', {
      url,
      outDir
    });

    // Write hybrid results
    fs.writeFileSync(
      path.join(outDir, 'hybrid-results.json'),
      JSON.stringify(response.data, null, 2)
    );

    console.log(`\n✨ Hybrid pipeline complete!`);
    console.log(`📄 Results saved to: ${outDir}/hybrid-results.json`);
    console.log(`\nRun dashboard:`);
    console.log(`   qlitz hybrid-dashboard ${outDir} 5050`);
  } catch (err) {
    console.error("Error running hybrid pipeline:", err);
  }
}

module.exports = { hybridRun };
