// packages/e2e-tests/test-full-flow.js
const fs = require('fs').promises;
const path = require('path');
const inquirer = require('inquirer');
const { capture } = require('@vuxi/capture');
const { analysis } = require('@vuxi/analysis');

const CAPTURE_OUTPUT_PATH = path.join(__dirname, 'capture-output.json');
const ANALYSIS_OUTPUT_PATH = path.join(__dirname, 'report-data.json');

async function main() {
  const { baseUrl } = await inquirer.prompt([
    {
      type: 'input',
      name: 'baseUrl',
      message: 'Enter the base URL for the capture service:',
      default: 'https://www.google.com',
    },
  ]);

  console.log('Running capture service...');
  const captureResult = await capture(baseUrl);
  await fs.writeFile(CAPTURE_OUTPUT_PATH, JSON.stringify(captureResult, null, 2));
  console.log(`Capture service output saved to ${CAPTURE_OUTPUT_PATH}`);

  const { shouldContinue } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'shouldContinue',
      message: `Please inspect the capture output at ${CAPTURE_OUTPUT_PATH}. You can modify it if you want.
Continue to analysis service?`,
      default: true,
    },
  ]);

  if (shouldContinue) {
    const { organizationName, organizationPurpose } = await inquirer.prompt([
        {
            type: 'input',
            name: 'organizationName',
            message: 'Enter the Organization Name:',
        },
        {
            type: 'input',
            name: 'organizationPurpose',
            message: 'Enter the Organization\'s Purpose:',
        },
    ]);

    console.log('Running analysis service...');
    const captureData = JSON.parse(await fs.readFile(CAPTURE_OUTPUT_PATH, 'utf-8'));
    const analysisResult = await analysis({ ...captureData, organizationName, organizationPurpose });
    await fs.writeFile(ANALYSIS_OUTPUT_PATH, JSON.stringify(analysisResult, null, 2));
    console.log(`Analysis service output saved to ${ANALYSIS_OUTPUT_PATH}`);
    console.log('End-to-end test finished.');
  } else {
    console.log('Test aborted.');
  }
}

main();