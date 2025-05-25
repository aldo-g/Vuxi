const { ECSClient, RunTaskCommand } = require('@aws-sdk/client-ecs');

const ecs = new ECSClient({ region: 'eu-west-1' });

exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body || '{}');
        const { url, maxPages = 20, jobId, timeout = 30000, waitTime = 2, excludePatterns = [] } = body;
        
        if (!url) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'URL is required' })
            };
        }
        
        // Generate job ID if not provided
        const finalJobId = jobId || `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const runTaskParams = {
            cluster: 'website-analyzer-cluster',
            taskDefinition: 'url-discovery-task',
            launchType: 'FARGATE',
            networkConfiguration: {
                awsvpcConfiguration: {
                    subnets: ['subnet-075ca3338ffe81720'],
                    securityGroups: ['sg-08141489273f739f9'],
                    assignPublicIp: 'ENABLED'
                }
            },
            overrides: {
                containerOverrides: [{
                    name: 'url-discovery-container',
                    command: [
                        'npm', 'start', '--',
                        '--url', url,
                        '--max-pages', maxPages.toString(),
                        '--timeout', timeout.toString(),
                        '--wait-time', waitTime.toString(),
                        '--output', '/app/data/urls.json',
                        ...excludePatterns.flatMap(pattern => ['--exclude', pattern])
                    ],
                    environment: [
                        { name: 'JOB_ID', value: finalJobId }
                    ]
                }]
            }
        };
        
        const command = new RunTaskCommand(runTaskParams);
        const result = await ecs.send(command);
        
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: true,
                service: 'url-discovery',
                jobId: finalJobId,
                taskArn: result.tasks[0].taskArn,
                estimatedDuration: '2-5 minutes',
                outputs: {
                    urls: `s3://website-analyzer-data/jobs/${finalJobId}/urls/urls.json`,
                    urlsSimple: `s3://website-analyzer-data/jobs/${finalJobId}/urls/urls_simple.json`
                },
                nextSteps: [
                    'Use /screenshots endpoint with this jobId to capture screenshots',
                    'Use /lighthouse endpoint with this jobId to run performance audits'
                ]
            })
        };
        
    } catch (error) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error', message: error.message })
        };
    }
};