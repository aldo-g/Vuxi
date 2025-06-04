const { v4: uuidv4 } = require('uuid');

class JobManager {
  constructor() {
    this.jobs = new Map();
  }

  createJob(url, options = {}) {
    const jobId = uuidv4();
    const job = {
      id: jobId,
      url,
      options,
      status: 'queued',
      createdAt: new Date().toISOString(),
      progress: {
        stage: 'initializing',
        message: 'Job created',
        urlsDiscovered: 0,
        screenshotsTaken: 0,
        totalScreenshots: 0
      },
      result: null,
      error: null
    };

    this.jobs.set(jobId, job);
    return job;
  }

  getJob(jobId) {
    return this.jobs.get(jobId);
  }

  updateJob(jobId, updates) {
    const job = this.jobs.get(jobId);
    if (job) {
      Object.assign(job, updates);
      this.jobs.set(jobId, job);
    }
    return job;
  }

  updateProgress(jobId, progress) {
    const job = this.jobs.get(jobId);
    if (job) {
      job.progress = { ...job.progress, ...progress };
      this.jobs.set(jobId, job);
    }
    return job;
  }

  getAllJobs() {
    return Array.from(this.jobs.values());
  }

  // Clean up old jobs (run periodically)
  cleanupOldJobs(maxAgeHours = 24) {
    const cutoff = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    for (const [jobId, job] of this.jobs.entries()) {
      if (new Date(job.createdAt).getTime() < cutoff) {
        this.jobs.delete(jobId);
      }
    }
  }
}

module.exports = new JobManager();