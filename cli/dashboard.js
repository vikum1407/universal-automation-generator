const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function generateDashboard() {
  const rtm = JSON.parse(fs.readFileSync('qlitz-output/rtm-combined.json', 'utf8'));

  let execution = null;
  const execPath = 'qlitz-output/rtm-execution.json';
  if (fs.existsSync(execPath)) {
    execution = JSON.parse(fs.readFileSync(execPath, 'utf8'));
  }

  const res = await axios.post('http://localhost:3000/rtm/dashboard', {
    rtm,
    execution
  });

  const outputPath = path.join(process.cwd(), 'qlitz-output/rtm-dashboard.html');
  fs.writeFileSync(outputPath, res.data.html);

  console.log('✨ RTM Dashboard generated: qlitz-output/rtm-dashboard.html');
}

module.exports = { generateDashboard };
