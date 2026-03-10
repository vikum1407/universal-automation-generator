#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const yargs = require('yargs');

const argv = yargs
  .command('generate', 'Generate tests', {
    template: {
      alias: 't',
      type: 'string',
      default: 'api-playwright',
      describe: 'Template pack to use'
    },
    openapi: {
      alias: 'o',
      type: 'string',
      describe: 'OpenAPI URL (API templates only)'
    },
    url: {
      alias: 'u',
      type: 'string',
      describe: 'Base URL (UI templates only)'
    }
  })
  .help()
  .argv;

async function main() {
  const command = argv._[0];

  if (command === 'generate') {
    const template = argv.template;

    const openapiUrl =
      template === 'ui-playwright'
        ? argv.url
        : argv.openapi;

    if (!openapiUrl) {
      console.error('❌ Missing URL. Use --openapi for API or --url for UI.');
      process.exit(1);
    }

    console.log(`🔧 Qlitz: Generating using template: ${template}`);
    console.log(`📄 URL: ${openapiUrl}`);

    const response = await axios.post(
      'http://localhost:3000/generate',
      {
        template,
        openapiUrl
      },
      { responseType: 'arraybuffer' }
    );

    const outputPath = path.join(process.cwd(), 'qlitz-tests.zip');
    fs.writeFileSync(outputPath, response.data);

    console.log(`✨ Done! Generated: ${outputPath}`);
  }
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
