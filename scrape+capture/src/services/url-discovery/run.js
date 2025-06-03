// scrape+capture/src/services/url-discovery/run.js
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { URLDiscoveryService } = require('./index'); // Assumes index.js exports URLDiscoveryService
const fs = require('fs-extra'); // For fs.ensureDir

async function main() {
    const argv = yargs(hideBin(process.argv))
        .option('targetUrl', {
            alias: 'u',
            type: 'string',
            description: 'Target URL to start crawling',
            demandOption: true,
        })
        .option('outputDir', {
            alias: 'o',
            type: 'string',
            description: 'Directory to save the discovered URLs JSON files',
            demandOption: true,
        })
        .option('maxPages', { type: 'number', description: 'Maximum pages to crawl.' })
        .option('timeout', { type: 'number', description: 'Timeout per page in milliseconds.' })
        .option('waitTime', { type: 'number', description: 'Wait time on page after load in seconds.' })
        .option('concurrency', { type: 'number', description: 'Number of pages to process simultaneously.' })
        .option('fastMode', { type: 'boolean', description: 'Enable all optimizations for speed.' })
        .option('enableSimpleFilter', { type: 'boolean', description: 'Enable simple aggressive URL filtering.'})
        .option('maxUrlsTotal', { type: 'number', description: 'Hard limit on total URLs if simple filter is used.'})
        // Add other options from ANALYSIS_OPTIONS that URLDiscoveryService might accept
        .help()
        .argv;

    // Ensure the output directory from yargs exists
    await fs.ensureDir(argv.outputDir);

    // Prepare options for the service, defaulting if not provided by CLI
    const serviceOptions = {
        outputDir: argv.outputDir,
        maxPages: argv.maxPages !== undefined ? argv.maxPages : 50,
        timeout: argv.timeout !== undefined ? argv.timeout : 8000,
        waitTime: argv.waitTime !== undefined ? argv.waitTime : 0.5,
        concurrency: argv.concurrency !== undefined ? argv.concurrency : 3,
        fastMode: argv.fastMode !== undefined ? argv.fastMode : true,
        // Options for hierarchical/simple filtering
        enableSimpleFilter: argv.enableSimpleFilter !== undefined ? argv.enableSimpleFilter : false,
        hierarchicalOptions: { // Pass relevant filtering options
            maxUrlsTotal: argv.maxUrlsTotal !== undefined ? argv.maxUrlsTotal : 10,
            // You can add more hierarchicalOptions here if your service supports them
            // e.g., samplesPerCategory, maxDepth
        }
        // excludePatterns: if you want to pass this via CLI
    };

    const service = new URLDiscoveryService(serviceOptions);

    try {
        console.log(`https://docs.aws.amazon.com/application-discovery/latest/userguide/discovery-agent.html Starting discovery for: ${argv.targetUrl} into ${argv.outputDir}`);
        const result = await service.discover(argv.targetUrl);

        if (result.success) {
            console.log(`https://docs.aws.amazon.com/application-discovery/latest/userguide/discovery-agent.html Discovery successful. URLs saved in ${argv.outputDir}`);
            // The service.discover method already saves urls.json and urls_simple.json
        } else {
            console.error('https://docs.aws.amazon.com/application-discovery/latest/userguide/discovery-agent.html Discovery failed:', result.error);
            process.exit(1); // Exit with error code
        }
    } catch (error) {
        console.error('https://docs.aws.amazon.com/application-discovery/latest/userguide/discovery-agent.html Error running URLDiscoveryService:', error);
        process.exit(1); // Exit with error code
    }
}

main();
