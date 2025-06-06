const express = require('express');
const router = express.Router();
const jobManager = require('../lib/jobManager.js');
const captureService = require('../lib/captureService.js');
const analysisService = require('../lib/analysisService.js');

// Start a new capture and analysis job
router.post('/capture', async (req, res) => {
  try {
    const { url, options = {} } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    // Create the job record and wait for it
    const job = await jobManager.createJob(url, options);
    
    // Start the long-running capture process in the background
    captureService.startCapture(job.id, url, options).catch(error => {
      console.error(`[Job ${job.id}] Unhandled error in capture pipeline: `, error);
    });

    // Respond immediately that the job has been accepted
    res.status(202).json({
      jobId: job.id,
      status: job.status,
      message: 'Capture job accepted and started.',
    });

  } catch (error) {
    console.error('Error in /capture route:', error);
    res.status(500).json({ error: 'Failed to start capture job.' });
  }
});

// Get job status and results
router.get('/capture/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await jobManager.getJob(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const progress = (job.progress && typeof job.progress === 'string') ? JSON.parse(job.progress) : job.progress;
    
    // Read from job.finalReport, but send it to the frontend as 'result'
    const result = (job.finalReport && typeof job.finalReport === 'string') ? JSON.parse(job.finalReport) : job.finalReport;

    res.json({
      jobId: job.id,
      status: job.status,
      progress: progress,
      createdAt: job.createdAt,
      result: result, // Frontend expects a 'result' key
      error: job.error,
    });

  } catch (error) {
    console.error(`Error getting job ${req.params.jobId}:`, error);
    res.status(500).json({ error: 'Failed to get job status.' });
  }
});

// Get a specific screenshot file as a base64 data URL
router.get('/capture/:jobId/screenshot/:filename', async (req, res) => {
  try {
    const { jobId, filename } = req.params;
    
    const imageBase64DataUrl = await captureService.getScreenshotBase64(jobId, filename);
    
    if (!imageBase64DataUrl) {
      return res.status(404).json({ error: 'Screenshot file not found on server.' });
    }
    
    // The service returns a complete data URL string (e.g., "data:image/png;base64,...")
    res.json({ image: imageBase64DataUrl });

  } catch (error) {
    console.error(`Error getting screenshot ${req.params.filename}:`, error);
    res.status(500).json({ error: 'Failed to get screenshot.' });
  }
});


// Start the full analysis pipeline for a completed capture job
router.post('/analyze/:jobId', async (req, res) => {
  const { jobId } = req.params;
  const { analysisParams } = req.body;
  try {
    const job = await jobManager.getJob(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found.' });
    if (job.status !== 'completed') return res.status(400).json({ error: 'Capture is not yet complete.' });
    if (!analysisParams) return res.status(400).json({ error: 'Analysis parameters are required.' });

    analysisService.startFullAnalysis(job.id, analysisParams).catch(err => {
      console.error(`[Job ${job.id}] Unhandled error in analysis pipeline: `, err);
    });
    res.status(202).json({ message: 'Analysis pipeline started.' });
  } catch (error) {
    console.error(`Error starting analysis for job ${jobId}:`, error);
    res.status(500).json({ error: 'Failed to start analysis job' });
  }
});

// List all jobs (for a future dashboard)
router.get('/jobs', async (req, res) => {
  try {
    const jobs = await jobManager.getAllJobs();
    res.json({ jobs });
  } catch (error) {
    console.error('Error fetching all jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});


module.exports = router;