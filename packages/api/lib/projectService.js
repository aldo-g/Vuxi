const prisma = require('./prisma'); // This path is CORRECT for a file inside /lib

/**
 * Creates the final Project and AnalysisRun records in the database
 * from a completed preview job.
 * @param {object} previewData - Contains projectName, baseUrl, etc.
 * @param {string} userId - The ID of the authenticated user.
 * @returns The newly created analysisRun record.
 */
async function createProjectFromPreview(previewData, userId) {
  const { projectName, baseUrl, orgName, orgPurpose } = previewData;

  if (!projectName || !baseUrl || !userId) {
    throw new Error('Project details and a user ID are required to create a project.');
  }

  try {
    const project = await prisma.project.upsert({
      where: {
        userId_baseUrl: {
          userId: userId,
          baseUrl: baseUrl,
        },
      },
      update: { name: projectName, orgName, orgPurpose },
      create: { name: projectName, baseUrl, orgName, orgPurpose, userId },
    });

    const analysisRun = await prisma.analysisRun.create({
      data: {
        projectId: project.id,
        status: 'completed',
      },
    });

    console.log(`Successfully committed project. New AnalysisRun ID: ${analysisRun.id}`);
    return analysisRun;

  } catch (error) {
    console.error('Error committing project to database:', error);
    throw error;
  }
}

module.exports = { createProjectFromPreview };