const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function runUI() {
  const projectPath = path.join(process.cwd(), 'generated-ui-project');
  const requirements = JSON.parse(fs.readFileSync('qlitz-output/requirements.json', 'utf8'));

  const res = await axios.post('http://localhost:3000/execute/ui', {
    projectPath,
    requirements
  });

  fs.writeFileSync('qlitz-output/rtm-execution.json', JSON.stringify(res.data, null, 2));

  console.log('✨ UI Test Execution Complete');
  console.log('📄 Results saved to qlitz-output/rtm-execution.json');
}

module.exports = { runUI };
