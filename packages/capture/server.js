const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs-extra');
const { URLDiscoveryService } = require('./url-discovery');
const { ScreenshotService } = require('./screenshot');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory job storage (in production, use Redis or database)
const jobs = new Map();

// Job statuses
const JOB_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  URL_DISCOVERY: 'url_discovery',
  SCREENSHOT_CAPTURE: 'screenshot_capture',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

// Helper function to update job status
function updateJobStatus(jobId, status, data = {}) {
  const job = jobs.get(jobId);
  if (job) {
    job.status = status;
    job.updatedAt = new Date().toISOString();
    Object.assign(job, data);
    console.log(`📊 Job ${jobId}: ${status}`);
  }
}

// Create a new capture job
app.post('/api/capture', async (req, res) => {
  try {
    const { baseUrl, options = {} } = req.body;
    
    if (!baseUrl) {
      return res.status(400).json({ error: 'baseUrl is required' });
    }

    const jobId = uuidv4();
    const outputDir = path.join(__dirname, 'data', `job_${jobId}`);
    
    // Create job record
    const job = {
      id: jobId,
      baseUrl,
      options: {
        maxPages: options.maxPages || 20,
        timeout: options.timeout || 8000,
        concurrency: options.concurrency || 3,
        fastMode: options.fastMode !== false,
        outputDir
      },
      status: JOB_STATUS.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      progress: {
        stage: 'initializing',
        percentage: 0,
        message: 'Job created, waiting to start...'
      }
    };
    
    jobs.set(jobId, job);
    
    // Start processing asynchronously
    processJob(jobId).catch(error => {
      console.error(`❌ Job ${jobId} failed:`, error);
      updateJobStatus(jobId, JOB_STATUS.FAILED, {
        error: error.message,
        progress: {
          stage: 'failed',
          percentage: 0,
          message: `Job failed: ${error.message}`
        }
      });
    });
    
    res.json({ jobId, status: job.status });
    
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// Get job status
app.get('/api/capture/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  res.json({
    id: job.id,
    status: job.status,
    progress: job.progress,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    baseUrl: job.baseUrl,
    ...(job.status === JOB_STATUS.COMPLETED && {
      results: job.results
    }),
    ...(job.status === JOB_STATUS.FAILED && {
      error: job.error
    })
  });
});

// Get all jobs (for debugging)
app.get('/api/jobs', (req, res) => {
  const jobList = Array.from(jobs.values()).map(job => ({
    id: job.id,
    status: job.status,
    baseUrl: job.baseUrl,
    createdAt: job.createdAt,
    progress: job.progress
  }));
  
  res.json(jobList);
});

// Serve static files (screenshots, reports)
app.use('/data', express.static(path.join(__dirname, 'data')));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    activeJobs: Array.from(jobs.values()).filter(j => 
      j.status === JOB_STATUS.RUNNING || 
      j.status === JOB_STATUS.URL_DISCOVERY || 
      j.status === JOB_STATUS.SCREENSHOT_CAPTURE
    ).length
  });
});

// Process a job
async function processJob(jobId) {
  const job = jobs.get(jobId);
  if (!job) throw new Error('Job not found');
  
  try {
    updateJobStatus(jobId, JOB_STATUS.RUNNING, {
      progress: {
        stage: 'starting',
        percentage: 5,
        message: 'Starting analysis...'
      }
    });
    
    await fs.ensureDir(job.options.outputDir);
    
    // Phase 1: URL Discovery
    updateJobStatus(jobId, JOB_STATUS.URL_DISCOVERY, {
      progress: {
        stage: 'url_discovery',
        percentage: 10,
        message: 'Discovering URLs...'
      }
    });
    
    const urlService = new URLDiscoveryService({
      ...job.options,
      outputDir: job.options.outputDir
    });
    
    const urlResult = await urlService.discover(job.baseUrl);
    
    if (!urlResult.success) {
      throw new Error(`URL discovery failed: ${urlResult.error}`);
    }
    
    updateJobStatus(jobId, JOB_STATUS.URL_DISCOVERY, {
      progress: {
        stage: 'url_discovery_complete',
        percentage: 40,
        message: `Found ${urlResult.urls.length} URLs`
      },
      urlDiscovery: {
        urlCount: urlResult.urls.length,
        stats: urlResult.stats
      }
    });
    
    // Phase 2: Screenshot Capture
    updateJobStatus(jobId, JOB_STATUS.SCREENSHOT_CAPTURE, {
      progress: {
        stage: 'screenshot_capture',
        percentage: 45,
        message: 'Capturing screenshots...'
      }
    });
    
    const screenshotService = new ScreenshotService({
      outputDir: path.join(job.options.outputDir, 'screenshots'),
      concurrent: job.options.concurrency || 4,
      timeout: job.options.timeout || 30000
    });
    
    const screenshotResult = await screenshotService.captureAll(urlResult.urls);
    
    if (!screenshotResult.success) {
      throw new Error(`Screenshot capture failed: ${screenshotResult.error}`);
    }
    
    // Job completed successfully
    const results = {
      urls: urlResult.urls,
      screenshots: screenshotResult.successful,
      stats: {
        urlDiscovery: urlResult.stats,
        screenshots: screenshotResult.stats
      },
      files: {
        urls: urlResult.files,
        screenshots: screenshotResult.files
      },
      outputDir: job.options.outputDir
    };
    
    updateJobStatus(jobId, JOB_STATUS.COMPLETED, {
      results,
      progress: {
        stage: 'completed',
        percentage: 100,
        message: `Analysis complete! Captured ${screenshotResult.successful.length} screenshots from ${urlResult.urls.length} URLs`
      }
    });
    
  } catch (error) {
    console.error(`Job ${jobId} failed:`, error);
    updateJobStatus(jobId, JOB_STATUS.FAILED, {
      error: error.message,
      progress: {
        stage: 'failed',
        percentage: 0,
        message: `Job failed: ${error.message}`
      }
    });
    throw error;
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Capture Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📝 API docs: http://localhost:${PORT}/api/jobs`);
});

module.exports = app;