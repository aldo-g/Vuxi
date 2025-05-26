const fs = require('fs-extra');
const path = require('path');
const { LLMAnalyzer } = require('./analyzer');

class LLMAnalysisService {
  constructor(options = {}) {
    this.provider = options.provider || 'anthropic';
    this.model = options.model || 'claude-3-7-sonnet-20250219';
    this.screenshotsDir = options.screenshotsDir || './data/screenshots';
    this.lighthouseDir = options.lighthouseDir || './data/lighthouse';
    this.outputDir = options.outputDir || './data/analysis';
  }

  async analyze() {
    console.log('🤖 LLM Analysis Service Starting...');
    console.log(`📸 Screenshots: ${this.screenshotsDir}`);
    console.log(`🚦 Lighthouse: ${this.lighthouseDir}`);
    console.log(`📁 Output: ${this.outputDir}`);
    console.log(`🧠 Provider: ${this.provider} (${this.model})`);
    
    const startTime = Date.now();
    
    try {
      // Check API key
      if (!process.env.ANTHROPIC_API_KEY && this.provider === 'anthropic') {
        throw new Error('ANTHROPIC_API_KEY environment variable is required');
      }
      
      // Ensure output directory exists
      await fs.ensureDir(this.outputDir);
      
      // Initialize analyzer
      const analyzer = new LLMAnalyzer({
        provider: this.provider,
        model: this.model,
        screenshotsDir: this.screenshotsDir,
        lighthouseDir: this.lighthouseDir
      });
      
      // Load screenshots and lighthouse data
      console.log('\n📥 Loading data...');
      const screenshots = await analyzer.loadScreenshots();
      const lighthouseData = await analyzer.loadLighthouseData();
      
      console.log(`✅ Loaded ${screenshots.length} screenshots`);
      console.log(`✅ Loaded ${lighthouseData.length} lighthouse reports`);
      
      if (screenshots.length === 0 && lighthouseData.length === 0) {
        console.log('⚠️  No data to analyze');
        return {
          success: false,
          error: 'No screenshots or lighthouse data found',
          analysis: null,
          stats: {}
        };
      }
      
      // Run analysis
      console.log('\n🔍 Running LLM analysis...');
      const analysis = await analyzer.analyzeWebsite();
      
      // Save analysis with timestamp
      const analysisPath = path.join(this.outputDir, 'analysis.json');
      await fs.writeJson(analysisPath, analysis, { spaces: 2 });
      
      // Save metadata
      const duration = (Date.now() - startTime) / 1000;
      const metadata = {
        timestamp: new Date().toISOString(),
        duration_seconds: duration,
        provider: this.provider,
        model: this.model,
        screenshots_analyzed: screenshots.length,
        lighthouse_reports_analyzed: lighthouseData.length,
        analysis_version: '1.0.0'
      };
      
      const metadataPath = path.join(this.outputDir, 'analysis-metadata.json');
      await fs.writeJson(metadataPath, metadata, { spaces: 2 });
      
      // Summary
      console.log('\n🎉 Analysis completed successfully');
      console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
      console.log(`📄 Analysis saved to: ${analysisPath}`);
      console.log(`📄 Metadata saved to: ${metadataPath}`);
      
      return {
        success: true,
        analysis: analysis,
        stats: {
          duration: duration,
          screenshots: screenshots.length,
          lighthouseReports: lighthouseData.length,
          pageAnalyses: analysis.pageAnalyses?.length || 0
        },
        files: {
          analysis: analysisPath,
          metadata: metadataPath
        }
      };
      
    } catch (error) {
      console.error('❌ LLM Analysis failed:', error.message);
      return {
        success: false,
        error: error.message,
        analysis: null,
        stats: {}
      };
    }
  }
}

module.exports = { LLMAnalysisService };