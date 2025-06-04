const path = require('path');
const fs = require('fs-extra');
const { URLDiscoveryService } = require('../../src/services/url-discovery');
const { ScreenshotService } = require('../../src/services/screenshot');
const jobManager = require('./jobManager');

class CaptureService {
  constructor() {
    this.tempDir = path.join(__dirname, '../temp');
    fs.ensureDirSync(this.tempDir);
  }

  async startCapture(jobId, url, options = {}) {
    try {
      console.log(`🚀 Starting capture job ${jobId} for ${url}`);
      
      // Update job status
      jobManager.updateJob(jobId, { status: 'running' });
      jobManager.updateProgress(jobId, {
        stage: 'url-discovery',
        message: 'Discovering URLs...'
      });

      // Create temporary directories for this job
      const jobTempDir = path.join(this.tempDir, jobId);
      const urlsDir = path.join(jobTempDir, 'urls');
      const screenshotsDir = path.join(jobTempDir, 'screenshots');
      
      await fs.ensureDir(urlsDir);
      await fs.ensureDir(screenshotsDir);

      // Step 1: URL Discovery
      const urlService = new URLDiscoveryService({
        outputDir: urlsDir,
        maxPages: options.maxPages || 50,
        maxUrlsTotal: options.maxUrls || 10,
        timeout: options.timeout || 8000,
        fastMode: options.fastMode !== false,
        concurrency: options.concurrency || 3
      });

      const urlResult = await urlService.discover(url);
      
      if (!urlResult.success) {
        throw new Error(`URL discovery failed: ${urlResult.error}`);
      }

      const urls = urlResult.urls;
      console.log(`📋 Discovered ${urls.length} URLs for job ${jobId}`);

      jobManager.updateProgress(jobId, {
        stage: 'screenshots',
        message: `Taking screenshots of ${urls.length} pages...`,
        urlsDiscovered: urls.length,
        totalScreenshots: urls.length
      });

      // Step 2: Screenshot Capture
      const screenshotService = new ScreenshotService({
        outputDir: screenshotsDir,
        viewport: {
          width: options.viewportWidth || 1440,
          height: options.viewportHeight || 900
        },
        timeout: options.screenshotTimeout || 30000,
        concurrent: options.screenshotConcurrency || 4
      });

      const screenshotResult = await screenshotService.captureAll(urls);

      if (!screenshotResult.success && screenshotResult.successful.length === 0) {
        throw new Error(`Screenshot capture failed: ${screenshotResult.error}`);
      }

      // Prepare result data
      const result = {
        urls: urls,
        screenshots: screenshotResult.successful.map(screenshot => ({
          url: screenshot.data.url,
          filename: screenshot.data.filename,
          path: screenshot.data.path,
          timestamp: screenshot.data.timestamp
        })),
        stats: {
          urlsDiscovered: urls.length,
          screenshotsSuccessful: screenshotResult.successful.length,
          screenshotsFailed: screenshotResult.failed.length,
          totalDuration: Date.now() - new Date(jobManager.getJob(jobId).createdAt).getTime()
        },
        tempDir: jobTempDir
      };

      // Update job as completed
      jobManager.updateJob(jobId, {
        status: 'completed',
        result: result,
        completedAt: new Date().toISOString()
      });

      jobManager.updateProgress(jobId, {
        stage: 'completed',
        message: `Completed! ${result.screenshots.length} screenshots taken`,
        screenshotsTaken: result.screenshots.length
      });

      console.log(`✅ Completed capture job ${jobId}`);
      return result;

    } catch (error) {
      console.error(`❌ Capture job ${jobId} failed:`, error);
      
      jobManager.updateJob(jobId, {
        status: 'failed',
        error: error.message,
        failedAt: new Date().toISOString()
      });

      jobManager.updateProgress(jobId, {
        stage: 'failed',
        message: `Failed: ${error.message}`
      });

      throw error;
    }
  }

  // Get screenshot file as base64 (for API response)
  async getScreenshotBase64(jobId, filename) {
    const jobTempDir = path.join(this.tempDir, jobId);
    const screenshotPath = path.join(jobTempDir, 'screenshots', 'desktop', filename);
    
    if (await fs.pathExists(screenshotPath)) {
      const buffer = await fs.readFile(screenshotPath);
      return `data:image/png;base64,${buffer.toString('base64')}`;
    }
    
    return null;
  }

  // Clean up job files
  async cleanupJob(jobId) {
    const jobTempDir = path.join(this.tempDir, jobId);
    if (await fs.pathExists(jobTempDir)) {
      await fs.remove(jobTempDir);
    }
  }
}

module.exports = new CaptureService();