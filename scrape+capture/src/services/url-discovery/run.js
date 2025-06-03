// scrape+capture/src/services/url-discovery/run.js
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { URLDiscoveryService } = require('./index');
const fs = require('fs-extra');

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
        .help()
        .argv;

    // Ensure the output directory exists
    await fs.ensureDir(argv.outputDir);

    // Prepare options for the service
    const serviceOptions = {
        outputDir: argv.outputDir,
        maxPages: argv.maxPages !== undefined ? argv.maxPages : 50,
        timeout: argv.timeout !== undefined ? argv.timeout : 8000,
        waitTime: argv.waitTime !== undefined ? argv.waitTime : 0.5,
        concurrency: argv.concurrency !== undefined ? argv.concurrency : 3,
        fastMode: argv.fastMode !== undefined ? argv.fastMode : true,
        enableSimpleFilter: argv.enableSimpleFilter !== undefined ? argv.enableSimpleFilter : false,
        hierarchicalOptions: {
            maxUrlsTotal: argv.maxUrlsTotal !== undefined ? argv.maxUrlsTotal : 10,
        }
    };

    const service = new URLDiscoveryService(serviceOptions);

    try {
        console.log(`[URL Discovery Runner] Starting discovery for: ${argv.targetUrl}`);
        console.log(`[URL Discovery Runner] Output directory: ${argv.outputDir}`);
        
        const result = await service.discover(argv.targetUrl);

        if (result.success) {
            console.log(`[URL Discovery Runner] Discovery successful. URLs saved in ${argv.outputDir}`);
        } else {
            console.error('[URL Discovery Runner] Discovery failed:', result.error);
            process.exit(1);
        }
    } catch (error) {
        console.error('[URL Discovery Runner] Error running URLDiscoveryService:', error);
        process.exit(1);
    }
}

main();