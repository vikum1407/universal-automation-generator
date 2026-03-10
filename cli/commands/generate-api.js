const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function generateApi() {
  const reqFile = path.join(process.cwd(), 'qlitz-output/api-requirements.json');

  if (!fs.existsSync(reqFile)) {
    console.log('❌ No API requirements found. Run: qlitz scan-api');
    return;
  }

  const requirements = JSON.parse(fs.readFileSync(reqFile, 'utf8'));

  console.log('⚙️ Generating API automation framework...');

  const response = await axios.post('http://localhost:3000/generate-api-framework', {
    requirements
  });

  console.log(`\n📦 API Framework ZIP ready at: ${response.data.zipPath}`);
  console.log(`Extract it and run:`);
  console.log(`   npm install`);
  console.log(`   npx playwright test`);
}

module.exports = { generateApi };
