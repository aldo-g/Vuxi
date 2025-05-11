const fs = require('fs-extra');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { LLMAnalyzer } = require('./analyzer');
const { processAnalysisResults } = require('./utils');

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('screenshots', {
    alias: 's',
    type: 'string',
    demandOption: true,
    description: 'Directory containing screenshots'
  })
  .option('lighthouse', {
    alias: 'l',
    type: 'string',
    demandOption: true,
    description: 'Directory containing lighthouse reports'
  })
  .option('output', {
    alias: 'o',
    type: 'string',
    demandOption: true,
    description: 'Output directory for analysis results'
  })
  .option('provider', {
    alias: 'p',
    type: 'string',
    default: 'anthropic',
    choices: ['anthropic', 'openai'],
    description: 'LLM provider to use'
  })
  .option('model', {
    alias: 'm',
    type: 'string',
    default: 'claude-3-5-sonnet-20241022',
    description: 'Model to use for analysis'
  })
  .argv;

async function main() {
  console.log('🤖 LLM Analysis Service Starting...');
  console.log(`📸 Screenshots: ${argv.screenshots}`);
  console.log(`🚦 Lighthouse: ${argv.lighthouse}`);
  console.log(`📁 Output: ${argv.output}`);
  console.log(`🧠 Provider: ${argv.provider} (${argv.model})`);
  
  const startTime = Date.now();
  
  try {
    // Initialize analyzer
    const analyzer = new LLMAnalyzer({
      provider: argv.provider,
      model: argv.model,
      screenshotsDir: argv.screenshots,
      lighthouseDir: argv.lighthouse
    });
    
    // Load screenshots and lighthouse data
    console.log('\n📥 Loading data...');
    const screenshots = await analyzer.loadScreenshots();
    const lighthouseData = await analyzer.loadLighthouseData();
    
    console.log(`✅ Loaded ${screenshots.length} screenshots`);
    console.log(`✅ Loaded ${lighthouseData.length} lighthouse reports`);
    
    if (screenshots.length === 0 && lighthouseData.length === 0) {
      console.log('⚠️  No data to analyze');
      return;
    }
    
    // Run analysis
    console.log('\n🔍 Running LLM analysis...');
    const rawAnalysis = await analyzer.analyzeWebsite();
    
    // Process and structure the results
    console.log('\n📊 Processing analysis results...');
    const processedAnalysis = await processAnalysisResults(rawAnalysis, screenshots, lighthouseData);
    
    // Save results
    await fs.ensureDir(argv.output);
    
    // Save raw analysis
    const rawAnalysisPath = path.join(argv.output, 'raw-analysis.json');
    await fs.writeJson(rawAnalysisPath, rawAnalysis, { spaces: 2 });
    
    // Save processed analysis
    const processedAnalysisPath = path.join(argv.output, 'processed-analysis.json');
    await fs.writeJson(processedAnalysisPath, processedAnalysis, { spaces: 2 });
    
    // Save metadata
    const metadata = {
      timestamp: new Date().toISOString(),
      duration_seconds: (Date.now() - startTime) / 1000,
      provider: argv.provider,
      model: argv.model,
      screenshots_analyzed: screenshots.length,
      lighthouse_reports_analyzed: lighthouseData.length,
      analysis_version: '1.0.0'
    };
    
    const metadataPath = path.join(argv.output, 'analysis-metadata.json');
    await fs.writeJson(metadataPath, metadata, { spaces: 2 });
    
    // Summary
    console.log('\n🎉 Analysis completed successfully');
    console.log(`⏱️  Duration: ${metadata.duration_seconds.toFixed(2)} seconds`);
    console.log(`📄 Raw analysis saved to: ${rawAnalysisPath}`);
    console.log(`📄 Processed analysis saved to: ${processedAnalysisPath}`);
    console.log(`📄 Metadata saved to: ${metadataPath}`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

main().catch(console.error);