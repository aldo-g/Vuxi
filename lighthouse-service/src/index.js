const fs = require('fs-extra');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { LighthouseAuditor } = require('./auditor');
const { trimReport } = require('./report-trimmer');

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('input', {
    alias: 'i',
    type: 'string',
    demandOption: true,
    description: 'Input JSON file with URLs'
  })
  .option('output', {
    alias: 'o',
    type: 'string',
    demandOption: true,
    description: 'Output directory for Lighthouse reports'
  })
  .option('concurrent', {
    alias: 'c',
    type: 'number',
    default: 1, // Changed to 1 to run sequentially
    description: 'Number of concurrent audits (set to 1 for stability)'
  })
  .option('retries', {
    alias: 'r',
    type: 'number',
    default: 2,
    description: 'Number of retries for failed audits'
  })
  .argv;

async function main() {
  console.log('🚦 Lighthouse Service Starting...');
  console.log(`📋 Input: ${argv.input}`);
  console.log(`📁 Output: ${argv.output}`);
  
  const startTime = Date.now();
  
  try {
    // Read URLs from JSON file
    console.log('📥 Reading URLs...');
    const urlsData = await fs.readJson(argv.input);
    const urls = Array.isArray(urlsData) ? urlsData : [urlsData];
    console.log(`📋 Found ${urls.length} URLs to audit`);
    
    // Initialize auditor
    const auditor = new LighthouseAuditor({
      outputDir: argv.output,
      retries: argv.retries
    });
    
    // Process URLs sequentially to avoid conflicts
    const allResults = [];
    
    console.log('\n🚦 Running Lighthouse audits sequentially...');
    
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`\n[${i+1}/${urls.length}] Processing: ${url}`);
      
      try {
        const result = await auditor.auditUrl(url, i);
        allResults.push({
          url: url,
          success: true,
          data: result,
          error: null
        });
      } catch (error) {
        console.error(`Failed to audit ${url}: ${error.message}`);
        allResults.push({
          url: url,
          success: false,
          data: null,
          error: error.message
        });
      }
    }
    
    // Close the browser when done
    await auditor.closeBrowser();
    
    // Calculate statistics
    const successful = allResults.filter(r => r.success).length;
    const failed = allResults.length - successful;
    const duration = (Date.now() - startTime) / 1000;
    
    // Save summary metadata
    const summary = {
      timestamp: new Date().toISOString(),
      duration_seconds: duration,
      total_urls: urls.length,
      successful_audits: successful,
      failed_audits: failed,
      results: allResults.map(r => ({
        url: r.url,
        success: r.success,
        error: r.error,
        reportPath: r.success ? r.data.reportPath : null,
        trimmedPath: r.success ? r.data.trimmedPath : null
      }))
    };
    
    await fs.writeJson(path.join(argv.output, 'lighthouse-summary.json'), summary, { spaces: 2 });
    
    // Summary
    console.log('\n🎉 Lighthouse audits completed');
    console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
    console.log(`✅ Successful: ${successful}/${urls.length}`);
    console.log(`❌ Failed: ${failed}/${urls.length}`);
    console.log(`📄 Summary saved to: ${path.join(argv.output, 'lighthouse-summary.json')}`);
    
    // Exit with error code if any failed
    process.exit(failed > 0 ? 1 : 0);
    
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