const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function scanApi(url) {
  console.log(`🔍 Scanning API: ${url}`);

  const outputDir = path.join(process.cwd(), 'qlitz-output');
  console.log("📁 Writing RTM to:", outputDir);

  let response;
  try {
    response = await axios.post('http://localhost:3000/scan-api', { url });
  } catch (err) {
    console.log("❌ Error calling backend:", err.message);
    return;
  }

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  // Write RTM JSON
  fs.writeFileSync(
    path.join(outputDir, 'rtm-combined.json'),
    JSON.stringify(response.data.rtmJson, null, 2)
  );

  // Write API requirements
  fs.writeFileSync(
    path.join(outputDir, 'api-requirements.json'),
    JSON.stringify(response.data.requirements, null, 2)
  );

  console.log(`\n📄 API RTM generated: qlitz-output/rtm-combined.json`);
  console.log(`📄 API Requirements saved: qlitz-output/api-requirements.json`);
  console.log(`\n✨ Next step:`);
  console.log(`   qlitz generate-api`);
}

module.exports = { scanApi };
