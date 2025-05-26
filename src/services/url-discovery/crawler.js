const { chromium } = require('playwright');
const { isValidUrl, normalizeUrl, isSameDomain, shouldExcludeUrl, createDeduplicationKey, deduplicateUrls } = require('./utils');

class URLCrawler {
  constructor(options = {}) {
    this.maxPages = options.maxPages || 50;
    this.timeout = options.timeout || 30000;
    this.waitTime = options.waitTime || 2;
    this.excludePatterns = options.excludePatterns || [];
    
    this.visitedUrls = new Set();
    this.discoveredUrls = new Set();
    this.urlsToVisit = [];
    this.deduplicationKeys = new Set();
    this.stats = {
      pagesCrawled: 0,
      pagesSkipped: 0,
      errors: 0,
      duplicatesSkipped: 0,
      startTime: Date.now()
    };
  }
  
  async extractLinks(page, baseUrl) {
    try {
      const links = await page.evaluate(() => {
        // Get all links
        return Array.from(document.querySelectorAll('a[href]')).map(link => link.href);
      });
      
      // Filter and normalize links
      const validLinks = [];
      for (const link of links) {
        // Skip invalid URLs
        if (!isValidUrl(link)) continue;
        
        // Skip non-HTTP protocols
        if (!link.startsWith('http://') && !link.startsWith('https://')) continue;
        
        // Skip external links (different domain)
        if (!isSameDomain(baseUrl, link)) continue;
        
        // Normalize URL
        const normalizedUrl = normalizeUrl(link);
        
        // Skip if should be excluded
        if (shouldExcludeUrl(normalizedUrl, this.excludePatterns)) continue;
        
        // Check for duplicates using deduplication key
        const dedupKey = createDeduplicationKey(normalizedUrl);
        if (this.deduplicationKeys.has(dedupKey)) {
          this.stats.duplicatesSkipped++;
          continue;
        }
        
        // Skip if already discovered
        if (this.discoveredUrls.has(normalizedUrl)) continue;
        
        validLinks.push(normalizedUrl);
        this.discoveredUrls.add(normalizedUrl);
        this.deduplicationKeys.add(dedupKey);
      }
      
      return validLinks;
    } catch (error) {
      console.error('Error extracting links:', error);
      return [];
    }
  }
  
  async crawlPage(page, url) {
    try {
      console.log(`  📄 Crawling: ${url}`);
      
      // Navigate to page
      const response = await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: this.timeout
      });
      
      if (!response || response.status() >= 400) {
        console.log(`  ⚠️  Warning: HTTP ${response ? response.status() : 'unknown'} for ${url}`);
        this.stats.pagesSkipped++;
        return [];
      }
      
      // Wait for additional content
      await page.waitForTimeout(this.waitTime * 1000);
      
      // Extract links
      const newLinks = await this.extractLinks(page, url);
      console.log(`  🔗 Found ${newLinks.length} new links`);
      
      this.stats.pagesCrawled++;
      return newLinks;
      
    } catch (error) {
      console.error(`  ❌ Error crawling ${url}:`, error.message);
      this.stats.errors++;
      return [];
    }
  }
  
  async crawl(startUrl) {
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      // Normalize start URL
      const normalizedStartUrl = normalizeUrl(startUrl);
      this.urlsToVisit.push(normalizedStartUrl);
      this.discoveredUrls.add(normalizedStartUrl);
      this.deduplicationKeys.add(createDeduplicationKey(normalizedStartUrl));
      
      console.log(`🚀 Starting crawl from: ${normalizedStartUrl}`);
      
      // Create browser context
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (compatible; URLDiscoveryBot/1.0)'
      });
      
      const page = await context.newPage();
      
      // Crawl pages
      let crawledCount = 0;
      while (this.urlsToVisit.length > 0 && crawledCount < this.maxPages) {
        const currentUrl = this.urlsToVisit.shift();
        
        // Skip if already visited
        if (this.visitedUrls.has(currentUrl)) {
          continue;
        }
        
        this.visitedUrls.add(currentUrl);
        crawledCount++;
        
        console.log(`\n[${crawledCount}/${this.maxPages}] Processing...`);
        
        // Crawl page and get new links
        const newLinks = await this.crawlPage(page, currentUrl);
        
        // Add new links to queue
        for (const link of newLinks) {
          if (!this.visitedUrls.has(link) && !this.urlsToVisit.includes(link)) {
            this.urlsToVisit.push(link);
          }
        }
        
        // Progress update
        console.log(`  📊 Queue: ${this.urlsToVisit.length} | Discovered: ${this.discoveredUrls.size} | Visited: ${this.visitedUrls.size} | Duplicates skipped: ${this.stats.duplicatesSkipped}`);
      }
      
      await context.close();
      
      // Final deduplication of all discovered URLs
      const finalUrls = deduplicateUrls(Array.from(this.discoveredUrls));
      
      // Calculate final stats
      this.stats.duration = (Date.now() - this.stats.startTime) / 1000;
      this.stats.finalUrlCount = finalUrls.length;
      this.stats.totalUrlsDiscovered = this.discoveredUrls.size;
      this.stats.duplicatesRemoved = this.discoveredUrls.size - finalUrls.length;
      
      // Return results
      return {
        urls: finalUrls,
        stats: this.stats
      };
      
    } finally {
      await browser.close();
    }
  }
}

module.exports = { URLCrawler };