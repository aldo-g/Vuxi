const express = require('express');
const router = express.Router();
const jobManager = require('../lib/jobManager');
const captureService = require('../lib/captureService');

// Start a new capture job
router.post('/capture', async (req, res) => {
  try {
    const { url, options = {} } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Create job
    const job = jobManager.createJob(url, options);
    
    // Start capture process asynchronously (don't await)
    captureService.startCapture(job.id, url, options).catch(error => {
      console.error(`Background job ${job.id} failed:`, error);
    });

    res.status(202).json({
      jobId: job.id,
      status: job.status,
      message: 'Capture job started',
      estimatedDuration: '30-60 seconds'
    });

  } catch (error) {
    console.error('Error starting capture:', error);
    res.status(500).json({ error: 'Failed to start capture job' });
  }
});

// Get job status and results
router.get('/capture/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = jobManager.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Base response
    const response = {
      jobId: job.id,
      status: job.status,
      url: job.url,
      progress: job.progress,
      createdAt: job.createdAt
    };

    // Add results if completed
    if (job.status === 'completed' && job.result) {
      response.result = {
        urls: job.result.urls,
        screenshots: job.result.screenshots,
        stats: job.result.stats
      };
    }

    // Add error if failed
    if (job.status === 'failed') {
      response.error = job.error;
    }

    res.json(response);

  } catch (error) {
    console.error('Error getting job:', error);
    res.status(500).json({ error: 'Failed to get job status' });
  }
});

// Get screenshot file as base64
router.get('/capture/:jobId/screenshot/:filename', async (req, res) => {
  try {
    const { jobId, filename } = req.params;
    
    const job = jobManager.getJob(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const base64Image = await captureService.getScreenshotBase64(jobId, filename);
    
    if (!base64Image) {
      return res.status(404).json({ error: 'Screenshot not found' });
    }

    res.json({ image: base64Image });

  } catch (error) {
    console.error('Error getting screenshot:', error);
    res.status(500).json({ error: 'Failed to get screenshot' });
  }
});

// List all jobs (for debugging)
router.get('/jobs', (req, res) => {
  const jobs = jobManager.getAllJobs().map(job => ({
    jobId: job.id,
    url: job.url,
    status: job.status,
    createdAt: job.createdAt,
    progress: job.progress
  }));
  
  res.json({ jobs });
});

module.exports = router;