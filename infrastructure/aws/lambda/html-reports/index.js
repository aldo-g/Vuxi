const { ECSClient, RunTaskCommand } = require('@aws-sdk/client-ecs');

const ecs = new ECSClient({ region: 'eu-west-1' });

exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body || '{}');
        const { jobId } = body;
        
        if (!jobId) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ 
                    error: 'jobId is required (must have structured-analysis.json and screenshots)' 
                })
            };
        }
        
        const runTaskParams = {
            cluster: 'website-analyzer-cluster',
            taskDefinition: 'html-report-task',
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
                    name: 'html-report-container',
                    command: [
                        'npm', 'start', '--',
                        '--input', '/app/data/analysis/structured-analysis.json',
                        '--screenshots', '/app/data/screenshots',
                        '--output', '/app/data/reports'
                    ],
                    environment: [
                        { name: 'JOB_ID', value: jobId }
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
                service: 'html-reports',
                jobId: jobId,
                taskArn: result.tasks[0].taskArn,
                estimatedDuration: '1-2 minutes',
                outputs: {
                    mainReport: `https://website-analyzer-data.s3.eu-west-1.amazonaws.com/jobs/${jobId}/reports/index.html`,
                    executiveSummary: `https://website-analyzer-data.s3.eu-west-1.amazonaws.com/jobs/${jobId}/reports/executive-summary.html`,
                    technicalSummary: `https://website-analyzer-data.s3.eu-west-1.amazonaws.com/jobs/${jobId}/reports/technical-summary.html`,
                    allReports: `s3://website-analyzer-data/jobs/${jobId}/reports/`
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