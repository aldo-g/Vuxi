const fs = require('fs-extra');
const path = require('path');
const { URLCrawler } = require('./crawler');
const { limitUrlsPerCategory, hierarchicalSampling, simpleAggressiveFilter } = require('./utils');

class URLDiscoveryService {
  constructor(options = {}) {
    this.maxPages = options.maxPages || 50;
    this.timeout = options.timeout || 8000;
    this.waitTime = options.waitTime || 0.5;
    this.concurrency = options.concurrency || 3;
    this.fastMode = options.fastMode !== false;
    this.excludePatterns = options.excludePatterns || [];
    this.outputDir = options.outputDir || './data';
    this.maxUrlsPerCategory = options.maxUrlsPerCategory || 5;
    this.enableCategoryLimiting = options.enableCategoryLimiting !== false;
    this.enableHierarchicalSampling = options.enableHierarchicalSampling !== false;
    this.enableSimpleFilter = options.enableSimpleFilter !== false;
    this.hierarchicalOptions = {
      maxDepth: options.maxDepth || 3,
      samplesPerCategory: options.samplesPerCategory || 2,
      prioritizeOverviews: options.prioritizeOverviews !== false,
      skipLegalPages: options.skipLegalPages !== false,
      useSimpleFilter: options.useSimpleFilter !== false,
      maxUrlsTotal: options.maxUrlsTotal || 10
    };
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
    console.log(`🔥 Simple aggressive filter: ${this.enableSimpleFilter ? 'ENABLED' : 'disabled'}`);
    
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
      
      let finalUrls = results.urls;
      const urlsAfterDeduplication = finalUrls.length;
      
      // Apply simple aggressive filter if enabled
      if (this.enableSimpleFilter) {
        console.log(`\n🔥 Applying simple aggressive filter...`);
        finalUrls = simpleAggressiveFilter(finalUrls, this.hierarchicalOptions);
      }
      // Otherwise apply hierarchical sampling if enabled
      else if (this.enableHierarchicalSampling) {
        console.log(`\n🏗️  Applying hierarchical sampling...`);
        finalUrls = hierarchicalSampling(finalUrls, this.hierarchicalOptions);
      }
      
      // Apply category limiting if enabled (and simple filter not used)
      let urlsBeforeCategoryLimiting = finalUrls.length;
      if (this.enableCategoryLimiting && !this.enableSimpleFilter) {
        console.log(`\n🗂️  Applying category limiting (max ${this.maxUrlsPerCategory} per category)...`);
        finalUrls = limitUrlsPerCategory(finalUrls, this.maxUrlsPerCategory);
        console.log(`📉 URLs after category limiting: ${finalUrls.length} (reduced from ${urlsBeforeCategoryLimiting})`);
      }
      
      const outputData = {
        timestamp: new Date().toISOString(),
        startUrl: startUrl,
        totalUrls: finalUrls.length,
        crawlStats: {
          pagesCrawled: results.stats.pagesCrawled,
          pagesSkipped: results.stats.pagesSkipped,
          errors: results.stats.errors,
          duration: results.stats.duration,
          totalUrlsDiscovered: results.stats.totalUrlsDiscovered,
          duplicatesSkipped: results.stats.duplicatesSkipped,
          duplicatesRemoved: results.stats.duplicatesRemoved,
          urlsAfterDeduplication: urlsAfterDeduplication,
          urlsAfterFiltering: finalUrls.length
        },
        urls: finalUrls,
        excludePatterns: this.excludePatterns,
        settings: {
          fastMode: this.fastMode,
          concurrency: this.concurrency,
          timeout: this.timeout,
          waitTime: this.waitTime,
          maxUrlsPerCategory: this.maxUrlsPerCategory,
          enableCategoryLimiting: this.enableCategoryLimiting,
          enableHierarchicalSampling: this.enableHierarchicalSampling,
          enableSimpleFilter: this.enableSimpleFilter,
          hierarchicalOptions: this.hierarchicalOptions
        }
      };
      
      await fs.ensureDir(this.outputDir);
      
      const urlsPath = path.join(this.outputDir, 'urls.json');
      const simpleUrlsPath = path.join(this.outputDir, 'urls_simple.json');
      
      await fs.writeJson(urlsPath, outputData, { spaces: 2 });
      await fs.writeJson(simpleUrlsPath, finalUrls, { spaces: 2 });
      
      const duration = (Date.now() - startTime) / 1000;
      
      console.log('\n🎉 URL Discovery completed successfully');
      console.log(`⚡ Speed: ${(finalUrls.length / duration).toFixed(1)} URLs/second`);
      console.log(`🔀 Concurrency: ${this.concurrency}x parallel processing`);
      console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
      console.log(`🔗 Total URLs discovered: ${finalUrls.length}`);
      console.log(`📋 Pages crawled: ${results.stats.pagesCrawled}`);
      console.log(`⚠️  Pages skipped: ${results.stats.pagesSkipped}`);
      console.log(`❌ Errors: ${results.stats.errors}`);
      console.log(`🔍 Duplicates skipped during crawl: ${results.stats.duplicatesSkipped}`);
      console.log(`🗑️  Duplicates removed in final processing: ${results.stats.duplicatesRemoved}`);
      console.log(`🔥 URLs reduced by filtering: ${urlsAfterDeduplication - finalUrls.length}`);
      console.log(`📄 Full data saved to: ${urlsPath}`);
      console.log(`📝 Simple URL list saved to: ${simpleUrlsPath}`);
      
      return {
        success: true,
        urls: finalUrls,
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