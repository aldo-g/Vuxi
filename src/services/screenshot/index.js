const fs = require('fs-extra');
const path = require('path');
const { ScreenshotCapture } = require('./capture');

class ScreenshotService {
  constructor(options = {}) {
    this.outputDir = options.outputDir || './data/screenshots';
    this.viewport = {
      width: options.viewport?.width || 1440,
      height: options.viewport?.height || 900
    };
    this.timeout = options.timeout || 30000;
    this.concurrent = options.concurrent || 3;
  }

  async captureAll(urls) {
    console.log('📸 Screenshot Service Starting...');
    console.log(`📋 URLs to capture: ${urls.length}`);
    console.log(`📁 Output: ${this.outputDir}`);
    console.log(`📐 Viewport: ${this.viewport.width}x${this.viewport.height}`);
    
    const startTime = Date.now();
    
    try {
      // Ensure output directory exists
      await fs.ensureDir(this.outputDir);
      
      // Initialize capture service
      const screenshotCapture = new ScreenshotCapture(this.outputDir, {
        width: this.viewport.width,
        height: this.viewport.height,
        timeout: this.timeout
      });
      
      // Process URLs in batches for concurrency
      const allResults = [];
      const batchSize = this.concurrent;
      
      for (let i = 0; i < urls.length; i += batchSize) {
        console.log(`\n📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(urls.length/batchSize)}`);
        const batchResults = await this.processBatch(urls, i, screenshotCapture, batchSize);
        allResults.push(...batchResults);
        
        // Progress update
        const completed = Math.min(i + batchSize, urls.length);
        console.log(`✅ Completed ${completed}/${urls.length} URLs`);
      }
      
      // Close browser
      await screenshotCapture.close();
      
      // Calculate statistics
      const successful = allResults.filter(r => r.success);
      const failed = allResults.filter(r => !r.success);
      const duration = (Date.now() - startTime) / 1000;
      
      // Save metadata to match your data structure
      const metadata = {
        timestamp: new Date().toISOString(),
        duration_seconds: duration,
        total_urls: urls.length,
        successful_captures: successful.length,
        failed_captures: failed.length,
        results: allResults,
        configuration: {
          viewport: this.viewport,
          timeout: this.timeout,
          concurrent: this.concurrent
        }
      };
      
      const metadataPath = path.join(this.outputDir, 'metadata.json');
      await fs.writeJson(metadataPath, metadata, { spaces: 2 });
      
      // Summary
      console.log('\n🎉 Screenshot service completed');
      console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
      console.log(`✅ Successful: ${successful.length}/${urls.length}`);
      console.log(`❌ Failed: ${failed.length}/${urls.length}`);
      console.log(`📄 Metadata saved to: ${metadataPath}`);
      
      return {
        success: failed.length === 0,
        successful: successful,
        failed: failed,
        stats: {
          total: urls.length,
          successful: successful.length,
          failed: failed.length,
          duration: duration
        },
        files: {
          metadata: metadataPath,
          screenshotsDir: path.join(this.outputDir, 'desktop')
        }
      };
      
    } catch (error) {
      console.error('❌ Screenshot service failed:', error);
      return {
        success: false,
        error: error.message,
        successful: [],
        failed: [],
        stats: {}
      };
    }
  }

  async processBatch(urls, startIndex, screenshotCapture, batchSize) {
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
}

module.exports = { ScreenshotService };