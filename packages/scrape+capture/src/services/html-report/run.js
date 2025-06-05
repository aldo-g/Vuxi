// scrape+capture/src/services/html-report/run.js
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { HTMLReportService } = require('./index'); // Assumes index.js exports HTMLReportService
const fs = require('fs-extra');
const path = require('path');

async function main() {
    const argv = yargs(hideBin(process.argv))
        .option('analysisFilePath', {
            alias: 'i', // input
            type: 'string',
            description: 'Path to the structured analysis JSON file (e.g., structured-analysis.json).',
            demandOption: true,
        })
        .option('outputDir', {
            alias: 'o',
            type: 'string',
            description: 'The root directory where the final HTML report (including UI assets and report-data.json) will be generated.',
            demandOption: true,
        })
        .option('screenshotsDir', {
            alias: 's',
            type: 'string',
            description: 'Path to the directory containing the screenshots for this analysis run (e.g., .../2_screenshots/). The service will copy these.',
            demandOption: true,
        })
        // Add other options your HTMLReportService might accept
        .help()
        .argv;

    // Ensure input analysis file exists
    if (!await fs.pathExists(argv.analysisFilePath)) {
        console.error(`[HTML Report Runner] Error: Structured analysis file not found at ${argv.analysisFilePath}`);
        process.exit(1);
    }

    // Ensure screenshots source directory exists (it might be empty if no screenshots were taken, but the dir path should be valid)
    if (!await fs.pathExists(argv.screenshotsDir)) {
        console.warn(`[HTML Report Runner] Warning: Screenshots source directory not found at ${argv.screenshotsDir}. Report may lack images.`);
        // We might not want to exit here, as a report could still be generated without screenshots.
    }

    // Ensure the main output directory for the report exists
    // The HTMLReportService and its ReportGenerator will place files directly into this outputDir.
    await fs.ensureDir(argv.outputDir);

    // Prepare options for the service
    const serviceOptions = {
        outputDir: argv.outputDir, // This is where index.html, report-data.json, and assets will go
        screenshotsDir: argv.screenshotsDir, // Source directory for screenshots to be copied
        // reportUiBuildDir is handled internally by ReportGenerator, assuming it's at a fixed relative path
    };

    const service = new HTMLReportService(serviceOptions);

    try {
        console.log(`[HTML Report Runner] Starting HTML report generation from: ${argv.analysisFilePath}`);
        console.log(`[HTML Report Runner] Report will be generated in: ${argv.outputDir}`);
        console.log(`[HTML Report Runner] Screenshots will be sourced from: ${argv.screenshotsDir}`);

        // The generateFromFile method in HTMLReportService reads the analysis file
        // and then calls its internal generate method.
        const result = await service.generateFromFile(argv.analysisFilePath);

        if (result.success) {
            console.log(`[HTML Report Runner] HTML report generation finished successfully.`);
            console.log(`[HTML Report Runner] Main report file: ${path.join(argv.outputDir, 'index.html')}`);
            console.log(`[HTML Report Runner] Data file for UI: ${path.join(argv.outputDir, 'report-data.json')}`);
        } else {
            console.error('[HTML Report Runner] HTML report generation failed:', result.error || "Unknown error during report generation.");
            process.exit(1);
        }
    } catch (error) {
        console.error('[HTML Report Runner] Error running HTMLReportService:', error);
        process.exit(1);
    }
}

main();
