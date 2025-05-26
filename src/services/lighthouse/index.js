const fs = require('fs-extra');
const path = require('path');
const { LighthouseAuditor } = require('./auditor');

class LighthouseService {
  constructor(options = {}) {
    this.outputDir = options.outputDir || './data/lighthouse';
    this.retries = options.retries || 2;
    this.concurrent = options.concurrent || 1; // Keep sequential for stability
  }

  async auditAll(urls) {
    console.log('🚦 Lighthouse Service Starting...');
    console.log(`📋 URLs to audit: ${urls.length}`);
    console.log(`📁 Output: ${this.outputDir}`);
    console.log(`🔄 Retries: ${this.retries}`);
    
    const startTime = Date.now();
    
    try {
      // Ensure output directory exists
      await fs.ensureDir(this.outputDir);
      
      // Initialize auditor
      const auditor = new LighthouseAuditor({
        outputDir: this.outputDir,
        retries: this.retries
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
      const successful = allResults.filter(r => r.success);
      const failed = allResults.filter(r => !r.success);
      const duration = (Date.now() - startTime) / 1000;
      
      // Save summary metadata (matching your data structure)
      const summary = {
        timestamp: new Date().toISOString(),
        duration_seconds: duration,
        total_urls: urls.length,
        successful_audits: successful.length,
        failed_audits: failed.length,
        results: allResults.map(r => ({
          url: r.url,
          success: r.success,
          error: r.error,
          reportPath: r.success ? r.data.reportPath : null,
          trimmedPath: r.success ? r.data.trimmedPath : null
        }))
      };
      
      const summaryPath = path.join(this.outputDir, 'lighthouse-summary.json');
      await fs.writeJson(summaryPath, summary, { spaces: 2 });
      
      // Summary
      console.log('\n🎉 Lighthouse audits completed');
      console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
      console.log(`✅ Successful: ${successful.length}/${urls.length}`);
      console.log(`❌ Failed: ${failed.length}/${urls.length}`);
      console.log(`📄 Summary saved to: ${summaryPath}`);
      
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
          summary: summaryPath,
          reportsDir: path.join(this.outputDir, 'reports'),
          trimmedDir: path.join(this.outputDir, 'trimmed')
        }
      };
      
    } catch (error) {
      console.error('❌ Lighthouse service failed:', error);
      return {
        success: false,
        error: error.message,
        successful: [],
        failed: [],
        stats: {}
      };
    }
  }
}

module.exports = { LighthouseService };