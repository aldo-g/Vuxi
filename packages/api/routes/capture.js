const express = require('express');
const router = express.Router();
const jobManager = require('../lib/jobManager');
const captureService = require('../lib/captureService');
// Use our new, clearly named service for the final commit step
const { createProjectFromPreview } = require('../lib/projectService'); 
const auth = require('../middleware/auth');

// --- 1. START A NEW PREVIEW JOB (NO DB) ---
router.post('/preview', auth, (req, res) => {
  // ... (This route remains unchanged)
});

// --- 2. GET THE STATUS OF A PREVIEW JOB ---
router.get('/preview/status/:jobId', auth, (req, res) => {
  // ... (This route remains unchanged)
});

// --- 3. COMMIT THE PREVIEWED JOB TO THE DATABASE ---
router.post('/commit', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { tempJobId, ...projectData } = req.body; // Separate the temp ID from the rest of the form data

    const tempJob = jobManager.getJob(tempJobId);
    if (!tempJob || tempJob.status !== 'screenshots_ready') {
      return res.status(400).json({ error: 'Invalid or incomplete preview job.' });
    }

    // Call our new, specific function to write to the database
    const analysisRun = await createProjectFromPreview(projectData, userId);

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