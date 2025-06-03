// scrape+capture/src/services/formatting/run.js
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { FormattingService } = require('./index'); // Assumes index.js exports FormattingService
const fs = require('fs-extra');
const path = require('path');

// Load .env file if present (for ANTHROPIC_API_KEY, if formatting service uses LLM directly)
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '..', '.env') });

async function main() {
    const argv = yargs(hideBin(process.argv))
        .option('inputPath', {
            alias: 'i',
            type: 'string',
            description: 'Path to the raw LLM analysis JSON file (analysis.json).',
            demandOption: true,
        })
        .option('outputPath', {
            alias: 'o',
            type: 'string',
            description: 'Path to save the structured analysis JSON file (structured-analysis.json).',
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
        .option('model', {
            type: 'string',
            description: 'LLM model to use for formatting (if applicable).',
            default: process.env.ANTHROPIC_MODEL_FORMATTING || 'claude-3-haiku-20240307', // Or a specific model for formatting
        })
        // Add other options your FormattingService might accept
        .help()
        .argv;

    // Ensure input file exists
    if (!await fs.pathExists(argv.inputPath)) {
        console.error(`[Formatting Service Runner] Error: Input analysis file not found at ${argv.inputPath}`);
        process.exit(1);
    }

    // Ensure the output directory exists
    await fs.ensureDir(path.dirname(argv.outputPath));

    // Prepare options for the service
    // The FormattingService constructor takes an orgContext object
    const serviceOptions = {
        inputPath: argv.inputPath, // The service itself reads this
        outputPath: argv.outputPath, // The service itself writes to this
        orgContext: {
            org_name: argv.orgName,
            org_type: argv.orgType,
            org_purpose: argv.orgPurpose,
        },
        model: argv.model,
        // provider: if your formatting service needs to specify a provider
    };

    // API Key Check (if formatting service makes its own LLM calls)
    // Assuming formatting might also use Anthropic, for consistency
    if (!process.env.ANTHROPIC_API_KEY) {
        console.error("[Formatting Service Runner] ERROR: ANTHROPIC_API_KEY is not set. Formatting might fail if it relies on LLM calls.");
        // Depending on whether formatting *always* needs an LLM, you might not exit here.
        // The Formatter class itself checks for ANTHROPIC_API_KEY.
    }

    const service = new FormattingService(serviceOptions);

    try {
        console.log(`[Formatting Service Runner] Starting formatting for: ${argv.inputPath}`);
        console.log(`[Formatting Service Runner] Output will be saved to: ${argv.outputPath}`);
        if (serviceOptions.model) {
            console.log(`[Formatting Service Runner] Using model (if applicable): ${serviceOptions.model}`);
        }
        
        const result = await service.format(); // format() method is called on the service instance

        if (result.success) {
            console.log(`[Formatting Service Runner] Formatting finished successfully.`);
            console.log(`[Formatting Service Runner] Structured analysis saved to: ${argv.outputPath}`);
        } else {
            console.error('[Formatting Service Runner] Formatting failed:', result.error || "Unknown error during formatting.");
            // Optionally save the partial/error data if the service provides it
            if (result.data) {
                const errorOutputPath = argv.outputPath.replace('.json', '.error.json');
                await fs.writeJson(errorOutputPath, result.data, { spaces: 2 });
                console.error(`[Formatting Service Runner] Partial/error data saved to: ${errorOutputPath}`);
            }
            process.exit(1);
        }
    } catch (error) {
        console.error('[Formatting Service Runner] Error running FormattingService:', error);
        process.exit(1);
    }
}

main();
