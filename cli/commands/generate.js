const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function generate() {
  const reqFile = path.join(process.cwd(), 'qlitz-output/requirements.json');

  if (!fs.existsSync(reqFile)) {
    console.log('❌ No requirements found. Run: qlitz scan');
    return;
  }

  const requirements = JSON.parse(fs.readFileSync(reqFile, 'utf8'));

  console.log('⚙️ Generating UI automation framework...');

  const response = await axios.post('http://localhost:3000/generate-ui-framework', {
    requirements
  });

  console.log(`\n📦 Framework ZIP ready at: ${response.data.zipPath}`);
  console.log(`Extract it and run:`);
  console.log(`   npm install`);
  console.log(`   npx playwright test`);
}

module.exports = { generate };
