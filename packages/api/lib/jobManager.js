const { v4: uuidv4 } = require('uuid');

const jobs = new Map();

class JobManager {
  createJob() {
    const jobId = uuidv4();
    const job = {
      id: jobId,
      status: 'queued',
      createdAt: new Date(),
    };
    jobs.set(jobId, job);
    return job;
  }

  updateJob(jobId, updates) {
    if (!jobs.has(jobId)) {
        console.error(`[JobManager] Tried to update a job that does not exist: ${jobId}`);
        return;
    }
    const job = jobs.get(jobId);
    Object.assign(job, updates, { updatedAt: new Date() });
    jobs.set(jobId, job);

    // --- ADD THIS LOG ---
    console.log(`[JobManager] Job ${jobId} UPDATED. New status: ${job.status}`);
  }

  getJob(jobId) {
    // --- ADD THIS LOG ---
    console.log(`[JobManager] GETTING job ${jobId}. Current status is: ${jobs.get(jobId)?.status}`);
    
    return jobs.get(jobId);
  }

  removeJob(jobId) {
    console.log(`[JobManager] REMOVING job ${jobId}.`);
    jobs.delete(jobId);
  }
}

module.exports = new JobManager();