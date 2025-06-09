const fs = require('fs').promises;
const path = require('path');
const inquirer = require('inquirer');
const { capture } = require('@vuxi/capture');

const OUTPUT_PATH = path.join(__dirname, '../../data/capture-test-output.json');

async function main() {
  console.log('🧪 Capture Service Test\n');
  
  const { baseUrl, maxPages } = await inquirer.prompt([
    {
      type: 'input',
      name: 'baseUrl',
      message: 'Enter the base URL:',
      default: 'https://www.edinburghpeaceinstitute.org',
      validate: (input) => {
        try {
          new URL(input);
          return true;
        } catch {
          return 'Please enter a valid URL';
        }
      }
    },
    {
      type: 'number',
      name: 'maxPages',
      message: 'Maximum pages to capture:',
      default: 10,
      validate: (input) => input > 0 ? true : 'Must be greater than 0'
    }
  ]);

  console.log('\n🚀 Starting capture...');
  
  try {
    const result = await capture(baseUrl, {
      maxPages,
      outputDir: '../../data'  // Changed to root data dir
    });
    
    await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
    await fs.writeFile(OUTPUT_PATH, JSON.stringify(result, null, 2));
    
    console.log('\n✅ Capture completed!');
    console.log(`📋 URLs found: ${result.urls.length}`);
    console.log(`📸 Screenshots: ${result.screenshots.length}`);
    console.log(`📁 Output saved to: ${OUTPUT_PATH}`);
    console.log(`\n📂 Files created:`);
    console.log(`   URLs: ${result.files.urls.simpleUrls}`);
    console.log(`   Screenshots: ${result.files.screenshots.screenshotsDir}`);
    
  } catch (error) {
    console.error('❌ Capture failed:', error.message);
  }
}

main().catch(console.error);