const fs = require('fs-extra');
const path = require('path');
const { LLMAnalysisService } = require('../src/services/llm-analysis');

async function testLLMAnalysisService() {
  console.log('🧪 Testing LLM Analysis Service...\n');
  
  try {
    // Check if API key is available
    if (!process.env.ANTHROPIC_API_KEY) {
      console.log('❌ ANTHROPIC_API_KEY environment variable is not set');
      console.log('Please set your API key with: export ANTHROPIC_API_KEY=your-api-key');
      return;
    }
    
    // Check prerequisites
    const screenshotsDir = './data/screenshots';
    const lighthouseDir = './data/lighthouse';
    
    const screenshotsExist = await fs.pathExists(path.join(screenshotsDir, 'desktop'));
    const lighthouseExists = await fs.pathExists(path.join(lighthouseDir, 'trimmed'));
    
    if (!screenshotsExist) {
      console.log('❌ No screenshots found. Please run screenshot test first.');
      console.log('   Run: npm run test:screenshot');
      return;
    }
    
    if (!lighthouseExists) {
      console.log('❌ No lighthouse data found. Please run lighthouse test first.');
      console.log('   Run: npm run test:lighthouse');
      return;
    }
    
    console.log('✅ Prerequisites found');
    console.log(`📸 Screenshots directory: ${screenshotsDir}`);
    console.log(`🚦 Lighthouse directory: ${lighthouseDir}`);
    
    // Count available data
    const screenshots = await fs.readdir(path.join(screenshotsDir, 'desktop'));
    const lighthouse = await fs.readdir(path.join(lighthouseDir, 'trimmed'));
    const screenshotCount = screenshots.filter(f => f.endsWith('.png')).length;
    const lighthouseCount = lighthouse.filter(f => f.endsWith('.json')).length;
    
    console.log(`📊 Found ${screenshotCount} screenshots and ${lighthouseCount} lighthouse reports`);
    
    // Initialize service
    const service = new LLMAnalysisService({
      provider: 'anthropic',
      model: 'claude-3-7-sonnet-20250219',
      screenshotsDir: screenshotsDir,
      lighthouseDir: lighthouseDir,
      outputDir: './data/analysis'
    });
    
    console.log('\n🤖 Starting LLM analysis (this will take several minutes)...');
    console.log('⚠️  This test requires API calls and may take 3-5 minutes');
    
    // Run analysis
    const result = await service.analyze();
    
    if (result.success) {
      console.log('\n✅ LLM Analysis test PASSED');
      console.log(`⏱️  Duration: ${result.stats.duration.toFixed(2)}s`);
      console.log(`📸 Screenshots analyzed: ${result.stats.screenshots}`);
      console.log(`🚦 Lighthouse reports analyzed: ${result.stats.lighthouseReports}`);
      console.log(`📄 Page analyses generated: ${result.stats.pageAnalyses}`);
      console.log(`📁 Analysis saved to: ${result.files.analysis}`);
      console.log(`📄 Metadata saved to: ${result.files.metadata}`);
      
      // Verify files were created
      const analysisExists = await fs.pathExists(result.files.analysis);
      const metadataExists = await fs.pathExists(result.files.metadata);
      
      if (analysisExists && metadataExists) {
        console.log('\n✅ Files verified:');
        
        // Check file sizes
        const analysisStats = await fs.stat(result.files.analysis);
        const metadataStats = await fs.stat(result.files.metadata);
        
        console.log(`   📄 analysis.json: ${(analysisStats.size / 1024).toFixed(2)} KB`);
        console.log(`   📄 analysis-metadata.json: ${(metadataStats.size / 1024).toFixed(2)} KB`);
        
        // Show analysis structure
        const analysisData = await fs.readJson(result.files.analysis);
        console.log('\n📊 Analysis structure:');
        console.log(`   🕒 Timestamp: ${analysisData.timestamp}`);
        console.log(`   🤖 Provider: ${analysisData.provider}`);
        console.log(`   📝 Model: ${analysisData.model}`);
        console.log(`   📄 Page analyses: ${analysisData.pageAnalyses?.length || 0}`);
        console.log(`   🔧 Technical summary: ${analysisData.technicalSummary ? 'Generated' : 'Missing'}`);
        console.log(`   📊 Overview: ${analysisData.overview ? 'Generated' : 'Missing'}`);
        
        // Show sample page analysis
        if (analysisData.pageAnalyses && analysisData.pageAnalyses.length > 0) {
          const firstPage = analysisData.pageAnalyses[0];
          console.log(`\n📋 Sample page analysis:`);
          console.log(`   🌐 URL: ${firstPage.url}`);
          console.log(`   📝 Analysis length: ${firstPage.analysis?.length || 0} characters`);
        }
        
      } else {
        console.log('❌ Expected files NOT found');
      }
      
    } else {
      console.log('❌ LLM Analysis test FAILED');
      console.log(`Error: ${result.error}`);
    }
    
  } catch (error) {
    console.log('❌ Test threw an exception:', error.message);
    if (error.message.includes('API key')) {
      console.log('💡 Make sure your ANTHROPIC_API_KEY is set correctly');
    }
  }
  
  console.log('\n🏁 LLM Analysis test completed');
}

// Run the test
testLLMAnalysisService().catch(console.error);