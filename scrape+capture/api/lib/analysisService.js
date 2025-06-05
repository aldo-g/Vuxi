// aldo-g/web-analysis/Web-analysis-ce47fd73470b9414e2e4feac630ba53f4f991579/scrape+capture/api/lib/analysisService.js
const path = require('path');
const { spawn } = require('child_process');
const jobManager = require('./jobManager');

const NODE_SERVICES_BASE_PATH = path.join(__dirname, '..', '..', 'src', 'services');

class AnalysisService {

  // Helper to run a script and update job progress
  async runScript(jobId, scriptPath, args, stage, startMessage, endMessage) {
    return new Promise((resolve, reject) => {
      jobManager.updateProgress(jobId, { stage: stage, message: startMessage });
      
      console.log(`[${jobId}] Running: node ${scriptPath} ${args.join(' ')}`);
      
      const process = spawn('node', [scriptPath, ...args], { stdio: 'pipe' });

      process.stdout.on('data', (data) => {
        console.log(`[${jobId} - ${stage} stdout]: ${data}`);
      });

      process.stderr.on('data', (data) => {
        console.error(`[${jobId} - ${stage} stderr]: ${data}`);
      });

      process.on('close', (code) => {
        if (code !== 0) {
          const errorMsg = `Stage '${stage}' failed with exit code ${code}.`;
          console.error(`[${jobId}] ${errorMsg}`);
          jobManager.updateJob(jobId, { status: 'failed', error: errorMsg });
          return reject(new Error(errorMsg));
        }
        console.log(`[${jobId}] Stage '${stage}' completed successfully.`);
        jobManager.updateProgress(jobId, { message: endMessage });
        resolve(true);
      });

      process.on('error', (err) => {
        console.error(`[${jobId}] Failed to start stage '${stage}':`, err);
        jobManager.updateJob(jobId, { status: 'failed', error: err.message });
        reject(err);
      });
    });
  }

  async startFullAnalysis(jobId, analysisParams) {
    try {
      const job = jobManager.getJob(jobId);
      if (!job || !job.result?.tempDir) {
        throw new Error('Initial capture job data not found or is incomplete.');
      }

      const { tempDir } = job.result;
      const { orgName, orgType, orgPurpose } = analysisParams;

      // --- Define paths based on the initial capture's temp directory ---
      const urlDiscoveryOutputDir = path.join(tempDir, 'urls');
      const screenshotsOutputDir = path.join(tempDir, 'screenshots');
      const lighthouseOutputDir = path.join(tempDir, 'lighthouse');
      const llmAndFormattingOutputDir = path.join(tempDir, 'llm_analysis_and_formatting');
      
      const discoveredUrlsSimpleFile = path.join(urlDiscoveryOutputDir, 'urls_simple.json');
      const rawLlmAnalysisFile = path.join(llmAndFormattingOutputDir, 'analysis.json');
      const formattedDataFile = path.join(llmAndFormattingOutputDir, 'structured-analysis.json');

      // --- Step 1: Lighthouse Audits ---
      await this.runScript(
        jobId,
        path.join(NODE_SERVICES_BASE_PATH, 'lighthouse', 'run.js'),
        ['--urlsFile', discoveredUrlsSimpleFile, '--outputDir', lighthouseOutputDir],
        'lighthouse-audit',
        'Running Lighthouse audits...',
        'Lighthouse audits complete.'
      );

      // --- Step 2: LLM Analysis ---
      await this.runScript(
        jobId,
        path.join(NODE_SERVICES_BASE_PATH, 'llm-analysis', 'run.js'),
        [
          '--screenshotsDir', path.join(screenshotsOutputDir, 'desktop'),
          '--lighthouseDir', path.join(lighthouseOutputDir, 'trimmed'),
          '--outputDir', llmAndFormattingOutputDir,
          '--orgName', orgName,
          '--orgType', orgType,
          '--orgPurpose', orgPurpose,
        ],
        'llm-analysis',
        'Starting AI analysis...',
        'AI analysis complete. Formatting results...'
      );

      // --- Step 3: Formatting ---
      await this.runScript(
        jobId,
        path.join(NODE_SERVICES_BASE_PATH, 'formatting', 'run.js'),
        [
            '--inputPath', rawLlmAnalysisFile,
            '--outputPath', formattedDataFile,
            '--orgName', orgName,
            '--orgType', orgType,
            '--orgPurpose', orgPurpose,
        ],
        'formatting',
        'Structuring analysis data...',
        'Formatting complete. Generating final report...'
      );

      // --- Step 4: HTML Report Generation ---
      // The output of this step will be the final report, saved into a new directory
      // For simplicity, we'll log its completion, but won't move files here. The client can poll for final status.
      await this.runScript(
        jobId,
        path.join(NODE_SERVICES_BASE_PATH, 'html-report', 'run.js'),
        [
          '--analysisFilePath', formattedDataFile,
          '--outputDir', job.result.tempDir, // Generate report in the job's temp dir
          '--screenshotsDir', screenshotsOutputDir,
        ],
        'html-report',
        'Generating HTML report...',
        'Report generated! Analysis is complete.'
      );

      // Final job update
      jobManager.updateJob(jobId, { status: 'analysis-complete' }); // A new status
      jobManager.updateProgress(jobId, { stage: 'complete', message: 'Full analysis finished.' });

      console.log(`✅ [${jobId}] Full analysis pipeline finished successfully.`);

    } catch (error) {
      console.error(`❌ [${jobId}] Full analysis pipeline failed:`, error);
      jobManager.updateJob(jobId, { status: 'failed', error: error.message });
    }
  }
}

module.exports = new AnalysisService();