const fs = require('fs-extra');
const path = require('path');
const { URLCrawler } = require('./crawler');

class URLDiscoveryService {
  constructor(options = {}) {
    this.maxPages = options.maxPages || 50;
    this.timeout = options.timeout || 30000;
    this.waitTime = options.waitTime || 2;
    this.excludePatterns = options.excludePatterns || [];
    this.outputDir = options.outputDir || './data';
  }

  async discover(startUrl) {
    console.log('🔍 URL Discovery Service Starting...');
    console.log(`🌐 Starting URL: ${startUrl}`);
    console.log(`🎯 Max pages: ${this.maxPages}`);
    console.log(`📁 Output: ${this.outputDir}`);
    
    const startTime = Date.now();
    
    try {
      // Parse exclude patterns (if they're strings, convert to RegExp)
      const excludePatterns = this.excludePatterns.map(pattern => {
        return typeof pattern === 'string' ? new RegExp(pattern) : pattern;
      });
      
      // Initialize crawler
      const crawler = new URLCrawler({
        maxPages: this.maxPages,
        timeout: this.timeout,
        waitTime: this.waitTime,
        excludePatterns: excludePatterns
      });
      
      // Discover URLs
      console.log('\n🕷️  Starting to crawl...');
      const results = await crawler.crawl(startUrl);
      
      // Prepare output data
      const outputData = {
        timestamp: new Date().toISOString(),
        startUrl: startUrl,
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
        excludePatterns: this.excludePatterns
      };
      
      // Ensure output directory exists
      await fs.ensureDir(this.outputDir);
      
      // Save to data directory (matching your structure)
      const urlsPath = path.join(this.outputDir, 'urls.json');
      const simpleUrlsPath = path.join(this.outputDir, 'urls_simple.json');
      
      await fs.writeJson(urlsPath, outputData, { spaces: 2 });
      await fs.writeJson(simpleUrlsPath, results.urls, { spaces: 2 });
      
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
      console.log(`📄 Full data saved to: ${urlsPath}`);
      console.log(`📝 Simple URL list saved to: ${simpleUrlsPath}`);
      
      return {
        success: true,
        urls: results.urls,
        stats: results.stats,
        outputData,
        files: {
          urls: urlsPath,
          simpleUrls: simpleUrlsPath
        }
      };
      
    } catch (error) {
      console.error('❌ URL Discovery failed:', error);
      return {
        success: false,
        error: error.message,
        urls: [],
        stats: {}
      };
    }
  }
}

module.exports = { URLDiscoveryService };