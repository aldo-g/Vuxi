require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const path = require('path');
const { LighthouseService } = require('./lighthouse');
const { LLMAnalysisService } = require('./llm-analysis');
const { FormattingService } = require('./formatting');
const { HTMLReportService } = require('./html-report');

async function analysis(data) {
    const { urls, organizationName, organizationType, organizationPurpose } = data;
    
    console.log(`🔬 Starting analysis for: ${organizationName}`);
    
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('❌ ANTHROPIC_API_KEY environment variable is not set');
      return { success: false, error: 'ANTHROPIC_API_KEY not configured' };
    }
    
    // Find root data directory - go up from current working directory
    const rootDir = path.resolve(process.cwd(), '../..');
    const dataDir = path.join(rootDir, 'data');
    
    console.log(`📁 Using data directory: ${dataDir}`);
    
    // Run Lighthouse audits
    const lighthouseService = new LighthouseService({
      outputDir: path.join(dataDir, 'lighthouse')
    });
    const lighthouseResult = await lighthouseService.auditAll(urls);
    
    // Run LLM analysis with correct paths
    const llmService = new LLMAnalysisService({
      screenshotsDir: path.join(dataDir, 'screenshots', 'desktop'),
      lighthouseDir: path.join(dataDir, 'lighthouse', 'trimmed'),
      outputDir: path.join(dataDir, 'analysis'),
      org_name: organizationName,
      org_type: organizationType || 'organization',
      org_purpose: organizationPurpose
    });
    const llmResult = await llmService.analyze();
    
    if (!llmResult.success) {
      return { success: false, error: llmResult.error, lighthouse: lighthouseResult };
    }
    
    // Format the analysis
    const formattingService = new FormattingService({
      inputPath: path.join(dataDir, 'analysis', 'analysis.json'),
      outputPath: path.join(dataDir, 'analysis', 'structured-analysis.json')
    });
    const formattingResult = await formattingService.format();
    
    if (!formattingResult.success) {
      return { success: false, error: formattingResult.error, lighthouse: lighthouseResult, llmAnalysis: llmResult };
    }
    
    // Generate HTML report
    const htmlService = new HTMLReportService({
      outputDir: path.join(dataDir, 'reports'),
      screenshotsDir: path.join(dataDir, 'screenshots')
    });
    const htmlResult = await htmlService.generateFromFile(path.join(dataDir, 'analysis', 'structured-analysis.json'));
    
    return {
      success: htmlResult.success,
      lighthouse: lighthouseResult,
      llmAnalysis: llmResult,
      formatting: formattingResult,
      htmlReport: htmlResult,
      reportPath: htmlResult.success ? path.join(dataDir, 'reports', 'index.html') : null
    };
  }

module.exports = { analysis };