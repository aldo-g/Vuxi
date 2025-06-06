const { spawn } = require('child_process');
const path = require('path');
const prisma = require('./prisma');

async function startAnalysis({
  baseUrl,
  projectName,
  orgName,
  orgPurpose,
  userId,
}) {
  if (!baseUrl || !projectName) {
    throw new Error('Base URL and project name are required.');
  }
  if (!userId) {
    throw new Error('User ID is required to start an analysis.');
  }

  try {
    // Use `upsert` to find an existing project or create a new one.
    // This prevents the unique constraint error.
    const project = await prisma.project.upsert({
      where: {
        // This syntax targets the composite unique key
        userId_baseUrl: {
          userId: userId,
          baseUrl: baseUrl,
        },
      },
      // If the project exists, you can optionally update its details
      update: {
        name: projectName,
        orgName: orgName,
        orgPurpose: orgPurpose,
      },
      // If the project does not exist, create it
      create: {
        name: projectName,
        baseUrl,
        orgName,
        orgPurpose,
        userId,
      },
    });

    // Create a new AnalysisRun for this project
    const analysisRun = await prisma.analysisRun.create({
        data: {
            projectId: project.id,
            status: 'queued',
        }
    });

    // Spawn the background script to perform the analysis
    const scriptPath = path.join(__dirname, '..', '..', 'scrape+capture', 'src', 'batch_analyzer.js');
    const args = [
        '--runId', analysisRun.id,
        '--preset', 'default'
    ];

    const child = spawn('node', [scriptPath, ...args], {
        detached: true,
        stdio: 'ignore',
    });
    child.unref();

    console.log(`Started analysis for runId: ${analysisRun.id} with PID: ${child.pid}`);
    
    // Return the analysisRun object; its ID is used as the jobId
    return analysisRun;

  } catch (error) {
    console.error('Error in analysis process:', error);
    throw error;
  }
}

module.exports = { startAnalysis };