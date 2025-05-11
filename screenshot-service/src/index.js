const fs = require('fs-extra');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { ScreenshotCapture } = require('./capture');

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
    description: 'Output directory for screenshots'
  })
  .option('timeout', {
    alias: 't',
    type: 'number',
    default: 30000,
    description: 'Page load timeout in ms'
  })
  .option('viewport', {
    alias: 'v',
    type: 'string',
    default: '1440x900',
    description: 'Viewport size (WIDTHxHEIGHT)'
  })
  .option('concurrent', {
    alias: 'c',
    type: 'number',
    default: 3,
    description: 'Number of concurrent captures'
  })
  .argv;

async function processBatch(urls, startIndex, screenshotCapture, batchSize) {
  const batch = urls.slice(startIndex, startIndex + batchSize);
  const results = await Promise.allSettled(
    batch.map((url, i) => screenshotCapture.captureUrl(url, startIndex + i))
  );
  
  return results.map((result, i) => ({
    url: batch[i],
    success: result.status === 'fulfilled',
    data: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? result.reason.message : null
  }));
}

async function main() {
  console.log('📸 Screenshot Service Starting...');
  console.log(`📋 Input: ${argv.input}`);
  console.log(`📁 Output: ${argv.output}`);
  
  const startTime = Date.now();
  
  try {
    // Read URLs from JSON file
    console.log('📥 Reading URLs...');
    const urlsData = await fs.readJson(argv.input);
    const urls = Array.isArray(urlsData) ? urlsData : [urlsData];
    console.log(`📋 Found ${urls.length} URLs to process`);
    
    // Parse viewport
    const [width, height] = argv.viewport.split('x').map(Number);
    
    // Initialize capture service
    const screenshotCapture = new ScreenshotCapture(argv.output, { 
      width, 
      height,
      timeout: argv.timeout
    });
    
    // Process URLs in batches for concurrency
    const allResults = [];
    const batchSize = argv.concurrent;
    
    for (let i = 0; i < urls.length; i += batchSize) {
      console.log(`\n📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(urls.length/batchSize)}`);
      const batchResults = await processBatch(urls, i, screenshotCapture, batchSize);
      allResults.push(...batchResults);
      
      // Progress update
      const completed = Math.min(i + batchSize, urls.length);
      console.log(`✅ Completed ${completed}/${urls.length} URLs`);
    }
    
    // Close browser
    await screenshotCapture.close();
    
    // Calculate statistics
    const successful = allResults.filter(r => r.success).length;
    const failed = allResults.length - successful;
    const duration = (Date.now() - startTime) / 1000;
    
    // Save metadata
    const metadata = {
      timestamp: new Date().toISOString(),
      duration_seconds: duration,
      total_urls: urls.length,
      successful_captures: successful,
      failed_captures: failed,
      results: allResults,
      configuration: {
        viewport: {
          width: width,
          height: height
        },
        timeout: argv.timeout,
        concurrent: argv.concurrent
      }
    };
    
    await fs.writeJson(path.join(argv.output, 'metadata.json'), metadata, { spaces: 2 });
    
    // Summary
    console.log('\n🎉 Screenshot service completed');
    console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
    console.log(`✅ Successful: ${successful}/${urls.length}`);
    console.log(`❌ Failed: ${failed}/${urls.length}`);
    console.log(`📄 Metadata saved to: ${path.join(argv.output, 'metadata.json')}`);
    
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