const fs = require('fs-extra');
const path = require('path');
const { URLCrawler } = require('./crawler');

class URLDiscoveryService {
  constructor(options = {}) {
    this.maxPages = options.maxPages || 50;
    this.timeout = options.timeout || 8000;
    this.waitTime = options.waitTime || 0.5;
    this.concurrency = options.concurrency || 3;
    this.fastMode = options.fastMode !== false;
    this.excludePatterns = options.excludePatterns || [];
    this.outputDir = options.outputDir || './data';
  }

  async discover(startUrl) {
    console.log('🔍 URL Discovery Service Starting...');
    console.log(`🌐 Starting URL: ${startUrl}`);
    console.log(`🎯 Max pages: ${this.maxPages}`);
    console.log(`⚡ Fast mode: ${this.fastMode ? 'ENABLED' : 'disabled'}`);
    console.log(`🔀 Concurrency: ${this.concurrency} pages at once`);
    console.log(`⏰ Timeout: ${this.timeout}ms per page`);
    console.log(`⏳ Wait time: ${this.waitTime}s`);
    console.log(`📁 Output: ${this.outputDir}`);
    
    const startTime = Date.now();
    
    try {
      const excludePatterns = this.excludePatterns.map(pattern => {
        return typeof pattern === 'string' ? new RegExp(pattern) : pattern;
      });
      
      const crawler = new URLCrawler({
        maxPages: this.maxPages,
        timeout: this.timeout,
        waitTime: this.waitTime,
        concurrency: this.concurrency,
        fastMode: this.fastMode,
        excludePatterns: excludePatterns
      });
      
      console.log('\n⚡ Starting CONCURRENT crawl...');
      const results = await crawler.crawl(startUrl);
      
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
        excludePatterns: this.excludePatterns,
        settings: {
          fastMode: this.fastMode,
          concurrency: this.concurrency,
          timeout: this.timeout,
          waitTime: this.waitTime
        }
      };
      
      await fs.ensureDir(this.outputDir);
      
      const urlsPath = path.join(this.outputDir, 'urls.json');
      const simpleUrlsPath = path.join(this.outputDir, 'urls_simple.json');
      
      await fs.writeJson(urlsPath, outputData, { spaces: 2 });
      await fs.writeJson(simpleUrlsPath, results.urls, { spaces: 2 });
      
      const duration = (Date.now() - startTime) / 1000;
      
      console.log('\n🎉 URL Discovery completed successfully');
      console.log(`⚡ Speed: ${(results.urls.length / duration).toFixed(1)} URLs/second`);
      console.log(`🔀 Concurrency: ${this.concurrency}x parallel processing`);
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