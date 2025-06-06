const path = require('path');
const fs = require('fs-extra');
const prisma = require('./prisma');
const { URLDiscoveryService } = require('../../scrape+capture/src/services/url-discovery');
const { ScreenshotService } = require('../../scrape+capture/src/services/screenshot');
const jobManager = require('./jobManager.js');

class CaptureService {
  constructor() {
    this.tempDir = path.join(__dirname, '../temp');
    fs.ensureDirSync(this.tempDir);
  }

  // --- THIS NEW FUNCTION IS ADDED ---
  async getScreenshotBase64(jobId, filename) {
    // Construct the path to the screenshot file in the job's temporary directory
    const screenshotPath = path.join(this.tempDir, String(jobId), 'screenshots', 'desktop', filename);
    
    if (await fs.pathExists(screenshotPath)) {
      const buffer = await fs.readFile(screenshotPath);
      // Return the full data URL prefix which the <img> tag can use directly
      return `data:image/png;base64,${buffer.toString('base64')}`;
    }
    
    console.warn(`[Job ${jobId}] Screenshot not found at path: ${screenshotPath}`);
    return null;
  }

  async startCapture(jobId, url, options = {}) {
    try {
      console.log(`🚀 Starting capture job ${jobId} for ${url}`);
      
      await jobManager.updateJob(jobId, { status: 'running', progress: { stage: 'url-discovery', message: 'Discovering URLs...' } });

      const jobTempDir = path.join(this.tempDir, String(jobId));
      await fs.ensureDir(jobTempDir);

      const urlService = new URLDiscoveryService({ outputDir: jobTempDir, maxUrlsTotal: options.maxUrls });
      const urlResult = await urlService.discover(url);
      if (!urlResult.success) throw new Error(`URL discovery failed: ${urlResult.error}`);
      
      const discoveredUrls = urlResult.urls;
      console.log(`[Job ${jobId}] 📋 Discovered ${discoveredUrls.length} URLs.`);

      await jobManager.updateJob(jobId, { progress: { stage: 'creating-pages', message: 'Saving discovered pages...' } });

      const analyzedPages = await Promise.all(
        discoveredUrls.map(pageUrl =>
          prisma.analyzedPage.create({ data: { runId: jobId, url: pageUrl } })
        )
      );
      console.log(`[Job ${jobId}] 💾 Saved ${analyzedPages.length} page records.`);

      await jobManager.updateJob(jobId, { progress: { stage: 'screenshots', message: `Taking ${analyzedPages.length} screenshots...` } });
      
      const screenshotsDir = path.join(jobTempDir, 'screenshots');
      await fs.ensureDir(screenshotsDir);
      
      const screenshotService = new ScreenshotService({ outputDir: screenshotsDir });
      const screenshotResult = await screenshotService.captureAll(discoveredUrls);
      if (!screenshotResult.success && screenshotResult.successful.length === 0) {
        throw new Error(`Screenshot capture failed: ${screenshotResult.error}`);
      }

      const screenshotRecords = await Promise.all(
        screenshotResult.successful.map(screenshot => {
          const matchingPage = analyzedPages.find(p => p.url === screenshot.data.url);
          if (matchingPage) {
            return prisma.screenshot.create({
              data: {
                analyzedPageId: matchingPage.id,
                storageUrl: screenshot.data.path,
                viewport: 'desktop',
              },
            });
          }
          return null;
        })
      );
      console.log(`[Job ${jobId}] 💾 Saved ${screenshotRecords.filter(Boolean).length} screenshot records.`);
      
      const finalReport = {
        urls: discoveredUrls,
        screenshots: screenshotResult.successful.map(s => ({
            url: s.data.url,
            filename: path.basename(s.data.path),
            path: s.data.path
        })),
        stats: {
          urlsDiscovered: discoveredUrls.length,
          screenshotsSuccessful: screenshotResult.successful.length,
        }
      };

      await jobManager.updateJob(jobId, { 
        status: 'completed',
        progress: { stage: 'completed', message: 'Capture phase completed successfully!' },
        finalReport: finalReport
      });

      console.log(`[Job ${jobId}] ✅ Capture phase completed successfully.`);
      
    } catch (error) {
      console.error(`[Job ${jobId}] ❌ Capture job failed:`, error);
      await jobManager.updateJob(jobId, {
        status: 'failed',
        error: { message: error.message, stack: error.stack },
      });
    }
  }
}

module.exports = new CaptureService();