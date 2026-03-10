const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function runUi(url, outDir) {
  console.log(`🚀 Running UI flow detection for: ${url}`);

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  let response;
  try {
    response = await axios.post('http://localhost:3000/run-ui', {
      url,
      outDir
    });
  } catch (err) {
    console.log("❌ Error calling backend:", err.message);
    return;
  }

  fs.writeFileSync(
    path.join(outDir, 'flow-graph.json'),
    JSON.stringify(response.data.flowGraph, null, 2)
  );

  const testsDir = path.join(outDir, 'ui-tests');
  if (!fs.existsSync(testsDir)) fs.mkdirSync(testsDir);

  for (const file of response.data.testFiles) {
    fs.writeFileSync(
      path.join(testsDir, file.name),
      file.content
    );
  }

  console.log(`📄 Flow graph saved: ${outDir}/flow-graph.json`);
  console.log(`📁 UI tests saved: ${outDir}/ui-tests/`);
}

module.exports = { runUi };
