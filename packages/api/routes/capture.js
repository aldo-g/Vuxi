const express = require('express');
const router = express.Router();
const { startAnalysis } = require('../lib/analysisService');
const { getJobStatus } = require('../lib/jobManager');
const auth = require('../middleware/auth');

// --- Start a new analysis job ---
router.post('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { ...analysisOptions } = req.body;

    // startAnalysis now returns the created analysisRun object from the database
    const analysisRun = await startAnalysis({ ...analysisOptions, userId });

    // We send the database ID of the analysisRun back to the client as the jobId
    res.status(202).json({ jobId: analysisRun.id, message: 'Analysis job started.' });
  } catch (error) {
    console.error('Failed to start analysis job:', error);
    res.status(500).json({ error: 'Failed to start job.' });
  }
});

// --- Get the status of a job ---
router.get('/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params; // This jobId is the analysisRunId

    // getJobStatus now reads directly from the database
    const jobStatus = await getJobStatus(jobId);

    if (!jobStatus) {
      return res.status(404).json({ error: 'Job not found.' });
    }

    res.status(200).json(jobStatus);
  } catch (error) {
    console.error('Failed to get job status:', error);
    res.status(500).json({ error: 'Failed to retrieve job status.' });
  }
});

module.exports = router;