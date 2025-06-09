require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const fs = require('fs').promises;
const path = require('path');
const inquirer = require('inquirer');
const { capture } = require('@vuxi/capture');
const { analysis } = require('@vuxi/analysis');

const CAPTURE_OUTPUT_PATH = path.join(__dirname, '../../data/capture-output.json');
const ANALYSIS_OUTPUT_PATH = path.join(__dirname, '../../data/analysis-output.json');

async function main() {
  console.log('🧪 VUXI E2E Test Flow\n');
  
  const { baseUrl } = await inquirer.prompt([
    {
      type: 'input',
      name: 'baseUrl',
      message: 'Enter the base URL for capture:',
      default: 'https://www.edinburghpeaceinstitute.org',
      validate: (input) => {
        try {
          new URL(input);
          return true;
        } catch {
          return 'Please enter a valid URL';
        }
      }
    }
  ]);

  console.log('\n🚀 Running capture service...');
  try {
    const captureResult = await capture(baseUrl, {
      maxPages: 15,
      outputDir: '../../data'  // Changed to root data dir
    });
    
    await fs.mkdir(path.dirname(CAPTURE_OUTPUT_PATH), { recursive: true });
    await fs.writeFile(CAPTURE_OUTPUT_PATH, JSON.stringify(captureResult, null, 2));
    console.log(`✅ Capture completed: ${captureResult.urls.length} URLs, ${captureResult.screenshots.length} screenshots`);
    console.log(`📁 Capture output saved to: ${CAPTURE_OUTPUT_PATH}`);
    
  } catch (error) {
    console.error('❌ Capture failed:', error.message);
    return;
  }

  const { shouldModify } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'shouldModify',
      message: `\n📋 Capture complete! Would you like to review/modify the captured data before analysis?`,
      default: false,
    }
  ]);

  if (shouldModify) {
    console.log(`\n📝 You can edit the capture data at: ${CAPTURE_OUTPUT_PATH}`);
    await inquirer.prompt([
      {
        type: 'input',
        name: 'continue',
        message: 'Press Enter when ready to continue...',
      }
    ]);
  }

  const orgDetails = await inquirer.prompt([
    {
      type: 'input',
      name: 'organizationName',
      message: 'Enter the Organization Name:',
      default: 'Edinburgh Peace Institute',
      validate: (input) => input.trim().length > 0 ? true : 'Organization name is required'
    },
    {
      type: 'list',
      name: 'organizationType',
      message: 'Select Organization Type:',
      choices: [
        'non-profit organization',
        'business corporation', 
        'e-commerce business',
        'personal brand',
        'educational institution',
        'government agency',
        'other'
      ],
      default: 'organization'
    },
    {
      type: 'input',
      name: 'organizationPurpose',
      message: 'Enter the Organization\'s Purpose (what the website should achieve):',
      default: 'encourage donations and volunteer sign-ups',
      validate: (input) => input.trim().length > 0 ? true : 'Organization purpose is required'
    }
  ]);

  const { shouldContinue } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'shouldContinue',
      message: '\n🔬 Ready to run analysis? (This will take several minutes)',
      default: true,
    }
  ]);

  if (!shouldContinue) {
    console.log('❌ Analysis cancelled');
    return;
  }

  console.log('\n🔬 Running analysis service...');
  try {
    const captureData = JSON.parse(await fs.readFile(CAPTURE_OUTPUT_PATH, 'utf-8'));
    
    const analysisInput = {
      urls: captureData.urls,
      ...orgDetails
    };
    
    const analysisResult = await analysis(analysisInput);
    
    await fs.mkdir(path.dirname(ANALYSIS_OUTPUT_PATH), { recursive: true });
    await fs.writeFile(ANALYSIS_OUTPUT_PATH, JSON.stringify(analysisResult, null, 2));
    console.log(`✅ Analysis completed!`);
    console.log(`📁 Analysis output saved to: ${ANALYSIS_OUTPUT_PATH}`);
    
    if (analysisResult.reportPath) {
      console.log(`\n🌐 Open your report at: ${analysisResult.reportPath}`);
    }
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    console.error(error.stack);
  }

  console.log('\n🎉 E2E test completed!');
}

main().catch(error => {
  console.error('❌ E2E test failed:', error.message);
  process.exit(1);
});