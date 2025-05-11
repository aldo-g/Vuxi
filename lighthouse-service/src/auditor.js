const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const { createFilename } = require('./utils');
const { trimReport } = require('./report-trimmer');
const lighthouseConfig = require('../config/lighthouse-config');

// Import lighthouse with multiple fallback methods
let lighthouse;
try {
  // Try ESM-style import
  const lighthouseModule = require('lighthouse');
  lighthouse = lighthouseModule.default || lighthouseModule;
} catch (err) {
  console.error('Error importing lighthouse:', err);
}

class LighthouseAuditor {
  constructor(options = {}) {
    this.outputDir = options.outputDir;
    this.retries = options.retries || 2;
    this.browser = null;
    
    // Create output directories
    this.reportsDir = path.join(this.outputDir, 'reports');
    this.trimmedDir = path.join(this.outputDir, 'trimmed');
    
    fs.ensureDirSync(this.reportsDir);
    fs.ensureDirSync(this.trimmedDir);
  }
  
  async initBrowser() {
    // Always create a fresh browser instance for each audit
    if (this.browser) {
      await this.closeBrowser();
    }
    
    console.log('🚀 Launching fresh Puppeteer browser...');
    this.browser = await puppeteer.launch({
      headless: 'new',
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1440,900',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=VizDisplayCompositor',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ]
    });
  }
  
  async closeBrowser() {
    if (this.browser) {
      console.log('🛑 Closing browser...');
      try {
        await this.browser.close();
      } catch (error) {
        console.error('Error closing browser:', error);
      }
      this.browser = null;
    }
  }
  
  async auditUrl(url, index) {
    const startTime = Date.now();
    let attempt = 0;
    let lastError = null;
    
    // Check if lighthouse was imported correctly
    if (typeof lighthouse !== 'function') {
      throw new Error('Lighthouse module is not properly imported');
    }
    
    while (attempt < this.retries) {
      attempt++;
      console.log(`🚦 [${index}] Auditing (attempt ${attempt}/${this.retries}): ${url}`);
      
      try {
        // Get a fresh browser for each attempt
        await this.initBrowser();
        
        // Get browser endpoint
        const browserEndpoint = this.browser.wsEndpoint();
        const port = new URL(browserEndpoint).port;
        
        // Run Lighthouse with clean configuration
        const result = await lighthouse(url, {
          port: parseInt(port),
          output: 'json',
          logLevel: 'error',
          disableStorageReset: false,
          onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
          clearStorage: true
        }, lighthouseConfig);
        
        if (!result || !result.lhr) {
          throw new Error('Lighthouse returned no result');
        }
        
        // Generate filenames
        const baseFilename = createFilename(url, index);
        const jsonFilename = `${baseFilename}.json`;
        const trimmedFilename = `${baseFilename}_trimmed.json`;
        
        // Save full report
        const fullReportPath = path.join(this.reportsDir, jsonFilename);
        await fs.writeJson(fullReportPath, result.lhr, { spaces: 2 });
        
        // Trim and save essential data
        const trimmedReport = trimReport(result.lhr);
        const trimmedReportPath = path.join(this.trimmedDir, trimmedFilename);
        await fs.writeJson(trimmedReportPath, trimmedReport, { spaces: 2 });
        
        const duration = Date.now() - startTime;
        console.log(`  ✅ Success in ${duration}ms: ${jsonFilename}`);
        
        // Safely extract key metrics with error handling
        let metrics = {};
        let scores = {};
        
        try {
          if (result.lhr.audits && result.lhr.audits.metrics && result.lhr.audits.metrics.details && result.lhr.audits.metrics.details.items) {
            metrics = result.lhr.audits.metrics.details.items[0] || {};
          }
          scores = result.lhr.categories || {};
        } catch (metricsError) {
          console.warn('Error extracting metrics:', metricsError.message);
          // Continue with empty metrics rather than failing
        }
        
        const returnData = {
          url: url,
          reportPath: `reports/${jsonFilename}`,
          trimmedPath: `trimmed/${trimmedFilename}`,
          timestamp: new Date().toISOString(),
          duration_ms: duration,
          metrics: {
            performance: scores.performance ? scores.performance.score : 0,
            accessibility: scores.accessibility ? scores.accessibility.score : 0,
            bestPractices: scores['best-practices'] ? scores['best-practices'].score : 0,
            seo: scores.seo ? scores.seo.score : 0,
            firstContentfulPaint: metrics.firstContentfulPaint || 0,
            largestContentfulPaint: metrics.largestContentfulPaint || 0,
            totalBlockingTime: metrics.totalBlockingTime || 0,
            cumulativeLayoutShift: metrics.cumulativeLayoutShift || 0,
            speedIndex: metrics.speedIndex || 0,
            interactive: metrics.interactive || 0
          },
          attempt: attempt
        };
        
        // Close browser after successful audit
        await this.closeBrowser();
        
        return returnData;
        
      } catch (error) {
        lastError = error;
        const duration = Date.now() - startTime;
        console.error(`  ❌ Error (attempt ${attempt}/${this.retries}) after ${duration}ms: ${error.message}`);
        
        // Ensure browser is closed on error
        await this.closeBrowser();
        
        if (attempt < this.retries) {
          // Wait before retry
          console.log(`  ⏳ Waiting before retry...`);
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        }
      }
    }
    
    // All attempts failed
    throw new Error(`Failed to audit ${url} after ${this.retries} attempts: ${lastError.message}`);
  }
}

module.exports = { LighthouseAuditor };