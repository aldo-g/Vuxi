const { v4: uuidv4 } = require('uuid');

// This is a simple in-memory store. In a real production app, you might use Redis.
const jobs = new Map();

class JobManager {
  createJob() {
    const jobId = uuidv4(); // Generate a unique temporary ID
    const job = {
      id: jobId,
      status: 'queued',
      createdAt: new Date(),
    };
    jobs.set(jobId, job);
    return job;
  }

  updateJob(jobId, updates) {
    if (!jobs.has(jobId)) return;
    const job = jobs.get(jobId);
    Object.assign(job, updates, { updatedAt: new Date() });
    jobs.set(jobId, job);
  }

  getJob(jobId) {
    return jobs.get(jobId);
  }

  removeJob(jobId) {
    jobs.delete(jobId);
  }
}

module.exports = new JobManager();