// scrape+capture/src/services/screenshot/run.js
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { ScreenshotService } = require('./index');
const fs = require('fs-extra');
const path = require('path');

async function main() {
    const argv = yargs(hideBin(process.argv))
        .option('urlsFile', {
            alias: 'i',
            type: 'string',
            description: 'Path to the JSON file containing an array of URLs to capture',
            demandOption: true,
        })
        .option('outputDir', {
            alias: 'o',
            type: 'string',
            description: 'Directory to save the screenshots and metadata.json',
            demandOption: true,
        })
        .option('viewportWidth', { type: 'number', description: 'Viewport width for screenshots.' })
        .option('viewportHeight', { type: 'number', description: 'Viewport height for screenshots.' })
        .option('timeout', { type: 'number', description: 'Timeout for page load and screenshot capture in milliseconds.' })
        .option('concurrent', { type: 'number', description: 'Number of screenshots to capture concurrently.' })
        .help()
        .argv;

    // Ensure the output directory exists
    await fs.ensureDir(argv.outputDir);

    // Load URLs
    if (!await fs.pathExists(argv.urlsFile)) {
        console.error(`[Screenshot Service Runner] Error: URLs file not found at ${argv.urlsFile}`);
        process.exit(1);
    }
    
    const urlsToCapture = await fs.readJson(argv.urlsFile);
    if (!Array.isArray(urlsToCapture) || urlsToCapture.length === 0) {
        console.error(`[Screenshot Service Runner] Error: No URLs found in ${argv.urlsFile}`);
        process.exit(1);
    }

    // Prepare options for the service
    const serviceOptions = {
        outputDir: argv.outputDir,
        viewport: {
            width: argv.viewportWidth !== undefined ? argv.viewportWidth : 1440,
            height: argv.viewportHeight !== undefined ? argv.viewportHeight : 900,
        },
        timeout: argv.timeout !== undefined ? argv.timeout : 30000,
        concurrent: argv.concurrent !== undefined ? argv.concurrent : 4,
    };

    const service = new ScreenshotService(serviceOptions);

    try {
        console.log(`[Screenshot Service Runner] Starting screenshot capture for ${urlsToCapture.length} URLs`);
        const result = await service.captureAll(urlsToCapture);

        if (result.success || result.successful.length > 0) {
            console.log(`[Screenshot Service Runner] Screenshot capture finished successfully`);
            console.log(`[Screenshot Service Runner] ${result.successful.length} successful, ${result.failed.length} failed`);
        } else {
            console.error('[Screenshot Service Runner] Screenshot capture failed entirely:', result.error);
            process.exit(1);
        }
    } catch (error) {
        console.error('[Screenshot Service Runner] Error running ScreenshotService:', error);
        process.exit(1);
    }
    
    // Force exit to ensure all browser processes are killed
    console.log('[Screenshot Service Runner] Forcing process exit to clean up any remaining browser processes');
    process.exit(0);
}

main();