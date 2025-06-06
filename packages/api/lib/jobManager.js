const prisma = require('./prisma');

class JobManager {
  // Create a new AnalysisRun in the database
  async createJob(url, options = {}) {
    console.log(`[DB] Creating job for URL: ${url}`);
    const user = await prisma.user.upsert({
      where: { email: 'dev@vuxi.com' },
      update: {},
      create: {
        email: 'dev@vuxi.com',
        fullName: 'Dev User',
        passwordHash: 'not-needed-for-demo',
      },
    });

    const project = await prisma.project.upsert({
      where: {
        userId_baseUrl: {
          userId: user.id,
          baseUrl: url,
        },
      },
      update: {},
      create: {
        userId: user.id,
        name: options.orgName || new URL(url).hostname,
        baseUrl: url,
        orgName: options.orgName,
        orgPurpose: options.orgPurpose,
      },
    });

    const analysisRun = await prisma.analysisRun.create({
      data: {
        projectId: project.id,
        status: 'queued',
        progress: {
          stage: 'initializing',
          message: 'Job created',
        },
      },
    });

    console.log(`[DB] Created AnalysisRun with ID: ${analysisRun.id}`);
    return analysisRun;
  }

  // Get an AnalysisRun by its ID
  async getJob(jobId) {
    if (!jobId || isNaN(parseInt(jobId))) return null;
    return prisma.analysisRun.findUnique({
      where: { id: parseInt(jobId) },
    });
  }

  // Update an AnalysisRun
  async updateJob(jobId, updates) {
    if (!jobId || isNaN(parseInt(jobId))) return null;
    
    // Stringify JSON fields before saving
    if (updates.progress) {
      updates.progress = JSON.stringify(updates.progress);
    }
    if (updates.finalReport) {
      updates.finalReport = JSON.stringify(updates.finalReport);
    }
     if (updates.error) {
        updates.error = JSON.stringify(updates.error)
    }

    return prisma.analysisRun.update({
      where: { id: parseInt(jobId) },
      data: updates,
    });
  }
}

module.exports = new JobManager();