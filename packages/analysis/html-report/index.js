const fs = require('fs-extra');
const path = require('path');
const { ReportGenerator } = require('./generators/report-generator');

class HTMLReportService {
  constructor(options = {}) {
    this.outputDir = options.outputDir || './data/reports';
    this.screenshotsDir = options.screenshotsDir || './data/screenshots';
    this.nextJsPublicDir = options.nextJsPublicDir || path.join(__dirname, '../../../next-app/public');
  }

  async generate(analysisData) {
    console.log('📄 HTML Report Service Starting (Next.js Integration)...');
    console.log(`📸 Screenshots: ${this.screenshotsDir}`);
    console.log(`🌐 Next.js public dir: ${this.nextJsPublicDir}`);
    
    const startTime = Date.now();
    
    try {
      // Verify we have analysis data
      if (!analysisData) {
        throw new Error('No analysis data provided');
      }
      
      // Initialize report generator for Next.js integration
      const generator = new ReportGenerator({
        outputDir: this.outputDir,
        screenshotsDir: this.screenshotsDir,
        nextJsPublicDir: this.nextJsPublicDir
      });
      
      // Generate reports for Next.js app
      console.log('\n🎨 Generating reports for Next.js app...');
      const success = await generator.generateAllReports(analysisData);
      
      if (!success) {
        throw new Error('HTML report generation failed');
      }
      
      const duration = (Date.now() - startTime) / 1000;
      
      console.log('\n🎉 Next.js reports generated successfully');
      console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
      console.log(`🌐 Access reports at: http://localhost:3000/reports`);
      
      return {
        success: true,
        duration: duration,
        outputDir: this.nextJsPublicDir,
        message: 'Reports generated for Next.js app'
      };
      
    } catch (error) {
      console.error('❌ HTML Report Service failed:', error);
      
      return {
        success: false,
        error: error.message,
        duration: (Date.now() - startTime) / 1000
      };
    }
  }

  async generateFromFile(analysisFilePath) {
    console.log('📄 HTML Report Service Starting (Next.js Integration)...');
    console.log(`📥 Input: ${analysisFilePath}`);
    console.log(`📸 Screenshots: ${this.screenshotsDir}`);
    console.log(`🌐 Next.js public dir: ${this.nextJsPublicDir}`);
    
    try {
      // Check if analysis file exists
      if (!await fs.pathExists(analysisFilePath)) {
        throw new Error(`Analysis file not found: ${analysisFilePath}`);
      }
      
      // Read analysis data
      console.log('\n📥 Reading analysis data...');
      const analysisData = await fs.readJson(analysisFilePath);
      
      // Generate reports using the main method
      return await this.generate(analysisData);
      
    } catch (error) {
      console.error('❌ Failed to load analysis file:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = { HTMLReportService };