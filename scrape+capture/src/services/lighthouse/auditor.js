const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const { createFilename } = require('./utils');
const { trimReport } = require('./report-trimmer');
const lighthouseConfig = require('./config/lighthouse-config');

let lighthouse;
try {
  const lighthouseModule = require('lighthouse');
  lighthouse = lighthouseModule.default || lighthouseModule;
} catch (err) {
  console.error('Error importing lighthouse:', err);
}

class LighthouseAuditor {
  constructor(options = {}) {
    this.outputDir = options.outputDir;
    this.retries = options.retries || 1;
    this.browser = null;
    
    // Create output directories
    this.reportsDir = path.join(this.outputDir, 'reports');
    this.trimmedDir = path.join(this.outputDir, 'trimmed');
    
    fs.ensureDirSync(this.reportsDir);
    fs.ensureDirSync(this.trimmedDir);
  }
  
  async initBrowser() {
    if (!this.browser) {
      console.log('🚀 Launching optimized Lighthouse browser...');
      
      // Super optimized browser launch
      const launchOptions = {
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=VizDisplayCompositor,TranslateUI,BlinkGenPropertyTrees',
          '--disable-background-networking',
          '--disable-sync',
          '--disable-default-apps',
          '--no-first-run',
          '--disable-extensions',
          '--disable-component-extensions-with-background-pages',
          '--disable-client-side-phishing-detection',
          '--disable-hang-monitor',
          '--disable-popup-blocking',
          '--disable-prompt-on-repost',
          '--disable-background-downloads',
          '--disable-add-to-shelf',
          '--disable-datasaver-prompt',
          '--disable-domain-reliability',
          '--disable-features=AudioServiceOutOfProcess',
          '--aggressive-cache-discard',
          '--memory-pressure-off',
          '--max_old_space_size=4096'
        ]
      };
      
      if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
      }
      
      this.browser = await puppeteer.launch(launchOptions);
    }
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
    
    if (typeof lighthouse !== 'function') {
      throw new Error('Lighthouse module is not properly imported');
    }
    
    while (attempt < this.retries) {
      attempt++;
      console.log(`🚦 [${index}] Auditing: ${url}`);
      
      try {
        await this.initBrowser();
        
        const browserEndpoint = this.browser.wsEndpoint();
        const port = new URL(browserEndpoint).port;
        
        // Ultra-fast Lighthouse configuration
        const result = await lighthouse(url, {
          port: parseInt(port),
          output: 'json',
          logLevel: 'error',
          disableStorageReset: false,
          onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
          clearStorage: true,
          // Maximum speed optimizations
          skipAudits: [
            'screenshot-thumbnails',
            'final-screenshot',
            'full-page-screenshot',
            'largest-contentful-paint-element',
            'layout-shift-elements',
            'long-tasks',
            'bootup-time',
            'uses-long-cache-ttl',
            'total-byte-weight',
            'uses-optimized-images',
            'uses-webp-images',
            'uses-text-compression',
            'unused-css-rules',
            'unused-javascript',
            'modern-image-formats',
            'uses-rel-preconnect',
            'server-response-time',
            'redirects',
            'installable-manifest',
            'apple-touch-icon',
            'splash-screen',
            'themed-omnibox',
            'content-width',
            'viewport',
            'without-javascript'
          ]
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
        
        // Trim and save ultra-minimal essential data
        const trimmedReport = trimReport(result.lhr);
        const trimmedReportPath = path.join(this.trimmedDir, trimmedFilename);
        await fs.writeJson(trimmedReportPath, trimmedReport, { spaces: 2 });
        
        const duration = Date.now() - startTime;
        console.log(`  ✅ Success in ${duration}ms: ${jsonFilename}`);
        
        // Extract metrics with error handling
        let metrics = {};
        let scores = {};
        
        try {
          if (result.lhr.audits && result.lhr.audits.metrics && result.lhr.audits.metrics.details && result.lhr.audits.metrics.details.items) {
            metrics = result.lhr.audits.metrics.details.items[0] || {};
          }
          scores = result.lhr.categories || {};
        } catch (metricsError) {
          console.warn('Error extracting metrics:', metricsError.message);
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
        
        return returnData;
        
      } catch (error) {
        lastError = error;
        const duration = Date.now() - startTime;
        console.error(`  ❌ Error (attempt ${attempt}/${this.retries}) after ${duration}ms: ${error.message}`);
        
        if (attempt < this.retries) {
          console.log(`  ⏳ Waiting before retry...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    throw new Error(`Failed to audit ${url} after ${this.retries} attempts: ${lastError.message}`);
  }
}

module.exports = { LighthouseAuditor };