const { ECSClient, RunTaskCommand } = require('@aws-sdk/client-ecs');

const ecs = new ECSClient({ region: 'eu-west-1' });

exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body || '{}');
        const { 
            jobId,
            model = 'claude-3-7-sonnet-20250219'
        } = body;
        
        if (!jobId) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ 
                    error: 'jobId is required (must have existing analysis.json)' 
                })
            };
        }
        
        const runTaskParams = {
            cluster: 'website-analyzer-cluster',
            taskDefinition: 'formatting-task',
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
                    name: 'formatting-container',
                    command: [
                        'npm', 'start', '--',
                        '--input', '/app/data/analysis/analysis.json',
                        '--output', '/app/data/analysis/structured-analysis.json',
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
                service: 'formatting',
                jobId: jobId,
                taskArn: result.tasks[0].taskArn,
                configuration: { model },
                estimatedDuration: '1-2 minutes',
                outputs: {
                    structuredAnalysis: `s3://website-analyzer-data/jobs/${jobId}/analysis/structured-analysis.json`
                },
                nextSteps: [
                    'Use /html-reports endpoint to generate final HTML reports'
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