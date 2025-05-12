const fs = require('fs-extra');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { ReportGenerator } = require('./generators/report-generator');

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('input', {
    alias: 'i',
    type: 'string',
    demandOption: true,
    description: 'Input JSON file with analysis data'
  })
  .option('screenshots', {
    alias: 's',
    type: 'string',
    demandOption: true,
    description: 'Directory containing screenshots'
  })
  .option('output', {
    alias: 'o',
    type: 'string',
    demandOption: true,
    description: 'Output directory for HTML reports'
  })
  .argv;

async function main() {
  console.log('📄 HTML Report Service Starting...');
  console.log(`📥 Input: ${argv.input}`);
  console.log(`📸 Screenshots: ${argv.screenshots}`);
  console.log(`📁 Output: ${argv.output}`);
  
  const startTime = Date.now();
  
  try {
    // Create the output directory
    console.log(`📁 Ensuring output directory exists: ${argv.output}`);
    await fs.ensureDir(argv.output);
    
    // Create a test file to verify directory permissions
    const testFilePath = path.join(argv.output, 'test-file.txt');
    await fs.writeFile(testFilePath, 'Test file to verify directory permissions');
    console.log(`✅ Test file created successfully: ${testFilePath}`);
    
    // Check if analysis file exists
    if (!await fs.pathExists(argv.input)) {
      console.error(`❌ Error: Analysis file not found: ${argv.input}`);
      
      // Generate error report
      const errorOutputDir = argv.output;
      await fs.ensureDir(errorOutputDir);
      
      const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Analysis Error</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            .container { max-width: 800px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 5px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            h1 { color: #e74c3c; }
            .error-box { background: #fff5f5; border-left: 4px solid #e74c3c; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Analysis Report Error</h1>
            <div class="error-box">
              <p>The analysis process did not complete successfully. No data is available to generate reports.</p>
              <p>Please check the logs for more information and try running the analysis again.</p>
            </div>
            <h2>Possible Issues:</h2>
            <ul>
              <li>API key not set or invalid</li>
              <li>Network connectivity problems</li>
              <li>Timeout during analysis</li>
              <li>Error in the analysis process</li>
            </ul>
          </div>
        </body>
        </html>
      `;
      
      await fs.writeFile(path.join(errorOutputDir, 'index.html'), errorHtml);
      console.log(`⚠️  Generated error report: ${path.join(errorOutputDir, 'index.html')}`);
      
      process.exit(1);
    }
    
    // Read analysis data
    console.log('\n📥 Reading analysis data...');
    const analysisData = await fs.readJson(argv.input);
    
    // Initialize report generator
    const generator = new ReportGenerator({
      outputDir: argv.output,
      screenshotsDir: argv.screenshots
    });
    
    // Generate reports
    console.log('\n🎨 Generating HTML reports...');
    const success = await generator.generateAllReports(analysisData);
    
    if (!success) {
      console.error('❌ HTML report generation failed');
      process.exit(1);
    }
    
    const duration = (Date.now() - startTime) / 1000;
    
    // List files in output directory
    console.log(`\n📄 Listing files in ${argv.output}:`);
    const files = await fs.readdir(argv.output);
    console.log(files.join(', '));
    
    // Summary
    console.log('\n🎉 HTML reports generated successfully');
    console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
    console.log(`📁 Reports saved to: ${argv.output}`);
    
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