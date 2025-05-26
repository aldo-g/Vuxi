const fs = require('fs-extra');
const path = require('path');
const { FormattingService } = require('../src/services/formatting');

async function testFormattingService() {
  console.log('🧪 Testing Formatting Service...\n');
  
  try {
    // Check if API key is available
    if (!process.env.ANTHROPIC_API_KEY) {
      console.log('❌ ANTHROPIC_API_KEY environment variable is not set');
      console.log('Please set your API key with: export ANTHROPIC_API_KEY=your-api-key');
      return;
    }
    
    // Check prerequisites
    const analysisPath = './data/analysis/analysis.json';
    
    if (!await fs.pathExists(analysisPath)) {
      console.log('❌ No raw analysis data found. Please run LLM analysis test first.');
      console.log('   Run: npm run test:llm-analysis');
      return;
    }
    
    console.log('✅ Prerequisites found');
    console.log(`📄 Raw analysis file: ${analysisPath}`);
    
    // Check analysis file content
    const rawData = await fs.readJson(analysisPath);
    const analysisKeys = Object.keys(rawData);
    console.log(`📊 Analysis data structure: ${analysisKeys.join(', ')}`);
    
    // Initialize service
    const service = new FormattingService({
      model: 'claude-3-7-sonnet-20250219',
      inputPath: analysisPath,
      outputPath: './data/analysis/structured-analysis.json'
    });
    
    console.log('\n🔄 Starting formatting (this may take 1-2 minutes)...');
    console.log('⚠️  This test requires API calls and may cost credits');
    
    // Run formatting
    const result = await service.format();
    
    if (result.success) {
      console.log('\n✅ Formatting test PASSED');
      console.log(`⏱️  Duration: ${result.stats.duration.toFixed(2)}s`);
      console.log(`📥 Input size: ${(result.stats.inputSize / 1024).toFixed(2)} KB`);
      console.log(`📤 Output size: ${(result.stats.outputSize / 1024).toFixed(2)} KB`);
      console.log(`📁 Structured data saved to: ${result.files.output}`);
      
      // Verify file was created
      const outputExists = await fs.pathExists(result.files.output);
      
      if (outputExists) {
        console.log('\n✅ File verified:');
        
        // Check file size
        const outputStats = await fs.stat(result.files.output);
        console.log(`   📄 structured-analysis.json: ${(outputStats.size / 1024).toFixed(2)} KB`);
        
        // Show structured data structure
        const structuredData = await fs.readJson(result.files.output);
        console.log('\n📊 Structured data contains:');
        console.log(`   📋 Overview: ${structuredData.overview ? 'Generated' : 'Missing'}`);
        console.log(`   📊 Scores: ${structuredData.scores?.length || 0} categories`);
        console.log(`   ❌ Critical issues: ${structuredData.critical_issues?.length || 0}`);
        console.log(`   💡 Recommendations: ${structuredData.recommendations?.length || 0}`);
        console.log(`   ✅ Strengths: ${structuredData.strengths?.length || 0}`);
        console.log(`   🔧 Technical summary: ${structuredData.technical_summary ? 'Generated' : 'Missing'}`);
        console.log(`   📄 Page analyses: ${structuredData.page_analyses?.length || 0}`);
        
        // Show sample scores if available
        if (structuredData.scores && structuredData.scores.length > 0) {
          console.log('\n📈 Sample scores:');
          structuredData.scores.slice(0, 3).forEach(score => {
            console.log(`   ${score.category}: ${score.score}/10`);
          });
          
          if (structuredData.scores.length > 3) {
            console.log(`   ... and ${structuredData.scores.length - 3} more`);
          }
        }
        
        // Show overall score if available
        if (structuredData.overview?.overall_score) {
          console.log(`\n🎯 Overall Score: ${structuredData.overview.overall_score}/10`);
        }
        
      } else {
        console.log('❌ Expected output file NOT found');
      }
      
    } else {
      console.log('❌ Formatting test FAILED');
      console.log(`Error: ${result.error}`);
      
      if (result.data) {
        console.log('📄 Partial data was saved for debugging');
      }
    }
    
  } catch (error) {
    console.log('❌ Test threw an exception:', error.message);
    if (error.message.includes('API key')) {
      console.log('💡 Make sure your ANTHROPIC_API_KEY is set correctly');
    }
  }
  
  console.log('\n🏁 Formatting test completed');
}

// Run the test
testFormattingService().catch(console.error);