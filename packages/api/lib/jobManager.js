const prisma = require('./prisma');

/**
 * Fetches the status of an analysis run directly from the database.
 * @param {string} analysisRunId - The ID of the analysis run to check.
 * @returns {Promise<object|null>} The status object or null if not found.
 */
async function getJobStatus(analysisRunId) {
    try {
        // The ID from the URL is a string, so we need to parse it to an integer
        const runId = parseInt(analysisRunId, 10);
        if (isNaN(runId)) {
            return null; // Invalid ID format
        }

        const analysisRun = await prisma.analysisRun.findUnique({
            where: { id: runId },
        });

        if (!analysisRun) {
            return null; // Job not found in the database
        }

        return {
            status: analysisRun.status,
            progress: analysisRun.progress || 0,
            message: `Processing analysis run ${analysisRunId}`,
            analysisRunId: analysisRun.id
        };
    } catch (error) {
        console.error(`Error fetching status for run ${analysisRunId}:`, error);
        return null;
    }
}

// The createJob and getJob functions are no longer needed
// as we are now persisting the job state in the database.
module.exports = { getJobStatus };