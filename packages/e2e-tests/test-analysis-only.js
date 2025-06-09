require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const fs = require('fs').promises;
const path = require('path');
const inquirer = require('inquirer');
const { analysis } = require('@vuxi/analysis');

const CAPTURE_INPUT_PATH = path.join(__dirname, '../../data/capture-output.json');
const ANALYSIS_OUTPUT_PATH = path.join(__dirname, '../../data/analysis-only-output.json');

async function main() {
  console.log('🧪 Analysis Service Test\n');
  
  try {
    await fs.access(CAPTURE_INPUT_PATH);
  } catch {
    console.error(`❌ Capture data not found at: ${CAPTURE_INPUT_PATH}`);
    console.log('💡 Run capture test first: npm run test:capture -w @vuxi/e2e-tests');
    return;
  }

  const captureData = JSON.parse(await fs.readFile(CAPTURE_INPUT_PATH, 'utf-8'));
  console.log(`✅ Loaded capture data: ${captureData.urls.length} URLs`);

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
      default: 'non-profit organization'
    },
    {
      type: 'input',
      name: 'organizationPurpose',
      message: 'Enter the Organization\'s Purpose:',
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
    const analysisInput = {
      urls: captureData.urls,
      ...orgDetails
    };
    
    const analysisResult = await analysis(analysisInput);
    
    await fs.mkdir(path.dirname(ANALYSIS_OUTPUT_PATH), { recursive: true });
    await fs.writeFile(ANALYSIS_OUTPUT_PATH, JSON.stringify(analysisResult, null, 2));
    
    if (analysisResult.success) {
      console.log('\n✅ Analysis completed successfully!');
      console.log(`📁 Analysis output saved to: ${ANALYSIS_OUTPUT_PATH}`);
      
      if (analysisResult.reportPath) {
        console.log(`\n🌐 Open your report at: ${analysisResult.reportPath}`);
      }
    } else {
      console.log('\n❌ Analysis failed');
      console.log(`Error: ${analysisResult.error}`);
    }
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

main().catch(console.error);