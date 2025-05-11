const fs = require('fs-extra');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { URLCrawler } = require('./crawler');

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('url', {
    alias: 'u',
    type: 'string',
    demandOption: true,
    description: 'Starting URL to crawl'
  })
  .option('output', {
    alias: 'o',
    type: 'string',
    demandOption: true,
    description: 'Output file for discovered URLs'
  })
  .option('max-pages', {
    alias: 'm',
    type: 'number',
    default: 50,
    description: 'Maximum number of pages to crawl'
  })
  .option('timeout', {
    alias: 't',
    type: 'number',
    default: 30000,
    description: 'Page load timeout in ms'
  })
  .option('wait-time', {
    alias: 'w',
    type: 'number',
    default: 2,
    description: 'Time to wait after page load (seconds)'
  })
  .option('exclude', {
    alias: 'e',
    type: 'array',
    default: [],
    description: 'URL patterns to exclude (regex strings)'
  })
  .argv;

async function main() {
  console.log('🔍 URL Discovery Service Starting...');
  console.log(`🌐 Starting URL: ${argv.url}`);
  console.log(`🎯 Max pages: ${argv.maxPages}`);
  console.log(`📁 Output: ${argv.output}`);
  
  const startTime = Date.now();
  
  try {
    // Parse exclude patterns
    const excludePatterns = argv.exclude.map(pattern => new RegExp(pattern));
    
    // Initialize crawler
    const crawler = new URLCrawler({
      maxPages: argv.maxPages,
      timeout: argv.timeout,
      waitTime: argv.waitTime,
      excludePatterns: excludePatterns
    });
    
    // Discover URLs
    console.log('\n🕷️  Starting to crawl...');
    const results = await crawler.crawl(argv.url);
    
    // Prepare output data
    const outputData = {
      timestamp: new Date().toISOString(),
      startUrl: argv.url,
      totalUrls: results.urls.length,
      crawlStats: {
        pagesCrawled: results.stats.pagesCrawled,
        pagesSkipped: results.stats.pagesSkipped,
        errors: results.stats.errors,
        duration: results.stats.duration,
        totalUrlsDiscovered: results.stats.totalUrlsDiscovered,
        duplicatesSkipped: results.stats.duplicatesSkipped,
        duplicatesRemoved: results.stats.duplicatesRemoved
      },
      urls: results.urls,
      excludePatterns: argv.exclude
    };
    
    // Save to file
    await fs.ensureDir(path.dirname(argv.output));
    await fs.writeJson(argv.output, outputData, { spaces: 2 });
    
    // Simple array for downstream services
    const simpleUrlList = results.urls;
    const simpleOutputPath = argv.output.replace('.json', '_simple.json');
    await fs.writeJson(simpleOutputPath, simpleUrlList, { spaces: 2 });
    
    const duration = (Date.now() - startTime) / 1000;
    
    // Summary
    console.log('\n🎉 URL Discovery completed successfully');
    console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
    console.log(`🔗 Total URLs discovered: ${results.urls.length}`);
    console.log(`📋 Pages crawled: ${results.stats.pagesCrawled}`);
    console.log(`⚠️  Pages skipped: ${results.stats.pagesSkipped}`);
    console.log(`❌ Errors: ${results.stats.errors}`);
    console.log(`🔍 Duplicates skipped during crawl: ${results.stats.duplicatesSkipped}`);
    console.log(`🗑️  Duplicates removed in final processing: ${results.stats.duplicatesRemoved}`);
    console.log(`📄 Full data saved to: ${argv.output}`);
    console.log(`📝 Simple URL list saved to: ${simpleOutputPath}`);
    
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