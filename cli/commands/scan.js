const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function scan(url) {
  console.log(`🔍 Scanning UI: ${url}`);

  const outputDir = path.join(process.cwd(), 'qlitz-output');
  console.log("📁 Writing RTM to:", outputDir);

  let response;
  try {
    response = await axios.post('http://localhost:3000/scan-ui', { url });
  } catch (err) {
    console.log("❌ Error calling backend:", err.message);
    return;
  }

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  // Write RTM JSON
  fs.writeFileSync(
    path.join(outputDir, 'rtm.json'),
    JSON.stringify(response.data.rtmJson, null, 2)
  );

  // Write requirements
  fs.writeFileSync(
    path.join(outputDir, 'requirements.json'),
    JSON.stringify(response.data.requirements, null, 2)
  );

  console.log(`\n📄 RTM generated: qlitz-output/rtm-combined.json`);
  console.log(`📄 Requirements saved: qlitz-output/requirements.json`);
  console.log(`\n✨ Review the RTM and run:`);
  console.log(`   qlitz review`);
}

module.exports = { scan };
