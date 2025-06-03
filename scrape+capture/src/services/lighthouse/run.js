// scrape+capture/src/services/lighthouse/run.js
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const fs = require('fs-extra');
const path = require('path');

console.log('[Lighthouse Service Runner] Starting script...');

async function main() {
    console.log('[Lighthouse Service Runner] Parsing arguments...');
    
    const argv = yargs(hideBin(process.argv))
        .option('urlsFile', {
            alias: 'i',
            type: 'string',
            description: 'Path to the JSON file containing an array of URLs to audit',
            demandOption: true,
        })
        .option('outputDir', {
            alias: 'o',
            type: 'string',
            description: 'Directory to save the Lighthouse reports',
            demandOption: true,
        })
        .option('retries', {
            type: 'number',
            description: 'Number of retries for failed audits.',
            default: 1,
        })
        .help()
        .argv;

    console.log(`[Lighthouse Service Runner] Arguments parsed successfully`);
    console.log(`[Lighthouse Service Runner] URLs file: ${argv.urlsFile}`);
    console.log(`[Lighthouse Service Runner] Output directory: ${argv.outputDir}`);

    try {
        // Check if lighthouse module is available
        console.log('[Lighthouse Service Runner] Checking lighthouse module...');
        require('lighthouse');
        console.log('[Lighthouse Service Runner] Lighthouse module found');
    } catch (error) {
        console.error('[Lighthouse Service Runner] Lighthouse module not found:', error.message);
        console.error('[Lighthouse Service Runner] Please install lighthouse: npm install lighthouse');
        process.exit(1);
    }

    try {
        await fs.ensureDir(argv.outputDir);
        console.log(`[Lighthouse Service Runner] Output directory ensured: ${argv.outputDir}`);
    } catch (error) {
        console.error('[Lighthouse Service Runner] Failed to create output directory:', error);
        process.exit(1);
    }

    if (!await fs.pathExists(argv.urlsFile)) {
        console.error(`[Lighthouse Service Runner] Error: URLs file not found at ${argv.urlsFile}`);
        process.exit(1);
    }

    console.log('[Lighthouse Service Runner] Reading URLs file...');
    const urlsToAudit = await fs.readJson(argv.urlsFile);

    if (!Array.isArray(urlsToAudit) || urlsToAudit.length === 0) {
        console.error(`[Lighthouse Service Runner] Error: No URLs found in ${argv.urlsFile}`);
        process.exit(1);
    }

    console.log(`[Lighthouse Service Runner] Loaded ${urlsToAudit.length} URLs to audit`);

    // Import the service only after we've verified everything else
    console.log('[Lighthouse Service Runner] Importing LighthouseService...');
    let LighthouseService;
    try {
        LighthouseService = require('./index').LighthouseService;
        console.log('[Lighthouse Service Runner] LighthouseService imported successfully');
    } catch (error) {
        console.error('[Lighthouse Service Runner] Failed to import LighthouseService:', error);
        process.exit(1);
    }

    const serviceOptions = {
        outputDir: argv.outputDir,
        retries: argv.retries,
    };

    console.log('[Lighthouse Service Runner] Creating LighthouseService instance...');
    const service = new LighthouseService(serviceOptions);

    try {
        console.log(`[Lighthouse Service Runner] Starting audits for ${urlsToAudit.length} URLs...`);
        const result = await service.auditAll(urlsToAudit);
        
        if (result.success || result.successful.length > 0) {
            console.log(`[Lighthouse Service Runner] Lighthouse audits finished successfully`);
            console.log(`[Lighthouse Service Runner] ${result.successful.length} successful, ${result.failed.length} failed`);
        } else {
            console.error('[Lighthouse Service Runner] All lighthouse audits failed:', result.error);
            process.exit(1);
        }
    } catch (error) {
        console.error('[Lighthouse Service Runner] Error during audit execution:', error);
        process.exit(1);
    }
}

main().catch(err => {
    console.error("[Lighthouse Service Runner] Unhandled error:", err);
    process.exit(1);
});