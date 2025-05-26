const fs = require('fs-extra');
const path = require('path');
const { HTMLReportService } = require('../src/services/html-report');

async function testHTMLReportService() {
  console.log('🧪 Testing HTML Report Service...\n');
  
  try {
    // Check if we have analysis data from previous LLM analysis test
    const analysisPath = './data/analysis/analysis.json';
    let testMode = 'file';
    
    if (await fs.pathExists(analysisPath)) {
      console.log('📥 Found analysis data from previous LLM analysis...');
      
      // Test using analysis file
      console.log('🧪 Testing with analysis file...');
      
      const service = new HTMLReportService({
        outputDir: './data/reports',
        screenshotsDir: './data/screenshots'
      });
      
      const result = await service.generateFromFile(analysisPath);
      
      if (result.success) {
        console.log('\n✅ HTML Report test PASSED');
        console.log(`📄 Generated reports in ${result.outputDir}`);
        console.log(`⏱️  Duration: ${result.duration.toFixed(2)}s`);
        
        // Verify files were created
        const expectedFiles = [
          result.files.mainReport,
          result.files.executiveSummary,
          result.files.technicalSummary,
          result.files.pagesIndex
        ];
        
        console.log('\n✅ Verifying generated files:');
        for (const filePath of expectedFiles) {
          if (await fs.pathExists(filePath)) {
            const stats = await fs.stat(filePath);
            console.log(`   ✅ ${path.basename(filePath)} (${(stats.size / 1024).toFixed(2)} KB)`);
          } else {
            console.log(`   ❌ ${path.basename(filePath)} - NOT FOUND`);
          }
        }
        
        // Check screenshots were copied
        if (await fs.pathExists(result.files.screenshotsDir)) {
          const screenshots = await fs.readdir(path.join(result.files.screenshotsDir, 'desktop'));
          const pngFiles = screenshots.filter(f => f.endsWith('.png'));
          console.log(`   📸 ${pngFiles.length} screenshots copied`);
        }
        
        console.log('\n🌐 Open the report at: data/reports/index.html');
        
      } else {
        console.log('❌ HTML Report test FAILED');
        console.log(`Error: ${result.error}`);
      }
      
    } else {
      console.log('📝 No analysis data found, testing with mock data...');
      
      // Test with mock analysis data
      const mockAnalysisData = {
        timestamp: new Date().toISOString(),
        overview: {
          executive_summary: 'This is a test executive summary for HTML report generation.',
          overall_score: 7
        },
        scores: [
          {
            category: 'Design',
            score: 8,
            description: 'Good visual design with room for improvement'
          },
          {
            category: 'Usability',
            score: 7,
            description: 'Generally usable with some navigation issues'
          }
        ],
        critical_issues: [
          'Navigation consistency needs improvement',
          'Page load times could be optimized'
        ],
        recommendations: [
          'Standardize navigation across all pages',
          'Implement image optimization',
          'Add loading indicators for better UX'
        ],
        strengths: [
          'Clean visual design',
          'Good accessibility scores',
          'Mobile-responsive layout'
        ],
        technical_summary: 'Performance is generally good with some optimization opportunities.',
        page_analyses: [
          {
            url: 'https://example.com',
            page_type: 'Homepage',
            summary: 'Homepage provides good first impression but could improve call-to-action placement.',
            critical_flaws: ['CTA button not prominent enough'],
            recommendations: ['Make primary CTA more visible', 'Improve hero section messaging']
          }
        ]
      };
      
      const service = new HTMLReportService({
        outputDir: './data/reports',
        screenshotsDir: './data/screenshots'
      });
      
      const result = await service.generate(mockAnalysisData);
      
      if (result.success) {
        console.log('\n✅ HTML Report test with mock data PASSED');
        console.log(`📄 Generated ${result.generatedFiles.length} files`);
        console.log(`⏱️  Duration: ${result.duration.toFixed(2)}s`);
        console.log('\n🌐 Open the report at: data/reports/index.html');
      } else {
        console.log('❌ HTML Report test with mock data FAILED');
        console.log(`Error: ${result.error}`);
      }
    }
    
  } catch (error) {
    console.log('❌ Test threw an exception:', error.message);
  }
  
  console.log('\n🏁 HTML Report test completed');
}

// Run the test
testHTMLReportService().catch(console.error);