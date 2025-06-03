// scrape+capture/src/services/url-discovery/index.js
const fs = require('fs-extra');
const path = require('path');
const { URLCrawler } = require('./crawler');
const { limitUrlsPerCategory, hierarchicalSampling, simpleAggressiveFilter } = require('./utils');

class URLDiscoveryService {
  constructor(options = {}) {
    this.maxPages = options.maxPages || 50;
    this.timeout = options.timeout || 8000;
    this.waitTime = options.waitTime || 0.5; // Ensure this is a number
    this.concurrency = options.concurrency || 3;
    this.fastMode = options.fastMode !== undefined ? options.fastMode : true; // Default to true if undefined
    this.excludePatterns = options.excludePatterns || [];
    this.outputDir = options.outputDir || './data'; // This will be overridden by batch_analyzer.js
    this.maxUrlsPerCategory = options.maxUrlsPerCategory || 5;
    this.enableCategoryLimiting = options.enableCategoryLimiting !== undefined ? options.enableCategoryLimiting : true; // Default to true
    
    // Hierarchical and Simple Filter options
    this.enableHierarchicalSampling = options.enableHierarchicalSampling !== undefined ? options.enableHierarchicalSampling : true; // Default to true
    this.enableSimpleFilter = options.enableSimpleFilter !== undefined ? options.enableSimpleFilter : false; // Default to FALSE now, let batch analyzer control it
                                                                                                            // Or, if true, the new logic will gate it by URL count.

    this.hierarchicalOptions = {
      maxDepth: options.hierarchicalOptions?.maxDepth || options.maxDepth || 3, // Use specific or general maxDepth
      samplesPerCategory: options.hierarchicalOptions?.samplesPerCategory || options.samplesPerCategory || 2,
      prioritizeOverviews: options.hierarchicalOptions?.prioritizeOverviews !== undefined ? options.hierarchicalOptions.prioritizeOverviews : true,
      skipLegalPages: options.hierarchicalOptions?.skipLegalPages !== undefined ? options.hierarchicalOptions.skipLegalPages : true,
      // useSimpleFilter is effectively handled by the new logic below
      maxUrlsTotal: options.hierarchicalOptions?.maxUrlsTotal || options.maxUrlsTotal || 10 // Max URLs for simple filter
    };
  }

  async discover(startUrl) {
    console.log('🔍 URL Discovery Service Starting...');
    console.log(`🌐 Starting URL: ${startUrl}`);
    console.log(`🎯 Max pages to crawl initially: ${this.maxPages}`);
    console.log(`⚡ Fast mode: ${this.fastMode ? 'ENABLED' : 'disabled'}`);
    console.log(`🔀 Concurrency: ${this.concurrency} pages at once`);
    console.log(`⏰ Timeout: ${this.timeout}ms per page`);
    console.log(`⏳ Wait time: ${this.waitTime}s`);
    console.log(`📁 Output to be saved in: ${this.outputDir}`); // This path is set by the calling script (e.g., batch_analyzer.js)
    console.log(`🔥 Simple aggressive filter initially set to: ${this.enableSimpleFilter ? 'ENABLED (conditional)' : 'DISABLED'}`);
    console.log(`📊 Max URLs for simple filter: ${this.hierarchicalOptions.maxUrlsTotal}`);
    
    const startTime = Date.now();
    
    try {
      const excludePatterns = this.excludePatterns.map(pattern => {
        return typeof pattern === 'string' ? new RegExp(pattern) : pattern;
      });
      
      const crawler = new URLCrawler({
        maxPages: this.maxPages,
        timeout: this.timeout,
        waitTime: parseFloat(this.waitTime) || 0.5, // Ensure waitTime is a number
        concurrency: this.concurrency,
        fastMode: this.fastMode,
        excludePatterns: excludePatterns
      });
      
      console.log('\n⚡ Starting CONCURRENT crawl...');
      const results = await crawler.crawl(startUrl); // results.urls contains deduplicated URLs from crawler
      
      let finalUrls = results.urls;
      const urlsAfterInitialCrawlAndDeduplication = finalUrls.length;
      console.log(`\n🔗 URLs after initial crawl & deduplication: ${urlsAfterInitialCrawlAndDeduplication}`);

      // *** MODIFIED LOGIC FOR APPLYING SIMPLE AGGRESSIVE FILTER ***
      let simpleFilterApplied = false;
      if (this.enableSimpleFilter && urlsAfterInitialCrawlAndDeduplication > (this.hierarchicalOptions.maxUrlsTotal || 10) ) {
        console.log(`\n🔥 Applying simple aggressive filter (discovered ${urlsAfterInitialCrawlAndDeduplication} > ${this.hierarchicalOptions.maxUrlsTotal} threshold)...`);
        finalUrls = simpleAggressiveFilter(finalUrls, this.hierarchicalOptions);
        simpleFilterApplied = true;
      } else if (this.enableSimpleFilter) {
        console.log(`\nℹ️  Simple aggressive filter was enabled but NOT applied (discovered ${urlsAfterInitialCrawlAndDeduplication} <= ${this.hierarchicalOptions.maxUrlsTotal} threshold).`);
      }
      // *** END OF MODIFIED LOGIC ***

      // If simple filter was NOT applied AND hierarchical sampling is enabled, apply hierarchical sampling.
      if (!simpleFilterApplied && this.enableHierarchicalSampling) {
        console.log(`\n🏗️  Applying hierarchical sampling...`);
        // Pass hierarchicalOptions, but ensure useSimpleFilter within it is false to avoid re-triggering simple filter logic
        const hierarchicalOptsForSampling = { ...this.hierarchicalOptions, useSimpleFilter: false };
        finalUrls = hierarchicalSampling(finalUrls, hierarchicalOptsForSampling);
      }
      
      // Apply category limiting if enabled (and simple filter was not the one that ran)
      let urlsBeforeCategoryLimiting = finalUrls.length;
      if (this.enableCategoryLimiting && !simpleFilterApplied) { // Only limit categories if simple filter didn't already drastically reduce
        console.log(`\n🗂️  Applying category limiting (max ${this.maxUrlsPerCategory} per category)...`);
        finalUrls = limitUrlsPerCategory(finalUrls, this.maxUrlsPerCategory);
        console.log(`📉 URLs after category limiting: ${finalUrls.length} (reduced from ${urlsBeforeCategoryLimiting})`);
      }
      
      const outputData = {
        timestamp: new Date().toISOString(),
        startUrl: startUrl,
        totalFinalUrls: finalUrls.length, // Renamed for clarity
        crawlStats: {
          pagesCrawled: results.stats.pagesCrawled,
          pagesSkipped: results.stats.pagesSkipped,
          errors: results.stats.errors,
          durationSeconds: results.stats.duration, // Assuming crawler.stats.duration is in seconds
          totalUrlsDiscoveredByCrawler: results.stats.totalUrlsDiscovered,
          duplicatesSkippedByCrawler: results.stats.duplicatesSkipped,
          duplicatesRemovedByCrawler: results.stats.duplicatesRemoved,
          urlsAfterInitialCrawlAndDeduplication: urlsAfterInitialCrawlAndDeduplication,
          simpleFilterApplied: simpleFilterApplied,
          urlsAfterAllFiltering: finalUrls.length // Renamed for clarity
        },
        urls: finalUrls, // The final list of URLs
        excludePatternsUsed: this.excludePatterns.map(p => p.toString()), // Store regex as strings
        settings: {
          maxPagesSetForCrawl: this.maxPages,
          fastMode: this.fastMode,
          concurrency: this.concurrency,
          timeout: this.timeout,
          waitTime: this.waitTime,
          enableSimpleFilterConfig: this.enableSimpleFilter,
          enableHierarchicalSamplingConfig: this.enableHierarchicalSampling,
          enableCategoryLimitingConfig: this.enableCategoryLimiting,
          maxUrlsPerCategorySet: this.maxUrlsPerCategory,
          hierarchicalOptionsUsed: this.hierarchicalOptions
        }
      };
      
      // This service is called with a specific outputDir by batch_analyzer.js
      // So, this.outputDir is already unique for the run.
      await fs.ensureDir(this.outputDir); 
      
      const urlsPath = path.join(this.outputDir, 'urls.json');
      const simpleUrlsPath = path.join(this.outputDir, 'urls_simple.json');
      
      await fs.writeJson(urlsPath, outputData, { spaces: 2 });
      await fs.writeJson(simpleUrlsPath, finalUrls, { spaces: 2 }); // Save the final list
      
      const overallDurationSeconds = (Date.now() - startTime) / 1000;
      
      console.log('\n🎉 URL Discovery service execution completed successfully');
      if (overallDurationSeconds > 0 && finalUrls.length > 0) {
        console.log(`⚡ Overall processing speed: ${(finalUrls.length / overallDurationSeconds).toFixed(1)} final URLs/second`);
      }
      console.log(`⏱️  Overall duration for this service: ${overallDurationSeconds.toFixed(2)} seconds`);
      console.log(`🔗 Total final URLs selected: ${finalUrls.length}`);
      console.log(`📄 Full discovery data saved to: ${urlsPath}`);
      console.log(`📝 Simple list of final URLs saved to: ${simpleUrlsPath}`);
      
      return {
        success: true,
        urls: finalUrls, // Return the final list
        stats: outputData.crawlStats, // Return the comprehensive stats
        outputData,
        files: {
          urls: urlsPath,
          simpleUrls: simpleUrlsPath
        }
      };
      
    } catch (error) {
      console.error('❌ URL Discovery service failed:', error);
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
