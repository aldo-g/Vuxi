// scrape+capture/src/services/lighthouse/auditor.js
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
  console.error('[LighthouseAuditor] Error importing lighthouse:', err);
  // To ensure 'lighthouse' is defined even if import fails,
  // allowing the script to proceed to where it checks 'typeof lighthouse'.
  lighthouse = null; 
}

class LighthouseAuditor {
  constructor(options = {}) {
    this.outputDir = options.outputDir;
    this.retries = options.retries || 1;
    this.browser = null;
    
    this.reportsDir = path.join(this.outputDir, 'reports');
    this.trimmedDir = path.join(this.outputDir, 'trimmed');
    
    fs.ensureDirSync(this.reportsDir);
    fs.ensureDirSync(this.trimmedDir);
  }
  
  async initBrowser() {
    if (!this.browser) {
      console.log('[LighthouseAuditor] Launching optimized Lighthouse browser...');
      
      const launchOptions = {
        headless: 'new', // Keep as 'new' for headless, or 'false' for temporary interactive debugging
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
        ],
        dumpio: true // ADD THIS: Pipes browser process stdout/stderr into process.stdout/stderr
      };
      
      if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
      }
      
      try {
        this.browser = await puppeteer.launch(launchOptions);
        console.log('[LighthouseAuditor] Browser launched successfully.');
      } catch (e) {
        console.error('[LighthouseAuditor] Failed to launch browser:', e);
        throw e; // Re-throw to be caught by auditUrl
      }
    }
  }
  
  async closeBrowser() {
    if (this.browser) {
      console.log('[LighthouseAuditor] Closing browser...');
      try {
        await this.browser.close();
        console.log('[LighthouseAuditor] Browser closed successfully.');
      } catch (error) {
        console.error('[LighthouseAuditor] Error closing browser:', error);
      }
      this.browser = null;
    }
  }
  
  async auditUrl(url, index) {
    const startTime = Date.now();
    let attempt = 0;
    let lastError = null;
    
    if (typeof lighthouse !== 'function') {
      console.error('[LighthouseAuditor] Lighthouse module is not properly imported or available.');
      throw new Error('Lighthouse module is not properly imported');
    }
    
    while (attempt <= this.retries) { // Changed from < to <= to allow for the first attempt + retries
      attempt++;
      console.log(`[LighthouseAuditor] Attempt ${attempt}/${this.retries + 1} for URL [${index}]: ${url}`);
      
      try {
        await this.initBrowser(); // Ensures browser is launched
        if (!this.browser) {
          throw new Error("Browser could not be initialized for Lighthouse audit.");
        }
        
        const browserEndpoint = this.browser.wsEndpoint();
        const port = new URL(browserEndpoint).port;
        
        console.log(`[LighthouseAuditor] Starting Lighthouse audit for ${url} on port ${port}...`);
        const result = await lighthouse(url, {
          port: parseInt(port),
          output: 'json',
          logLevel: 'info', // CHANGE THIS to 'info' for more verbose Lighthouse logs
          disableStorageReset: false,
          onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
          clearStorage: true,
          skipAudits: [
            'screenshot-thumbnails', 'final-screenshot', 'full-page-screenshot',
            'largest-contentful-paint-element', 'layout-shift-elements', 'long-tasks',
            'bootup-time', 'uses-long-cache-ttl', 'total-byte-weight',
            'uses-optimized-images', 'uses-webp-images', 'uses-text-compression',
            'unused-css-rules', 'unused-javascript', 'modern-image-formats',
            'uses-rel-preconnect', 'server-response-time', 'redirects',
            'installable-manifest', 'apple-touch-icon', 'splash-screen',
            'themed-omnibox', 'content-width', 'viewport', 'without-javascript'
          ]
        }, lighthouseConfig);
        console.log(`[LighthouseAuditor] Lighthouse audit for ${url} completed.`);
        
        if (!result || !result.lhr) {
          throw new Error('Lighthouse returned no result or LHR object was missing.');
        }
        
        const baseFilename = createFilename(url, index);
        const jsonFilename = `${baseFilename}.json`;
        const trimmedFilename = `${baseFilename}_trimmed.json`;
        
        const fullReportPath = path.join(this.reportsDir, jsonFilename);
        await fs.writeJson(fullReportPath, result.lhr, { spaces: 2 });
        
        const trimmedReport = trimReport(result.lhr);
        const trimmedReportPath = path.join(this.trimmedDir, trimmedFilename);
        await fs.writeJson(trimmedReportPath, trimmedReport, { spaces: 2 });
        
        const duration = Date.now() - startTime;
        console.log(`[LighthouseAuditor] Successfully audited ${url} in ${duration}ms. Report: ${jsonFilename}`);
        
        let metrics = {};
        let scores = {};
        
        try {
          if (result.lhr.audits && result.lhr.audits.metrics && result.lhr.audits.metrics.details && result.lhr.audits.metrics.details.items) {
            metrics = result.lhr.audits.metrics.details.items[0] || {};
          }
          scores = result.lhr.categories || {};
        } catch (metricsError) {
          console.warn('[LighthouseAuditor] Error extracting metrics:', metricsError.message);
        }
        
        return {
          url: url,
          reportPath: `reports/${jsonFilename}`,
          trimmedPath: `trimmed/${trimmedFilename}`,
          timestamp: new Date().toISOString(),
          duration_ms: duration,
          metrics: { /* ... populate metrics ... */ },
          attempt: attempt
        };
        
      } catch (error) {
        lastError = error;
        const duration = Date.now() - startTime;
        console.error(`[LighthouseAuditor] Error during attempt ${attempt} for ${url} (after ${duration}ms):`, error.message);
        // console.error(error.stack); // Optionally log full stack for more details
        
        if (attempt >= this.retries +1) { // If this was the last attempt
             console.error(`[LighthouseAuditor] All ${this.retries + 1} attempts failed for ${url}.`);
             throw lastError; // Re-throw the last error to be caught by LighthouseService/run.js
        }
        console.log(`[LighthouseAuditor] Waiting before retry for ${url}...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // Exponential backoff for retries
      }
    }
    // Should not reach here if retries are handled correctly, but as a fallback:
    throw new Error(`[LighthouseAuditor] Failed to audit ${url} after ${this.retries + 1} attempts: ${lastError?.message || 'Unknown error'}`);
  }
}

module.exports = { LighthouseAuditor };
