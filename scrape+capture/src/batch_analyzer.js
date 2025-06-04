// scrape+capture/src/batch_analyzer.js

// Import necessary modules
const fs = require('fs-extra'); // fs-extra for promise-based fs and ensureDir
const path = require('path');
const { spawnSync } = require('child_process'); // Using spawnSync for simplicity in waiting for completion
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// --- Configuration ---
const DEFAULT_PRESETS_FILE = path.join(__dirname, '..', 'config', 'analysis_presets.json'); // Adjusted path
const DEFAULT_BASE_OUTPUT_DIR = path.resolve(process.cwd(), "all_analysis_runs"); // Output relative to where script is run
const NODE_SERVICES_BASE_PATH = path.join(__dirname, 'services'); // Relative to this script's location
const MANIFEST_FILE_NAME = 'all_analysis_runs_manifest.json';

// --- Helper Functions ---

/**
 * Sanitizes a string to be safe for directory or file names.
 * @param {string} name - The string to sanitize.
 * @returns {string} The sanitized string.
 */
function sanitizeForPath(name) {
    if (!name || typeof name !== 'string') return 'invalid_name';
    return name.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/__+/g, '_').replace(/^_|_$/g, '').toLowerCase() || 'sanitized_name';
}

/**
 * Runs a Node.js service command and handles errors.
 * @param {string[]} commandParts - Array of command and arguments.
 * @param {string} serviceName - Name of the service for logging.
 * @param {string} presetKey - Key of the current preset for logging.
 * @returns {boolean} True if successful, false otherwise.
 */
function runNodeService(commandParts, serviceName, presetKey) {
    console.log(`\nINFO [${presetKey}]: Starting ${serviceName}...`);
    const command = commandParts[0];
    const args = commandParts.slice(1);
    console.log(`CMD  [${presetKey}]: ${command} ${args.join(' ')}`);

    try {
        const result = spawnSync(command, args, {
            stdio: 'inherit', // Inherit stdio to see output directly, or use 'pipe' to capture
            shell: false, // Safer; ensure paths with spaces are handled if any part of command is constructed from user input
            encoding: 'utf-8'
        });

        if (result.status !== 0) {
            console.error(`ERROR [${presetKey}]: ${serviceName} failed with exit code ${result.status}.`);
            if (result.stderr) {
                console.error(`STDERR [${presetKey} - ${serviceName}]:\n${result.stderr}`);
            }
            if (result.stdout) { // Log stdout too on error for more context
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
 * Loads existing manifest or creates a new one
 * @param {string} baseOutputDir - Base output directory
 * @returns {Array} Existing manifest entries
 */
async function loadManifest(baseOutputDir) {
    const manifestPath = path.join(baseOutputDir, MANIFEST_FILE_NAME);
    
    try {
        if (await fs.pathExists(manifestPath)) {
            const manifest = await fs.readJson(manifestPath);
            return Array.isArray(manifest) ? manifest : [];
        }
    } catch (error) {
        console.warn(`Warning: Could not load existing manifest: ${error.message}`);
    }
    
    return [];
}

/**
 * Saves the manifest file
 * @param {string} baseOutputDir - Base output directory
 * @param {Array} manifestEntries - Array of manifest entries
 */
async function saveManifest(baseOutputDir, manifestEntries) {
    const manifestPath = path.join(baseOutputDir, MANIFEST_FILE_NAME);
    
    try {
        // Sort by date (newest first)
        const sortedEntries = manifestEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        await fs.writeJson(manifestPath, sortedEntries, { spaces: 2 });
        console.log(`📄 Manifest updated: ${manifestPath}`);
    } catch (error) {
        console.error(`Error saving manifest: ${error.message}`);
    }
}

/**
 * Creates a manifest entry for a completed analysis run
 * @param {string} presetKey - Preset key
 * @param {Object} config - Preset configuration
 * @param {string} runDirName - Run directory name
 * @param {string} currentRunBaseDir - Full path to run directory
 * @returns {Object} Manifest entry
 */
function createManifestEntry(presetKey, config, runDirName, currentRunBaseDir) {
    const timestamp = new Date().toISOString();
    const displayDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    return {
        id: runDirName,
        name: `${config.ORG_NAME || presetKey} Analysis (${displayDate})`,
        date: timestamp,
        description: `Analysis report for ${config.ORG_NAME || presetKey} generated on ${displayDate}.`,
        preset: presetKey,
        organizationName: config.ORG_NAME || presetKey,
        organizationType: config.ORG_TYPE || 'organization',
        organizationPurpose: config.ORG_PURPOSE || 'to achieve its business goals',
        targetUrl: config.URL,
        runDirectory: path.basename(currentRunBaseDir),
        analysisOptions: config.ANALYSIS_OPTIONS || {},
        status: 'completed'
    };
}

/**
 * Removes incomplete runs from manifest (runs that don't have index.html)
 * @param {string} baseOutputDir - Base output directory
 * @param {Array} manifestEntries - Current manifest entries
 * @returns {Array} Cleaned manifest entries
 */
async function cleanupManifest(baseOutputDir, manifestEntries) {
    const cleanedEntries = [];
    
    for (const entry of manifestEntries) {
        const runDir = path.join(baseOutputDir, entry.runDirectory || entry.id);
        const indexHtmlPath = path.join(runDir, 'index.html');
        
        if (await fs.pathExists(indexHtmlPath)) {
            cleanedEntries.push(entry);
        } else {
            console.log(`📝 Removing incomplete run from manifest: ${entry.id}`);
        }
    }
    
    return cleanedEntries;
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

    // Load existing manifest
    let manifestEntries = await loadManifest(baseOutputDir);
    console.log(`📄 Loaded existing manifest with ${manifestEntries.length} entries`);

    // Track successful runs for this batch
    const successfulRuns = [];

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
        const totalSteps = 5; // URL Discovery, Screenshots, Lighthouse, LLM+Format, Report
        let runFailed = false;

        // --- 1. URL Discovery ---
        if (!argv.skipToStep || argv.skipToStep === "urlDiscovery") {
            console.log(`\n--- [${presetKey}] Step ${currentStepNumber}/${totalSteps}: URL Discovery ---`);
            const scriptPath = path.join(NODE_SERVICES_BASE_PATH, "url-discovery", "run.js"); // Assuming run.js
            const cmd = [
                "node", scriptPath,
                "--targetUrl", targetUrl,
                "--outputDir", urlDiscoveryOutputDir,
                "--maxPages", String(analysisOptions.maxPages || 50),
                "--timeout", String(analysisOptions.timeout || 8000),
                "--fastMode", String(analysisOptions.fastMode !== undefined ? analysisOptions.fastMode : true).toLowerCase(),
                "--enableSimpleFilter", String(analysisOptions.enableSimpleFilter !== undefined ? analysisOptions.enableSimpleFilter : false).toLowerCase(),
                "--maxUrlsTotal", String(analysisOptions.maxUrlsTotal || 10)
            ];
            if (!runNodeService(cmd, "URL Discovery", presetKey)) {
                runFailed = true;
                break;
            }
        }
        currentStepNumber++;

        // --- 2. Screenshot Capture ---
        if (!runFailed && (!argv.skipToStep || ["urlDiscovery", "screenshots"].includes(argv.skipToStep))) {
             if (argv.skipToStep === "screenshots" && !await fs.pathExists(discoveredUrlsSimpleFile)) {
                console.error(`ERROR [${presetKey}]: Skipping to screenshots but '${discoveredUrlsSimpleFile}' not found. Run URL discovery first.`);
                runFailed = true;
                break;
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
            if (!runNodeService(cmd, "Screenshot Capture", presetKey)) {
                runFailed = true;
                break;
            }
        }
        currentStepNumber++;

        // --- 3. Lighthouse Audits ---
        if (!runFailed && (!argv.skipToStep || ["urlDiscovery", "screenshots", "lighthouse"].includes(argv.skipToStep))) {
            if (argv.skipToStep === "lighthouse" && !await fs.pathExists(discoveredUrlsSimpleFile)) {
                console.error(`ERROR [${presetKey}]: Skipping to Lighthouse but '${discoveredUrlsSimpleFile}' not found.`);
                runFailed = true;
                break;
            }
            console.log(`\n--- [${presetKey}] Step ${currentStepNumber}/${totalSteps}: Lighthouse Audits ---`);
            const scriptPath = path.join(NODE_SERVICES_BASE_PATH, "lighthouse", "run.js");
            const cmd = [
                "node", scriptPath,
                "--urlsFile", discoveredUrlsSimpleFile,
                "--outputDir", lighthouseOutputDir
            ];
            if (!runNodeService(cmd, "Lighthouse Audits", presetKey)) {
                runFailed = true;
                break;
            }
        }
        currentStepNumber++;

        // --- 4a. LLM Analysis ---
        if (!runFailed && (!argv.skipToStep || ["urlDiscovery", "screenshots", "lighthouse", "llm"].includes(argv.skipToStep))) {
             if (argv.skipToStep === "llm" && (!await fs.pathExists(path.join(screenshotsOutputDir, "desktop")) || !await fs.pathExists(path.join(lighthouseOutputDir, "trimmed")))) {
                console.error(`ERROR [${presetKey}]: Skipping to LLM analysis but screenshot/lighthouse data not found.`);
                runFailed = true;
                break;
            }
            console.log(`\n--- [${presetKey}] Step ${currentStepNumber}/${totalSteps}: LLM Analysis ---`);
            const scriptPath = path.join(NODE_SERVICES_BASE_PATH, "llm-analysis", "run.js");
            const cmd = [
                "node", scriptPath,
                "--screenshotsDir", path.join(screenshotsOutputDir, "desktop"),
                "--lighthouseDir", path.join(lighthouseOutputDir, "trimmed"),
                "--outputDir", llmAndFormattingOutputDir,
                "--orgName", orgName,
                "--orgType", orgType,
                "--orgPurpose", orgPurpose,
                "--model", analysisOptions.llmModel || "claude-3-haiku-20240307", // Example: use Haiku for speed/cost
                "--concurrency", String(analysisOptions.llmConcurrency || 2) // Lower concurrency for LLM
            ];
            if (!runNodeService(cmd, "LLM Analysis", presetKey)) {
                runFailed = true;
                break;
            }
        }
        // No currentStepNumber++ here, formatting is part of this conceptual step.

        // --- 4b. Formatting ---
        if (!runFailed && (!argv.skipToStep || ["urlDiscovery", "screenshots", "lighthouse", "llm", "formatting"].includes(argv.skipToStep))) {
            if (argv.skipToStep === "formatting" && !await fs.pathExists(rawLlmAnalysisFile)) {
                console.error(`ERROR [${presetKey}]: Skipping to Formatting but '${rawLlmAnalysisFile}' not found.`);
                runFailed = true;
                break;
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
            if (!runNodeService(cmd, "Formatting", presetKey)) {
                runFailed = true;
                break;
            }
        }
        currentStepNumber++;

        // --- 5. HTML Report Generation ---
        if (!runFailed && (!argv.skipToStep || ["urlDiscovery", "screenshots", "lighthouse", "llm", "formatting", "report"].includes(argv.skipToStep))) {
            if (argv.skipToStep === "report" && !await fs.pathExists(formattedDataFile)) {
                console.error(`ERROR [${presetKey}]: Skipping to Report Generation but '${formattedDataFile}' not found.`);
                runFailed = true;
                break;
            }
            console.log(`\n--- [${presetKey}] Step ${currentStepNumber}/${totalSteps}: HTML Report Generation ---`);
            const scriptPath = path.join(NODE_SERVICES_BASE_PATH, "html-report", "run.js");
            const cmd = [
                "node", scriptPath,
                "--analysisFilePath", formattedDataFile,
                "--outputDir", currentRunBaseDir, // Report UI and report-data.json go to the root
                "--screenshotsDir", screenshotsOutputDir // Source for screenshots to copy
            ];
            if (!runNodeService(cmd, "HTML Report Generation", presetKey)) {
                runFailed = true;
                break;
            }
        }

        if (!runFailed) {
            console.log(`\nSUCCESS [${presetKey}]: Full analysis pipeline completed. Report at: ${path.join(currentRunBaseDir, 'index.html')}`);
            
            // Create manifest entry for this successful run
            const manifestEntry = createManifestEntry(presetKey, config, runDirName, currentRunBaseDir);
            successfulRuns.push(manifestEntry);
            
            console.log(`📄 Added to manifest: ${manifestEntry.name}`);
        } else {
            console.error(`\nFAILED [${presetKey}]: Pipeline failed, removing incomplete directory.`);
            
            // Clean up failed run directory
            try {
                await fs.remove(currentRunBaseDir);
            } catch (cleanupError) {
                console.error(`Warning: Could not clean up failed run directory: ${cleanupError.message}`);
            }
        }
        
        console.log(`==================== FINISHED PRESET: ${presetKey} ====================\n`);
    }

    // Update manifest with all successful runs
    if (successfulRuns.length > 0) {
        // Add new runs to existing manifest
        manifestEntries.push(...successfulRuns);
        
        // Clean up manifest (remove entries for runs that no longer exist)
        manifestEntries = await cleanupManifest(baseOutputDir, manifestEntries);
        
        // Save updated manifest
        await saveManifest(baseOutputDir, manifestEntries);
        
        console.log(`\n📄 Manifest updated with ${successfulRuns.length} new successful runs`);
        console.log(`📁 Total runs in manifest: ${manifestEntries.length}`);
        console.log(`📄 Manifest location: ${path.join(baseOutputDir, MANIFEST_FILE_NAME)}`);
    }

    console.log("Batch processing finished for all specified presets.");
}

// Ensure ANTHROPIC_API_KEY is set (or loaded via .env in service scripts)
if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("WARNING: ANTHROPIC_API_KEY environment variable is not set. LLM-dependent services might fail.");
    // For a production script, you might want to exit if it's absolutely required here.
    // For now, we'll let the individual services handle their .env loading or fail.
}

main().catch(error => {
    console.error("Unhandled error in batch analyzer:", error);
    process.exit(1);
});