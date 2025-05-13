const fs = require('fs-extra');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { Formatter } = require('./formatter');

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('input', {
    alias: 'i',
    type: 'string',
    demandOption: true,
    description: 'Input JSON file with raw analysis data'
  })
  .option('output', {
    alias: 'o',
    type: 'string',
    demandOption: true,
    description: 'Output file for structured data'
  })
  .option('model', {
    alias: 'm',
    type: 'string',
    default: 'claude-3-7-sonnet-20250219',
    description: 'Model to use for formatting'
  })
  .argv;

async function main() {
  console.log('🔄 Formatting Service Starting...');
  console.log(`📥 Input: ${argv.input}`);
  console.log(`📤 Output: ${argv.output}`);
  console.log(`🧠 Model: ${argv.model}`);
  
  const startTime = Date.now();
  
  try {
    // Check if input file exists
    if (!await fs.pathExists(argv.input)) {
      console.error(`❌ Error: Input file not found: ${argv.input}`);
      process.exit(1);
    }
    
    // Initialize formatter
    const formatter = new Formatter({
      model: argv.model
    });
    
    // Read raw analysis data
    console.log('\n📖 Reading raw analysis data...');
    const rawAnalysisData = await fs.readJson(argv.input);
    
    // Format the data
    console.log('🔄 Formatting analysis data into structured format...');
    const { status, data, error } = await formatter.format(rawAnalysisData);
    
    // Create output directory if it doesn't exist
    await fs.ensureDir(path.dirname(argv.output));
    
    if (status === 'success') {
      // Save formatted data
      await fs.writeJson(argv.output, data, { spaces: 2 });
      
      const duration = (Date.now() - startTime) / 1000;
      console.log('\n✅ Formatting completed successfully');
      console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
      console.log(`📄 Formatted data saved to: ${argv.output}`);
    } else {
      console.error(`❌ Formatting failed: ${error}`);
      
      // Save error information
      await fs.writeJson(argv.output, {
        status: 'error',
        error: error,
        timestamp: new Date().toISOString(),
        rawData: rawAnalysisData // Include raw data for fallback
      }, { spaces: 2 });
      
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

main().catch(console.error);