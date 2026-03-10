const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function enhance() {
  const uiReq = JSON.parse(fs.readFileSync('qlitz-output/requirements.json', 'utf8'));
  const apiReq = JSON.parse(fs.readFileSync('qlitz-output/api-requirements.json', 'utf8'));

  const res = await axios.post('http://localhost:3000/enhance', {
    ui: uiReq,
    api: apiReq
  });

  // Ensure output folders exist
  const uiTestDir = path.join('generated-ui-project', 'tests');
  const apiTestDir = path.join('generated-api-project', 'tests');

  fs.mkdirSync(uiTestDir, { recursive: true });
  fs.mkdirSync(apiTestDir, { recursive: true });

  // Save RTM
  fs.writeFileSync(
    'qlitz-output/rtm-combined.json',
    JSON.stringify(res.data.rtm, null, 2)
  );

  // Save UI tests
  res.data.uiTests.forEach(t => {
    const filePath = path.join(uiTestDir, `${t.id}.spec.ts`);
    fs.writeFileSync(filePath, t.content);
  });

  // Save API tests
  res.data.apiTests.forEach(t => {
    const filePath = path.join(apiTestDir, `${t.id}.spec.ts`);
    fs.writeFileSync(filePath, t.content);
  });

  console.log('✨ Enhanced tests and RTM generated successfully');
}

module.exports = { enhance };
