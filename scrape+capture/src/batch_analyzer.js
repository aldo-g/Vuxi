// scrape+capture/src/batch_analyzer.js

// Load environment variables FIRST
require('dotenv').config();

// Import necessary modules
const fs = require('fs-extra');
const path = require('path');
const { spawnSync } = require('child_process');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// --- Configuration ---
const DEFAULT_PRESETS_FILE = path.join(__dirname, '..', 'config', 'analysis_presets.json');
const DEFAULT_BASE_OUTPUT_DIR = path.resolve(process.cwd(), "all_analysis_runs");
const NODE_SERVICES_BASE_PATH = path.join(__dirname, 'services');

// --- Helper Functions ---

/**
 * Sanitizes a string to be safe for directory or file names.
 */
function sanitizeForPath(name) {
    if (!name || typeof name !== 'string') return 'invalid_name';
    return name.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/__+/g, '_').replace(/^_|_$/g, '').toLowerCase() || 'sanitized_name';
}

/**
 * Runs a Node.js service command and handles errors.
 */
function runNodeService(commandParts, serviceName, presetKey) {
    console.log(`\nINFO [${presetKey}]: Starting ${serviceName}...`);
    const command = commandParts[0];
    const args = commandParts.slice(1);
    console.log(`CMD  [${presetKey}]: ${command} ${args.join(' ')}`);

    try {
        const result = spawnSync(command, args, {
            stdio: 'inherit',
            shell: false,
            encoding: 'utf-8'
        });

        if (result.status !== 0) {
            console.error(`ERROR [${presetKey}]: ${serviceName} failed with exit code ${result.status}.`);
            if (result.stderr) {
                console.error(`STDERR [${presetKey} - ${serviceName}]:\n${result.stderr}`);
            }
            if (result.stdout) {
                console.error(`STDOUT [${presetKey} - ${serviceName}]:\n${result.stdout}`);
            }
            return false;
        }
        console.log(`INFO [${presetKey}]: ${serviceName} finished successfully.`);
        return true;
    } catch (error) {
        console.error(`ERROR [${presetKey}]: Failed to execute ${serviceName}.`);
        console.error(error);
        if (error.code === 'ENOENT') {
            console.error(`  Ensure Node.js is installed and the script path is correct: ${commandParts.join(' ')}`);
        }
        return false;
    }
}

/**
 * Main function to orchestrate batch analysis.
 */
async function main() {
    const argv = yargs(hideBin(process.argv))
        .option('presets', {
            alias: 'p',
            type: 'string',
            default: DEFAULT_PRESETS_FILE,
            description: 'Path to the analysis presets JSON file.'
        })
        .option('output', {
            alias: 'o',
            type: 'string',
            default: DEFAULT_BASE_OUTPUT_DIR,
            description: 'Base directory for all analysis run outputs.'
        })
        .option('specificPreset', {
            alias: 's',
            type: 'string',
            description: 'Run only a specific preset key from the JSON file.'
        })
        .option('skipToStep', {
            alias: 'k',
            type: 'string',
            choices: ["urlDiscovery", "screenshots", "lighthouse", "llm", "formatting", "report"],
            description: "Skip to a specific step (ensure previous steps' outputs exist)."
        })
        .option('forceOverwrite', {
            alias: 'f',
            type: 'boolean',
            default: false,
            description: 'If a run directory for a preset already exists, delete it and run fresh.'
        })
        .help()
        .argv;

    // Load presets
    const presetsFilePath = path.resolve(argv.presets);
    if (!await fs.pathExists(presetsFilePath)) {
        console.error(`ERROR: Presets file not found at ${presetsFilePath}`);
        process.exit(1);
    }
    const presetsData = await fs.readJson(presetsFilePath);

    let presetsToRun = presetsData;
    if (argv.specificPreset) {
        if (!presetsData[argv.specificPreset]) {
            console.error(`ERROR: Preset key '${argv.specificPreset}' not found in ${presetsFilePath}`);
            process.exit(1);
        }
        presetsToRun = { [argv.specificPreset]: presetsData[argv.specificPreset] };
    }

    const baseOutputDir = path.resolve(argv.output);
    await fs.ensureDir(baseOutputDir);
    console.log(`INFO: Base output directory: ${baseOutputDir}`);

    for (const [presetKey, config] of Object.entries(presetsToRun)) {
        console.log(`\n==================== PROCESSING PRESET: ${presetKey} ====================`);

        const targetUrl = config.URL;
        if (!targetUrl) {
            console.error(`ERROR [${presetKey}]: 'URL' not defined in preset. Skipping.`);
            continue;
        }

        const orgName = config.ORG_NAME || "Default Organization";
        const orgType = config.ORG_TYPE || "organization";
        const orgPurpose = config.ORG_PURPOSE || "to achieve its business goals";
        const analysisOptions = config.ANALYSIS_OPTIONS || {};

        // --- Create Unique Run Directory for this preset ---
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const runDirName = `run_${sanitizeForPath(presetKey)}_${timestamp}`;
        const currentRunBaseDir = path.join(baseOutputDir, runDirName);

        if (await fs.pathExists(currentRunBaseDir)) {
            if (argv.forceOverwrite) {
                console.warn(`WARN [${presetKey}]: Directory ${currentRunBaseDir} exists. Overwriting due to --forceOverwrite.`);
                await fs.remove(currentRunBaseDir);
            } else {
                console.log(`INFO [${presetKey}]: Directory ${currentRunBaseDir} already exists. Skipping run. Use --forceOverwrite to re-run.`);
                continue;
            }
        }
        await fs.ensureDir(currentRunBaseDir);
        console.log(`INFO [${presetKey}]: Output for this run: ${currentRunBaseDir}`);

        // --- Define paths for each step's output ---
        const urlDiscoveryOutputDir = path.join(currentRunBaseDir, "1_url_discovery");
        const screenshotsOutputDir = path.join(currentRunBaseDir, "2_screenshots");
        const lighthouseOutputDir = path.join(currentRunBaseDir, "3_lighthouse");
        const llmAndFormattingOutputDir = path.join(currentRunBaseDir, "4_llm_analysis_and_formatting");

        await fs.ensureDir(urlDiscoveryOutputDir);
        await fs.ensureDir(screenshotsOutputDir);
        await fs.ensureDir(lighthouseOutputDir);
        await fs.ensureDir(llmAndFormattingOutputDir);

        const discoveredUrlsSimpleFile = path.join(urlDiscoveryOutputDir, "urls_simple.json");
        const rawLlmAnalysisFile = path.join(llmAndFormattingOutputDir, "analysis.json");
        const formattedDataFile = path.join(llmAndFormattingOutputDir, "structured-analysis.json");

        let currentStepNumber = 1;
        const totalSteps = 5;

        // --- 1. URL Discovery ---
        if (!argv.skipToStep || argv.skipToStep === "urlDiscovery") {
            console.log(`\n--- [${presetKey}] Step ${currentStepNumber}/${totalSteps}: URL Discovery ---`);
            const scriptPath = path.join(NODE_SERVICES_BASE_PATH, "url-discovery", "run.js");
            const cmd = [
                "node", scriptPath,
                "--targetUrl", targetUrl,
                "--outputDir", urlDiscoveryOutputDir,
                "--maxPages", String(analysisOptions.maxPages || 50),
                "--timeout", String(analysisOptions.timeout || 8000),
                "--fastMode", String(analysisOptions.fastMode !== undefined ? analysisOptions.fastMode : true).toLowerCase(),
                "--maxUrlsTotal", String(analysisOptions.maxUrlsTotal || 10)
            ];
            if (!runNodeService(cmd, "URL Discovery", presetKey)) continue;
        }
        currentStepNumber++;

        // --- 2. Screenshot Capture ---
        if (!argv.skipToStep || ["urlDiscovery", "screenshots"].includes(argv.skipToStep)) {
             if (argv.skipToStep === "screenshots" && !await fs.pathExists(discoveredUrlsSimpleFile)) {
                console.error(`ERROR [${presetKey}]: Skipping to screenshots but '${discoveredUrlsSimpleFile}' not found. Run URL discovery first.`);
                continue;
            }
            console.log(`\n--- [${presetKey}] Step ${currentStepNumber}/${totalSteps}: Screenshot Capture ---`);
            const scriptPath = path.join(NODE_SERVICES_BASE_PATH, "screenshot", "run.js");
            const cmd = [
                "node", scriptPath,
                "--urlsFile", discoveredUrlsSimpleFile,
                "--outputDir", screenshotsOutputDir,
                "--viewportWidth", String(analysisOptions.viewportWidth || 1440),
                "--viewportHeight", String(analysisOptions.viewportHeight || 900)
            ];
            if (!runNodeService(cmd, "Screenshot Capture", presetKey)) continue;
        }
        currentStepNumber++;

        // --- 3. Lighthouse Audits ---
        if (!argv.skipToStep || ["urlDiscovery", "screenshots", "lighthouse"].includes(argv.skipToStep)) {
            if (argv.skipToStep === "lighthouse" && !await fs.pathExists(discoveredUrlsSimpleFile)) {
                console.error(`ERROR [${presetKey}]: Skipping to Lighthouse but '${discoveredUrlsSimpleFile}' not found.`);
                continue;
            }
            console.log(`\n--- [${presetKey}] Step ${currentStepNumber}/${totalSteps}: Lighthouse Audits ---`);
            const scriptPath = path.join(NODE_SERVICES_BASE_PATH, "lighthouse", "run.js");
            const cmd = [
                "node", scriptPath,
                "--urlsFile", discoveredUrlsSimpleFile,
                "--outputDir", lighthouseOutputDir
            ];
            if (!runNodeService(cmd, "Lighthouse Audits", presetKey)) continue;
        }
        currentStepNumber++;

        // --- 4a. LLM Analysis ---
        if (!argv.skipToStep || ["urlDiscovery", "screenshots", "lighthouse", "llm"].includes(argv.skipToStep)) {
             if (argv.skipToStep === "llm" && (!await fs.pathExists(path.join(screenshotsOutputDir, "desktop")) || !await fs.pathExists(path.join(lighthouseOutputDir, "trimmed")))) {
                console.error(`ERROR [${presetKey}]: Skipping to LLM analysis but screenshot/lighthouse data not found.`);
                continue;
            }
            console.log(`\n--- [${presetKey}] Step ${currentStepNumber}/${totalSteps}: LLM Analysis ---`);
            const scriptPath = path.join(NODE_SERVICES_BASE_PATH, "llm-analysis", "run.js");
            const cmd = [
                "node", scriptPath,
                "--screenshotsDir", path.join(screenshotsOutputDir, "desktop"), // Pass the full path to desktop folder
                "--lighthouseDir", path.join(lighthouseOutputDir, "trimmed"),   // Pass the full path to trimmed folder
                "--outputDir", llmAndFormattingOutputDir,
                "--orgName", orgName,
                "--orgType", orgType,
                "--orgPurpose", orgPurpose,
                "--model", analysisOptions.llmModel || "claude-3-haiku-20240307",
                "--concurrency", String(analysisOptions.llmConcurrency || 2)
            ];
            if (!runNodeService(cmd, "LLM Analysis", presetKey)) continue;
        }

        // --- 4b. Formatting ---
        if (!argv.skipToStep || ["urlDiscovery", "screenshots", "lighthouse", "llm", "formatting"].includes(argv.skipToStep)) {
            if (argv.skipToStep === "formatting" && !await fs.pathExists(rawLlmAnalysisFile)) {
                console.error(`ERROR [${presetKey}]: Skipping to Formatting but '${rawLlmAnalysisFile}' not found.`);
                continue;
            }
            console.log(`\n--- [${presetKey}] Step ${currentStepNumber}/${totalSteps} (cont.): Formatting ---`);
            const scriptPath = path.join(NODE_SERVICES_BASE_PATH, "formatting", "run.js");
            const cmd = [
                "node", scriptPath,
                "--inputPath", rawLlmAnalysisFile,
                "--outputPath", formattedDataFile,
                "--orgName", orgName,
                "--orgType", orgType,
                "--orgPurpose", orgPurpose,
                "--model", analysisOptions.formattingModel || "claude-3-haiku-20240307"
            ];
            if (!runNodeService(cmd, "Formatting", presetKey)) continue;
        }
        currentStepNumber++;

        // --- 5. HTML Report Generation ---
        if (!argv.skipToStep || ["urlDiscovery", "screenshots", "lighthouse", "llm", "formatting", "report"].includes(argv.skipToStep)) {
            if (argv.skipToStep === "report" && !await fs.pathExists(formattedDataFile)) {
                console.error(`ERROR [${presetKey}]: Skipping to Report Generation but '${formattedDataFile}' not found.`);
                continue;
            }
            console.log(`\n--- [${presetKey}] Step ${currentStepNumber}/${totalSteps}: HTML Report Generation ---`);
            const scriptPath = path.join(NODE_SERVICES_BASE_PATH, "html-report", "run.js");
            const cmd = [
                "node", scriptPath,
                "--analysisFilePath", formattedDataFile,
                "--outputDir", currentRunBaseDir,
                "--screenshotsDir", screenshotsOutputDir
            ];
            if (!runNodeService(cmd, "HTML Report Generation", presetKey)) continue;
        }

        console.log(`\nSUCCESS [${presetKey}]: Full analysis pipeline completed. Report at: ${path.join(currentRunBaseDir, 'index.html')}`);
        console.log(`==================== FINISHED PRESET: ${presetKey} ====================\n`);
    }

    console.log("Batch processing finished for all specified presets.");
}

// Check ANTHROPIC_API_KEY after loading .env
if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("WARNING: ANTHROPIC_API_KEY environment variable is not set. LLM-dependent services might fail.");
    console.warn("Please ensure you have a .env file in the project root with: ANTHROPIC_API_KEY=your-api-key");
} else {
    console.log(`INFO: ANTHROPIC_API_KEY loaded successfully (${process.env.ANTHROPIC_API_KEY.substring(0, 8)}...)`);
}

main().catch(error => {
    console.error("Unhandled error in batch analyzer:", error);
    process.exit(1);
});