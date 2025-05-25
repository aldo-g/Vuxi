const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const { ECSClient, DescribeTasksCommand, ListTasksCommand } = require('@aws-sdk/client-ecs');

const s3 = new S3Client({ region: 'eu-west-1' });
const ecs = new ECSClient({ region: 'eu-west-1' });

const BUCKET_NAME = 'website-analyzer-data';
const CLUSTER_NAME = 'website-analyzer-cluster';

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    
    try {
        const jobId = event.pathParameters?.jobId;
        
        if (!jobId) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Job ID is required' })
            };
        }
        
        // Check S3 for job progress
        const s3Status = await checkS3Progress(jobId);
        
        // Check running ECS tasks
        const ecsStatus = await checkECSTasks(jobId);
        
        // Determine overall status
        const status = determineStatus(s3Status, ecsStatus);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                jobId: jobId,
                status: status.status,
                progress: status.progress,
                currentStage: status.currentStage,
                completedStages: status.completedStages,
                estimatedTimeRemaining: status.estimatedTimeRemaining,
                s3Data: s3Status,
                runningTasks: ecsStatus.runningTasks,
                reportUrl: status.status === 'completed' ? 
                    `https://${BUCKET_NAME}.s3.eu-west-1.amazonaws.com/jobs/${jobId}/reports/index.html` : 
                    null,
                lastUpdated: new Date().toISOString()
            })
        };
        
    } catch (error) {
        console.error('Error:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};

async function checkS3Progress(jobId) {
    const stages = {
        urls: false,
        screenshots: false,
        lighthouse: false,
        analysis: false,
        reports: false
    };
    
    try {
        const command = new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            Prefix: `jobs/${jobId}/`
        });
        
        const response = await s3.send(command);
        const objects = response.Contents || [];
        
        // Check for each stage completion
        stages.urls = objects.some(obj => obj.Key.includes('/urls/urls.json'));
        stages.screenshots = objects.some(obj => obj.Key.includes('/screenshots/') && obj.Key.endsWith('.png'));
        stages.lighthouse = objects.some(obj => obj.Key.includes('/lighthouse/lighthouse-summary.json'));
        stages.analysis = objects.some(obj => obj.Key.includes('/analysis/analysis.json'));
        stages.reports = objects.some(obj => obj.Key.includes('/reports/index.html'));
        
        return {
            stages,
            fileCount: objects.length,
            totalSize: objects.reduce((sum, obj) => sum + (obj.Size || 0), 0)
        };
        
    } catch (error) {
        console.error('S3 check error:', error);
        return { stages, error: error.message };
    }
}

async function checkECSTasks(jobId) {
    try {
        const listCommand = new ListTasksCommand({
            cluster: CLUSTER_NAME
        });
        
        const listResponse = await ecs.send(listCommand);
        
        if (!listResponse.taskArns || listResponse.taskArns.length === 0) {
            return { runningTasks: [] };
        }
        
        const describeCommand = new DescribeTasksCommand({
            cluster: CLUSTER_NAME,
            tasks: listResponse.taskArns
        });
        
        const describeResponse = await ecs.send(describeCommand);
        
        // Filter tasks related to this job
        const relevantTasks = describeResponse.tasks?.filter(task => {
            const envVars = task.overrides?.containerOverrides?.[0]?.environment || [];
            return envVars.some(env => env.name === 'JOB_ID' && env.value === jobId);
        }) || [];
        
        return {
            runningTasks: relevantTasks.map(task => ({
                taskArn: task.taskArn,
                taskDefinition: task.taskDefinitionArn?.split('/').pop(),
                lastStatus: task.lastStatus,
                desiredStatus: task.desiredStatus,
                createdAt: task.createdAt,
                startedAt: task.startedAt
            }))
        };
        
    } catch (error) {
        console.error('ECS check error:', error);
        return { runningTasks: [], error: error.message };
    }
}

function determineStatus(s3Status, ecsStatus) {
    const stages = s3Status.stages;
    const runningTasks = ecsStatus.runningTasks || [];
    
    const completedStages = Object.keys(stages).filter(stage => stages[stage]);
    const totalStages = Object.keys(stages).length;
    const progress = Math.round((completedStages.length / totalStages) * 100);
    
    // Determine current stage and status
    if (stages.reports) {
        return {
            status: 'completed',
            progress: 100,
            currentStage: 'completed',
            completedStages,
            estimatedTimeRemaining: '0 minutes'
        };
    }
    
    if (runningTasks.length > 0) {
        const currentTask = runningTasks[0];
        const taskType = currentTask.taskDefinition?.replace('-task', '');
        
        return {
            status: 'running',
            progress,
            currentStage: taskType || 'processing',
            completedStages,
            estimatedTimeRemaining: estimateTimeRemaining(completedStages.length, totalStages)
        };
    }
    
    if (completedStages.length === 0) {
        return {
            status: 'pending',
            progress: 0,
            currentStage: 'starting',
            completedStages,
            estimatedTimeRemaining: '15 minutes'
        };
    }
    
    // Has some completed stages but no running tasks - might be failed or transitioning
    return {
        status: 'error',
        progress,
        currentStage: 'stalled',
        completedStages,
        estimatedTimeRemaining: 'unknown'
    };
}

function estimateTimeRemaining(completed, total) {
    const remainingStages = total - completed;
    const avgTimePerStage = 3; // minutes
    const estimatedMinutes = remainingStages * avgTimePerStage;
    
    if (estimatedMinutes <= 0) return '0 minutes';
    if (estimatedMinutes === 1) return '1 minute';
    return `${estimatedMinutes} minutes`;
}