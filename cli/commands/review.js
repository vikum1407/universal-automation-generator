const fs = require('fs');
const path = require('path');

async function review() {
  const outputDir = path.join(process.cwd(), 'qlitz-output');

  const uiRtm = path.join(outputDir, 'rtm-ui.md');
  const apiRtm = path.join(outputDir, 'rtm-api.md');

  console.log(`\n📄 Qlitz Review\n`);

  let found = false;

  if (fs.existsSync(uiRtm)) {
    console.log(`✔ UI RTM found: rtm-ui.md`);
    found = true;
  } else {
    console.log(`⚠ UI RTM not found. Run: qlitz scan --url <site>`);
  }

  if (fs.existsSync(apiRtm)) {
    console.log(`✔ API RTM found: rtm-api.md`);
    found = true;
  } else {
    console.log(`⚠ API RTM not found. Run: qlitz scan-api --url <swagger>`);
  }

  if (!found) {
    console.log(`\n❌ No RTM files found.`);
    return;
  }

  console.log(`\n✨ Open the RTM files inside qlitz-output folder.`);
}

module.exports = { review };
