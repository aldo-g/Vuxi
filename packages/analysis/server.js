const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs-extra');

// Load environment variables from root .env file
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const app = express();
const PORT = process.env.ANALYSIS_PORT || 3002;

// Import analysis function
const { analysis } = require('./index');

// Middleware
app.use(cors());
app.use(express.json());

// In-memory job storage (in production, use Redis or database)
const analysisJobs = new Map();

// Job statuses
const JOB_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  LIGHTHOUSE: 'lighthouse',
  LLM_ANALYSIS: 'llm_analysis',
  FORMATTING: 'formatting',
  REPORT_GENERATION: 'report_generation',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

// Helper function to update job status
function updateJobStatus(jobId, status, data = {}) {
  const job = analysisJobs.get(jobId);
  if (job) {
    job.status = status;
    job.updatedAt = new Date().toISOString();
    Object.assign(job, data);
    console.log(`📊 Analysis Job ${jobId.slice(0,8)}: ${status} - ${data.progress?.message || ''}`);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'vuxi-analysis-service',
    version: '1.0.0',
    activeJobs: Array.from(analysisJobs.values()).filter(j => 
      j.status === JOB_STATUS.RUNNING || 
      j.status === JOB_STATUS.LIGHTHOUSE || 
      j.status === JOB_STATUS.LLM_ANALYSIS ||
      j.status === JOB_STATUS.FORMATTING ||
      j.status === JOB_STATUS.REPORT_GENERATION
    ).length
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Vuxi Analysis Service',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      startAnalysis: 'POST /api/analysis',
      getAnalysisStatus: 'GET /api/analysis/:jobId',
      getAllJobs: 'GET /api/jobs'
    }
  });
});

// Start analysis endpoint
app.post('/api/analysis', async (req, res) => {
  try {
    const { analysisData, captureJobId } = req.body;

    // Validate input
    if (!analysisData || !captureJobId) {
      return res.status(400).json({
        error: 'Missing required fields: analysisData and captureJobId'
      });
    }

    if (!analysisData.websiteUrl || !analysisData.organizationName || !analysisData.sitePurpose) {
      return res.status(400).json({
        error: 'Missing required analysis data fields'
      });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({
        error: 'ANTHROPIC_API_KEY not configured'
      });
    }

    // Create job
    const jobId = uuidv4();
    const job = {
      id: jobId,
      captureJobId,
      status: JOB_STATUS.PENDING,
      progress: {
        stage: 'initializing',
        percentage: 0,
        message: 'Starting analysis...'
      },
      analysisData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    analysisJobs.set(jobId, job);

    // Start processing (don't await)
    processAnalysis(jobId).catch(error => {
      console.error(`Analysis job ${jobId} failed:`, error);
      updateJobStatus(jobId, JOB_STATUS.FAILED, {
        error: error.message,
        progress: {
          stage: 'failed',
          percentage: 0,
          message: `Analysis failed: ${error.message}`
        }
      });
    });

    res.json({
      success: true,
      jobId,
      status: JOB_STATUS.PENDING,
      message: 'Analysis job started'
    });

  } catch (error) {
    console.error('Failed to start analysis:', error);
    res.status(500).json({ error: 'Failed to start analysis' });
  }
});

// Get analysis status
app.get('/api/analysis/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = analysisJobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json({
    id: job.id,
    status: job.status,
    progress: job.progress,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
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
  const jobList = Array.from(analysisJobs.values()).map(job => ({
    id: job.id,
    status: job.status,
    createdAt: job.createdAt,
    progress: job.progress,
    analysisData: {
      websiteUrl: job.analysisData?.websiteUrl,
      organizationName: job.analysisData?.organizationName
    }
  }));
  
  res.json(jobList);
});

// Main analysis processing function
async function processAnalysis(jobId) {
  const job = analysisJobs.get(jobId);
  if (!job) throw new Error('Job not found');

  console.log(`🔬 Starting analysis processing: ${jobId.slice(0, 8)}`);

  try {
    // Update status to running
    updateJobStatus(jobId, JOB_STATUS.RUNNING, {
      progress: {
        stage: 'preparing',
        percentage: 10,
        message: 'Preparing analysis data...'
      }
    });

    // Extract URLs from screenshots
    const { analysisData } = job;
    const screenshots = analysisData.screenshots || [];
    const urls = screenshots
      .filter(s => s.success && s.url && s.url.startsWith('http'))
      .map(s => s.url);

    if (urls.length === 0) {
      urls.push(analysisData.websiteUrl);
    }

    console.log(`🔍 Analyzing URLs: ${urls.join(', ')}`);

    updateJobStatus(jobId, JOB_STATUS.LIGHTHOUSE, {
      progress: {
        stage: 'lighthouse',
        percentage: 25,
        message: 'Running Lighthouse audits...'
      }
    });

    updateJobStatus(jobId, JOB_STATUS.LLM_ANALYSIS, {
      progress: {
        stage: 'llm_analysis',
        percentage: 50,
        message: 'Analyzing with AI...'
      }
    });

    updateJobStatus(jobId, JOB_STATUS.FORMATTING, {
      progress: {
        stage: 'formatting',
        percentage: 75,
        message: 'Formatting results...'
      }
    });

    updateJobStatus(jobId, JOB_STATUS.REPORT_GENERATION, {
      progress: {
        stage: 'report_generation',
        percentage: 90,
        message: 'Generating reports...'
      }
    });

    // Run the actual analysis
    const analysisInput = {
      urls: urls,
      organizationName: analysisData.organizationName,
      organizationType: 'organization',
      organizationPurpose: analysisData.sitePurpose
    };

    console.log('🔬 Running analysis with:', analysisInput);
    const result = await analysis(analysisInput);

    if (result.success) {
      updateJobStatus(jobId, JOB_STATUS.COMPLETED, {
        results: {
          reportPath: result.reportPath,
          lighthouse: result.lighthouse,
          llmAnalysis: result.llmAnalysis,
          formatting: result.formatting,
          htmlReport: result.htmlReport
        },
        progress: {
          stage: 'completed',
          percentage: 100,
          message: 'Analysis completed successfully!'
        }
      });
    } else {
      throw new Error(result.error || 'Analysis failed');
    }

  } catch (error) {
    console.error(`❌ Analysis job ${jobId.slice(0, 8)} failed:`, error);
    updateJobStatus(jobId, JOB_STATUS.FAILED, {
      error: error.message,
      progress: {
        stage: 'failed',
        percentage: 0,
        message: `Analysis failed: ${error.message}`
      }
    });
    throw error;
  }
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🔬 Analysis Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📝 API docs: http://localhost:${PORT}/api/jobs`);
  console.log(`🏠 Root endpoint: http://localhost:${PORT}/`);
  
  // Check required environment variables
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('⚠️  WARNING: ANTHROPIC_API_KEY not set in environment variables');
  } else {
    console.log('✅ ANTHROPIC_API_KEY configured');
  }
});

module.exports = app;