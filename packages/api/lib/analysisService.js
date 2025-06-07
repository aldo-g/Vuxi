const prisma = require('./prisma');
const captureService = require('./captureService');

async function startAnalysis({
  baseUrl,
  projectName,
  orgName,
  orgPurpose,
  userId,
}) {
  if (!baseUrl || !projectName || !userId) {
    throw new Error('Base URL, project name, and User ID are required.');
  }

  try {
    const project = await prisma.project.upsert({
      where: {
        userId_baseUrl: {
          userId: userId,
          baseUrl: baseUrl,
        },
      },
      update: {
        name: projectName,
        orgName: orgName,
        orgPurpose: orgPurpose,
      },
      create: {
        name: projectName,
        baseUrl,
        orgName,
        orgPurpose,
        userId,
      },
    });

    const analysisRun = await prisma.analysisRun.create({
      data: {
        projectId: project.id,
        status: 'queued',
      },
    });

    const jobId = analysisRun.id;
    console.log(`Created AnalysisRun with ID (jobId): ${jobId}`);

    // UPDATED to call startCapture
    captureService.startCapture(jobId, baseUrl, { maxUrls: 10 })
      .catch(err => {
        console.error(`[Job ${jobId}] A critical error occurred during the background capture task:`, err);
        prisma.analysisRun.update({
            where: { id: jobId },
            data: { status: 'failed' }
        }).catch(console.error);
      });

    return analysisRun;

  } catch (error) {
    console.error('Error in startAnalysis service:', error);
    throw error;
  }
}

module.exports = { startAnalysis };