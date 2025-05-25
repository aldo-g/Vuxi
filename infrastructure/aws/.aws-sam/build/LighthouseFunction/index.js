const { ECSClient, RunTaskCommand } = require('@aws-sdk/client-ecs');

const ecs = new ECSClient({ region: 'eu-west-1' });

exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body || '{}');
        const { 
            jobId, 
            concurrent = 1, 
            retries = 2,
            customUrls = null
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
        
        const finalJobId = jobId || `lighthouse-${Date.now()}`;
        
        let command = [];
        let environment = [{ name: 'JOB_ID', value: finalJobId }];
        
        if (customUrls && Array.isArray(customUrls)) {
            command = [
                'sh', '-c', 
                `echo '${JSON.stringify(customUrls)}' > /app/data/urls_simple.json && npm start -- --input /app/data/urls_simple.json --output /app/data/lighthouse --concurrent ${concurrent} --retries ${retries}`
            ];
        } else {
            command = [
                'npm', 'start', '--',
                '--input', '/app/data/urls_simple.json',
                '--output', '/app/data/lighthouse',
                '--concurrent', concurrent.toString(),
                '--retries', retries.toString()
            ];
        }
        
        const runTaskParams = {
            cluster: 'website-analyzer-cluster',
            taskDefinition: 'lighthouse-task',
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
                    name: 'lighthouse-container',
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
                service: 'lighthouse',
                jobId: finalJobId,
                taskArn: result.tasks[0].taskArn,
                configuration: { concurrent, retries },
                estimatedDuration: customUrls ? `${customUrls.length * 2}-${customUrls.length * 4} minutes` : '5-15 minutes',
                outputs: {
                    reports: `s3://website-analyzer-data/jobs/${finalJobId}/lighthouse/reports/`,
                    trimmed: `s3://website-analyzer-data/jobs/${finalJobId}/lighthouse/trimmed/`,
                    summary: `s3://website-analyzer-data/jobs/${finalJobId}/lighthouse/lighthouse-summary.json`
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