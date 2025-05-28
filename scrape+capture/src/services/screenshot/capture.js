const { chromium } = require('playwright');
const fs = require('fs-extra');
const path = require('path');
const { ScreenshotEnhancer } = require('./enhancer');
const { createFilename } = require('./utils');

class ScreenshotCapture {
  constructor(outputDir, options = {}) {
    this.outputDir = outputDir;
    this.viewport = {
      width: options.width || 1440,
      height: options.height || 900
    };
    this.timeout = options.timeout || 30000;
    this.browser = null;
    this.enhancer = new ScreenshotEnhancer();
    
    // Create output directory structure
    this.screenshotsDir = path.join(outputDir, 'desktop');
    fs.ensureDirSync(this.screenshotsDir);
  }
  
  async init() {
    if (!this.browser) {
      console.log('🚀 Launching browser...');
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--memory-pressure-off', // Help with concurrent operations
          '--max_old_space_size=4096' // Increase memory limit
        ]
      });
    }
  }
  
  async close() {
    if (this.browser) {
      console.log('🛑 Closing browser...');
      await this.browser.close();
      this.browser = null;
    }
  }
  
  async captureUrl(url, index) {
    const startTime = Date.now();
    let context = null;
    
    try {
      // Ensure browser is initialized
      await this.init();
      
      console.log(`📸 [${index}] Capturing: ${url}`);
      
      // Create new browser context for isolation with optimized settings
      context = await this.browser.newContext({
        viewport: this.viewport,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        // Optimize for concurrent operations
        reducedMotion: 'reduce',
        colorScheme: 'light'
      });
      
      const page = await context.newPage();
      
      // Navigate to page with timeout
      console.log(`  ⏳ Loading page...`);
      const response = await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: this.timeout
      });
      
      if (!response || response.status() >= 400) {
        throw new Error(`Failed to load page: HTTP ${response ? response.status() : 'unknown'}`);
      }
      
      // Apply JavaScript enhancements
      console.log(`  ✨ Applying enhancements...`);
      await this.enhancer.enhance(page);
      
      // Reduced wait time for concurrent operations
      await page.waitForTimeout(1500); // Reduced from 2000ms
      
      // Generate filename and path
      const filename = createFilename(url, index);
      const filepath = path.join(this.screenshotsDir, filename);
      
      // Take screenshot
      console.log(`  📷 Taking screenshot...`);
      await page.screenshot({
        path: filepath,
        fullPage: true,
        type: 'png'
      });
      
      const duration = Date.now() - startTime;
      console.log(`  ✅ Success in ${duration}ms: ${filename}`);
      
      return {
        url: url,
        filename: filename,
        path: `desktop/${filename}`,
        timestamp: new Date().toISOString(),
        duration_ms: duration,
        viewport: this.viewport
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`  ❌ Error after ${duration}ms: ${error.message}`);
      throw error;
    } finally {
      // Ensure context is closed even on error
      if (context) {
        try {
          await context.close();
        } catch (closeError) {
          console.error(`  ⚠️  Error closing context: ${closeError.message}`);
        }
      }
    }
  }
}

module.exports = { ScreenshotCapture };