// scrape+capture/src/services/lighthouse/run.js
console.log("[Lighthouse Service Runner] Script started."); // VERY FIRST LINE

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
// ... rest of the script from lighthouse_run_js_logging version
const { LighthouseService } = require('./index');
const fs = require('fs-extra');
const path = require('path');

async function main() {
    console.log("[Lighthouse Service Runner] Main function started.");
    const argv = yargs(hideBin(process.argv))
        // ... (options as before) ...
        .option('urlsFile', {
            alias: 'i',
            type: 'string',
            description: 'Path to the JSON file containing an array of URLs to audit (e.g., urls_simple.json)',
            demandOption: true,
        })
        .option('outputDir', {
            alias: 'o',
            type: 'string',
            description: 'Directory to save the Lighthouse reports (full and trimmed) and summary.json',
            demandOption: true,
        })
        .option('retries', {
            type: 'number',
            description: 'Number of retries for failed audits.',
            default: 1,
        })
        .help()
        .argv;

    console.log("[Lighthouse Service Runner] Arguments parsed:", argv);

    await fs.ensureDir(argv.outputDir);
    console.log(`[Lighthouse Service Runner] Ensured output directory: ${argv.outputDir}`);


    if (!await fs.pathExists(argv.urlsFile)) {
        console.error(`[Lighthouse Service Runner] Error: URLs file not found at ${argv.urlsFile}`);
        process.exit(1);
    }
    const urlsToAudit = await fs.readJson(argv.urlsFile);
    console.log(`[Lighthouse Service Runner] URLs file read from: ${argv.urlsFile}`);

    if (!Array.isArray(urlsToAudit) || urlsToAudit.length === 0) {
        console.error(`[Lighthouse Service Runner] Error: No URLs found in ${argv.urlsFile} or file is not a valid JSON array.`);
        process.exit(1);
    }

    console.log(`[Lighthouse Service Runner] Loaded ${urlsToAudit.length} URL(s) to audit:`);
    urlsToAudit.forEach((url, index) => console.log(`  ${index + 1}. ${url}`));

    const serviceOptions = {
        outputDir: argv.outputDir,
        retries: argv.retries,
    };
    console.log("[Lighthouse Service Runner] LighthouseService options:", serviceOptions);

    const service = new LighthouseService(serviceOptions);
    console.log("[Lighthouse Service Runner] LighthouseService instantiated.");

    try {
        console.log(`[Lighthouse Service Runner] Starting Lighthouse audits for ${urlsToAudit.length} URLs. Output to: ${argv.outputDir}`);
        const result = await service.auditAll(urlsToAudit);
        // ... (rest of the success/fail logic as before) ...
        if (result.success || result.successful.length > 0) {
            console.log(`[Lighthouse Service Runner] Lighthouse audits finished. ${result.successful.length} successful, ${result.failed.length} failed.`);
        } else {
            console.error('[Lighthouse Service Runner] Lighthouse audits failed entirely:', result.error);
            process.exit(1);
        }
    } catch (error) {
        console.error('[Lighthouse Service Runner] Error running LighthouseService:', error);
        process.exit(1);
    }
}

main().catch(err => {
  console.error("[Lighthouse Service Runner] Unhandled error in main:", err);
  process.exit(1);
});
