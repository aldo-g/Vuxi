const { ECSClient, RunTaskCommand } = require('@aws-sdk/client-ecs');

const ecs = new ECSClient({ region: 'eu-west-1' });

exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body || '{}');
        const { 
            jobId, 
            timeout = 30000, 
            viewport = '1440x900', 
            concurrent = 3,
            customUrls = null // Optional: provide URLs directly instead of using jobId
        } = body;
        
        if (!jobId && !customUrls) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ 
                    error: 'Either jobId (to use discovered URLs) or customUrls array is required' 
                })
            };
        }
        
        const finalJobId = jobId || `screenshot-${Date.now()}`;
        
        // If custom URLs provided, we need to create a simple URLs file first
        let command = [];
        let environment = [{ name: 'JOB_ID', value: finalJobId }];
        
        if (customUrls && Array.isArray(customUrls)) {
            // Create URLs in the container at runtime
            command = [
                'sh', '-c', 
                `echo '${JSON.stringify(customUrls)}' > /app/data/urls_simple.json && npm start -- --input /app/data/urls_simple.json --output /app/data/screenshots --timeout ${timeout} --viewport ${viewport} --concurrent ${concurrent}`
            ];
        } else {
            // Use existing URLs from job
            command = [
                'npm', 'start', '--',
                '--input', '/app/data/urls_simple.json',
                '--output', '/app/data/screenshots',
                '--timeout', timeout.toString(),
                '--viewport', viewport,
                '--concurrent', concurrent.toString()
            ];
        }
        
        const runTaskParams = {
            cluster: 'website-analyzer-cluster',
            taskDefinition: 'screenshot-task',
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
                    name: 'screenshot-container',
                    command: command,
                    environment: environment
                }]
            }
        };
        
        const runCommand = new RunTaskCommand(runTaskParams);
        const result = await ecs.send(runCommand);
        
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: true,
                service: 'screenshots',
                jobId: finalJobId,
                taskArn: result.tasks[0].taskArn,
                configuration: { timeout, viewport, concurrent },
                estimatedDuration: customUrls ? `${Math.ceil(customUrls.length / concurrent) * 0.5}-${Math.ceil(customUrls.length / concurrent)} minutes` : '3-8 minutes',
                outputs: {
                    screenshots: `s3://website-analyzer-data/jobs/${finalJobId}/screenshots/`,
                    metadata: `s3://website-analyzer-data/jobs/${finalJobId}/screenshots/metadata.json`
                }
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