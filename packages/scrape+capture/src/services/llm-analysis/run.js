// scrape+capture/src/services/llm-analysis/run.js
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { LLMAnalysisService } = require('./index'); // Assumes index.js exports LLMAnalysisService
const fs = require('fs-extra');
const path = require('path');

// Load .env file if present (for ANTHROPIC_API_KEY)
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '..', '.env') });


async function main() {
    const argv = yargs(hideBin(process.argv))
        .option('screenshotsDir', {
            type: 'string',
            description: 'Directory containing the desktop screenshots (e.g., .../2_screenshots/desktop)',
            demandOption: true,
        })
        .option('lighthouseDir', {
            type: 'string',
            description: 'Directory containing the trimmed Lighthouse reports (e.g., .../3_lighthouse/trimmed)',
            demandOption: true,
        })
        .option('outputDir', {
            alias: 'o',
            type: 'string',
            description: 'Directory to save the raw LLM analysis (analysis.json) and metadata.',
            demandOption: true,
        })
        .option('orgName', {
            type: 'string',
            description: 'Name of the organization being analyzed.',
            demandOption: true,
        })
        .option('orgType', {
            type: 'string',
            description: 'Type of the organization.',
            demandOption: true,
        })
        .option('orgPurpose', {
            type: 'string',
            description: 'Purpose of the organization\'s website.',
            demandOption: true,
        })
        .option('provider', {
            type: 'string',
            description: 'LLM provider (e.g., anthropic, openai).',
            default: 'anthropic',
        })
        .option('model', {
            type: 'string',
            description: 'LLM model to use.',
            // Default to a faster/cheaper model for batch processing, can be overridden by ANALYSIS_OPTIONS
            default: process.env.ANTHROPIC_MODEL || 'claude-3-7-sonnet-20250219',
        })
        .option('concurrency', {
            type: 'number',
            description: 'Number of pages to analyze concurrently by the LLM.',
            default: 2, // LLM calls can be resource-intensive
        })
        .help()
        .argv;

    // Ensure input directories exist
    if (!await fs.pathExists(argv.screenshotsDir)) {
        console.error(`[LLM Analysis Runner] Error: Screenshots directory not found at ${argv.screenshotsDir}`);
        process.exit(1);
    }
    if (!await fs.pathExists(argv.lighthouseDir)) {
        console.error(`[LLM Analysis Runner] Error: Lighthouse reports directory not found at ${argv.lighthouseDir}`);
        process.exit(1);
    }

    // Ensure the output directory exists
    await fs.ensureDir(argv.outputDir);

    // Prepare options for the service
    // The LLMAnalysisService constructor expects org_name, org_type, org_purpose
    const serviceOptions = {
        screenshotsDir: argv.screenshotsDir,
        lighthouseDir: argv.lighthouseDir,
        outputDir: argv.outputDir,
        org_name: argv.orgName, // Note the underscore for the service constructor
        org_type: argv.orgType,
        org_purpose: argv.orgPurpose,
        provider: argv.provider,
        model: argv.model,
        concurrency: argv.concurrency,
    };

    // API Key Check (especially for Anthropic)
    if (serviceOptions.provider === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
        console.error("[LLM Analysis Runner] ERROR: ANTHROPIC_API_KEY is not set in environment variables or .env file.");
        console.error("Please ensure it's available for the LLM Analysis Service to function.");
        process.exit(1);
    }


    const service = new LLMAnalysisService(serviceOptions);

    try {
        console.log(`[LLM Analysis Runner] Starting LLM analysis. Output to: ${argv.outputDir}`);
        console.log(`[LLM Analysis Runner] Using model: ${serviceOptions.model} with provider: ${serviceOptions.provider}`);
        const result = await service.analyze();

        if (result.success) {
            console.log(`[LLM Analysis Runner] LLM analysis finished successfully.`);
            console.log(`[LLM Analysis Runner] Raw analysis saved to: ${path.join(argv.outputDir, 'analysis.json')}`);
            console.log(`[LLM Analysis Runner] Metadata saved to: ${path.join(argv.outputDir, 'analysis-metadata.json')}`);
        } else {
            console.error('[LLM Analysis Runner] LLM analysis failed:', result.error || "Unknown error during analysis.");
            process.exit(1);
        }
    } catch (error) {
        console.error('[LLM Analysis Runner] Error running LLMAnalysisService:', error);
        process.exit(1);
    }
}

main();
