// scrape+capture/src/services/screenshot/run.js
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { ScreenshotService } = require('./index'); // Assumes index.js exports ScreenshotService
const fs = require('fs-extra');
const path = require('path');

async function main() {
    const argv = yargs(hideBin(process.argv))
        .option('urlsFile', {
            alias: 'i', // input
            type: 'string',
            description: 'Path to the JSON file containing an array of URLs to capture (e.g., urls_simple.json)',
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

    // Ensure the output directory from yargs exists
    await fs.ensureDir(argv.outputDir);
    // The ScreenshotService itself creates a 'desktop' subdirectory, so argv.outputDir is the base for it.

    // Load URLs
    if (!await fs.pathExists(argv.urlsFile)) {
        console.error(`[Screenshot Service Runner] Error: URLs file not found at ${argv.urlsFile}`);
        process.exit(1);
    }
    const urlsToCapture = await fs.readJson(argv.urlsFile);
    if (!Array.isArray(urlsToCapture) || urlsToCapture.length === 0) {
        console.error(`[Screenshot Service Runner] Error: No URLs found in ${argv.urlsFile} or file is not a valid JSON array.`);
        process.exit(1);
    }

    // Prepare options for the service
    const serviceOptions = {
        outputDir: argv.outputDir, // ScreenshotService will create subdirs like 'desktop'
        viewport: {
            width: argv.viewportWidth !== undefined ? argv.viewportWidth : 1440,
            height: argv.viewportHeight !== undefined ? argv.viewportHeight : 900,
        },
        timeout: argv.timeout !== undefined ? argv.timeout : 30000,
        concurrent: argv.concurrent !== undefined ? argv.concurrent : 4,
    };

    const service = new ScreenshotService(serviceOptions);

    try {
        console.log(`[Screenshot Service Runner] Starting screenshot capture for ${urlsToCapture.length} URLs. Output to: ${argv.outputDir}`);
        const result = await service.captureAll(urlsToCapture);

        if (result.success || result.successful.length > 0) { // Consider it a partial success if some screenshots were captured
            console.log(`[Screenshot Service Runner] Screenshot capture finished. ${result.successful.length} successful, ${result.failed.length} failed.`);
            console.log(`[Screenshot Service Runner] Desktop screenshots in: ${path.join(argv.outputDir, 'desktop')}`);
            console.log(`[Screenshot Service Runner] Metadata saved to: ${path.join(argv.outputDir, 'metadata.json')}`);
            if (result.failed.length > 0) {
                 console.warn(`[Screenshot Service Runner] Some screenshots failed. Check metadata.json for details.`);
            }
        } else {
            console.error('[Screenshot Service Runner] Screenshot capture failed entirely:', result.error);
            process.exit(1); // Exit with error code if completely failed
        }
    } catch (error) {
        console.error('[Screenshot Service Runner] Error running ScreenshotService:', error);
        process.exit(1); // Exit with error code
    }
}

main();
