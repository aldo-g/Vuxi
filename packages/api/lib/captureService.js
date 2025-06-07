const path = require('path');
const fs = require('fs-extra');
const jobManager = require('./jobManager');
const { URLDiscoveryService } = require('../../scrape+capture/src/services/url-discovery');
const { ScreenshotService } = require('../../scrape+capture/src/services/screenshot');

class CaptureService {
  constructor() {
    // This temp directory will hold our transient screenshots
    this.tempDir = path.join(__dirname, '..', 'temp');
    fs.ensureDirSync(this.tempDir);
  }

  // This function is now perfect for fetching temporary screenshots
  async getScreenshotBase64(jobId, filename) {
    const screenshotPath = path.join(this.tempDir, String(jobId), 'screenshots', 'desktop', filename);
    if (await fs.pathExists(screenshotPath)) {
      const buffer = await fs.readFile(screenshotPath);
      return `data:image/png;base64,${buffer.toString('base64')}`;
    }
    console.warn(`[Temp Job ${jobId}] Screenshot not found: ${screenshotPath}`);
    return null;
  }

  // This no longer interacts with Prisma, only the jobManager
  async startPreviewCapture(jobId, url, options = {}) {
    try {
      console.log(`🚀 Starting PREVIEW capture for temp job ${jobId}`);
      jobManager.updateJob(jobId, { status: 'processing' });

      // Each job gets a unique temporary folder named after its ID
      const jobTempDir = path.join(this.tempDir, String(jobId));
      await fs.ensureDir(jobTempDir);

      const urlService = new URLDiscoveryService({ outputDir: jobTempDir, maxUrlsTotal: options.maxUrls });
      const urlResult = await urlService.discover(url);
      if (!urlResult.success) throw new Error(`URL discovery failed: ${urlResult.error}`);
      
      const discoveredUrls = urlResult.urls;
      console.log(`[Temp Job ${jobId}] 📋 Discovered ${discoveredUrls.length} URLs.`);

      const screenshotsDir = path.join(jobTempDir, 'screenshots');
      const screenshotService = new ScreenshotService({ outputDir: screenshotsDir });
      const screenshotResult = await screenshotService.captureAll(discoveredUrls);
      if (!screenshotResult.success) throw new Error('Screenshot capture failed.');

      const screenshotInfo = screenshotResult.successful.map(s => ({
          url: s.data.url,
          filename: path.basename(s.data.path),
          path: s.data.path,
      }));
      
      jobManager.updateJob(jobId, {
        status: 'screenshots_ready',
        // We store the results in memory for the frontend to fetch
        results: {
          screenshots: screenshotInfo,
        }
      });

      console.log(`[Temp Job ${jobId}] ✅ Preview capture complete. Awaiting user review.`);
      
    } catch (error) {
      console.error(`[Temp Job ${jobId}] ❌ Preview capture failed:`, error);
      jobManager.updateJob(jobId, { status: 'failed' });
    }
  }
}

module.exports = new CaptureService();