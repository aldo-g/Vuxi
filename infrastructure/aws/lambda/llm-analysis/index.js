const { ECSClient, RunTaskCommand } = require('@aws-sdk/client-ecs');

const ecs = new ECSClient({ region: 'eu-west-1' });

exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body || '{}');
        const { 
            jobId,
            provider = 'anthropic',
            model = 'claude-3-7-sonnet-20250219'
        } = body;
        
        if (!jobId) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ 
                    error: 'jobId is required (must have existing screenshots and lighthouse data)' 
                })
            };
        }
        
        const runTaskParams = {
            cluster: 'website-analyzer-cluster',
            taskDefinition: 'llm-analysis-task',
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
                    name: 'llm-analysis-container',
                    command: [
                        'npm', 'start', '--',
                        '--screenshots', '/app/data/screenshots',
                        '--lighthouse', '/app/data/lighthouse',
                        '--output', '/app/data/analysis',
                        '--provider', provider,
                        '--model', model
                    ],
                    environment: [
                        { name: 'JOB_ID', value: jobId },
                        { name: 'MODEL', value: model }
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
                service: 'llm-analysis',
                jobId: jobId,
                taskArn: result.tasks[0].taskArn,
                configuration: { provider, model },
                estimatedDuration: '3-8 minutes',
                outputs: {
                    analysis: `s3://website-analyzer-data/jobs/${jobId}/analysis/analysis.json`,
                    metadata: `s3://website-analyzer-data/jobs/${jobId}/analysis/analysis-metadata.json`
                },
                nextSteps: [
                    'Use /formatting endpoint to structure the analysis data',
                    'Use /html-reports endpoint to generate final reports'
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