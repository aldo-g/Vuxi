const express = require('express');
const router = express.Router();
const jobManager = require('../lib/jobManager');
const captureService = require('../lib/captureService');
const analysisService = require('../lib/projectService'); // We still need this for the final commit
const auth = require('../middleware/auth');
const path = require('path');
const fs = require('fs-extra');


// --- 1. START A NEW PREVIEW JOB ---
router.post('/preview', auth, (req, res) => {
  try {
    const { baseUrl } = req.body;
    if (!baseUrl) {
      return res.status(400).json({ error: 'baseUrl is required.' });
    }
    const job = jobManager.createJob();
    captureService.startPreviewCapture(job.id, baseUrl, { maxUrls: 10 });
    res.status(202).json({ jobId: job.id, message: 'Preview job started.' });
  } catch (error) {
    console.error('Failed to start preview job:', error);
    res.status(500).json({ error: 'Failed to start preview job.' });
  }
});


// --- 2. GET THE STATUS OF A PREVIEW JOB ---
router.get('/preview/status/:jobId', auth, (req, res) => {
  // --- ADDED THIS FINAL DEBUGGING LOG ---
  console.log(`[Status Route] Request received for Job ID: ${req.params.jobId}`);
  
  const { jobId } = req.params;
  const job = jobManager.getJob(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Preview job not found.' });
  }
  
  return res.status(200).json(job);
});


// --- 3. COMMIT THE PREVIEWED JOB TO THE DATABASE ---
router.post('/commit', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    // The frontend must now send the temp jobId and the original form data
    const { tempJobId, projectName, baseUrl, orgName, orgPurpose } = req.body;

    const tempJob = jobManager.getJob(tempJobId);
    if (!tempJob || tempJob.status !== 'screenshots_ready') {
      return res.status(400).json({ error: 'Invalid or incomplete job ID.' });
    }

    // This is where we finally call the original analysisService to create the DB records
    const analysisRun = await analysisService.startAnalysis({
      projectName,
      baseUrl,
      orgName,
      orgPurpose,
      userId
    });

    // Optional: Move screenshots from the temp folder to a permanent location
    const tempPath = path.join(__dirname, '..', 'temp', tempJobId);
    // You would define a permanent path, perhaps using the new analysisRun.id
    // const permanentPath = path.join(__dirname, '..', 'analysis_runs', String(analysisRun.id));
    // await fs.move(tempPath, permanentPath);

    // Clean up the in-memory job
    jobManager.removeJob(tempJobId);

    res.status(201).json({ 
      finalJobId: analysisRun.id, 
      message: 'Project has been successfully created.' 
    });

  } catch (error) {
    console.error('Failed to commit project:', error);
    res.status(500).json({ error: 'Failed to commit project.' });
  }
});


// This route for fetching screenshot images remains largely the same
router.get('/:jobId/screenshot/:filename', auth, async (req, res) => {
  try {
      const { jobId, filename } = req.params;
      const imageBase64 = await captureService.getScreenshotBase64(jobId, filename);
      if (!imageBase64) {
          return res.status(404).json({ error: 'Screenshot not found.' });
      }
      res.status(200).json({ image: imageBase64 });
  } catch (error) {
      console.error('Failed to retrieve screenshot:', error);
      res.status(500).json({ error: 'Failed to retrieve screenshot.' });
  }
});

module.exports = router;