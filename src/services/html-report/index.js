const fs = require('fs-extra');
const path = require('path');
const { ReportGenerator } = require('./generators/report-generator');

class HTMLReportService {
  constructor(options = {}) {
    this.outputDir = options.outputDir || './data/reports';
    this.screenshotsDir = options.screenshotsDir || './data/screenshots';
  }

  async generate(analysisData) {
    console.log('📄 HTML Report Service Starting...');
    console.log(`📸 Screenshots: ${this.screenshotsDir}`);
    console.log(`📁 Output: ${this.outputDir}`);
    
    const startTime = Date.now();
    
    try {
      // Ensure output directory exists
      console.log(`📁 Ensuring output directory exists: ${this.outputDir}`);
      await fs.ensureDir(this.outputDir);
      
      // Verify we have analysis data
      if (!analysisData) {
        throw new Error('No analysis data provided');
      }
      
      // Initialize report generator
      const generator = new ReportGenerator({
        outputDir: this.outputDir,
        screenshotsDir: this.screenshotsDir
      });
      
      // Generate reports
      console.log('\n🎨 Generating HTML reports...');
      const success = await generator.generateAllReports(analysisData);
      
      if (!success) {
        throw new Error('HTML report generation failed');
      }
      
      const duration = (Date.now() - startTime) / 1000;
      
      // List files in output directory
      console.log(`\n📄 Listing files in ${this.outputDir}:`);
      const files = await fs.readdir(this.outputDir);
      console.log(files.join(', '));
      
      // Summary
      console.log('\n🎉 HTML reports generated successfully');
      console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
      console.log(`📁 Reports saved to: ${this.outputDir}`);
      
      return {
        success: true,
        duration: duration,
        outputDir: this.outputDir,
        files: {
          mainReport: path.join(this.outputDir, 'index.html'),
          executiveSummary: path.join(this.outputDir, 'executive-summary.html'),
          technicalSummary: path.join(this.outputDir, 'technical-summary.html'),
          pagesIndex: path.join(this.outputDir, 'pages', 'index.html'),
          screenshotsDir: path.join(this.outputDir, 'screenshots')
        },
        generatedFiles: files
      };
      
    } catch (error) {
      console.error('❌ HTML Report Service failed:', error);
      
      // Generate error report as fallback
      await this.generateErrorReport(error.message);
      
      return {
        success: false,
        error: error.message,
        duration: (Date.now() - startTime) / 1000,
        files: {
          errorReport: path.join(this.outputDir, 'index.html')
        }
      };
    }
  }

  async generateFromFile(analysisFilePath) {
    console.log('📄 HTML Report Service Starting...');
    console.log(`📥 Input: ${analysisFilePath}`);
    console.log(`📸 Screenshots: ${this.screenshotsDir}`);
    console.log(`📁 Output: ${this.outputDir}`);
    
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
        error: error.message,
        files: {}
      };
    }
  }

  async generateErrorReport(errorMessage) {
    try {
      await fs.ensureDir(this.outputDir);
      
      const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Analysis Report Error</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            .container { max-width: 800px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 5px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            h1 { color: #e74c3c; }
            .error-box { background: #fff5f5; border-left: 4px solid #e74c3c; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Analysis Report Error</h1>
            <div class="error-box">
              <p><strong>Error:</strong> ${errorMessage}</p>
              <p>The analysis process did not complete successfully. No data is available to generate reports.</p>
              <p>Please check the logs for more information and try running the analysis again.</p>
            </div>
            <h2>Possible Issues:</h2>
            <ul>
              <li>API key not set or invalid</li>
              <li>Network connectivity problems</li>
              <li>Timeout during analysis</li>
              <li>Error in the analysis process</li>
              <li>Missing or corrupted input data</li>
            </ul>
            <h2>Next Steps:</h2>
            <ol>
              <li>Check that all previous services completed successfully</li>
              <li>Verify API keys and network connectivity</li>
              <li>Review the console logs for specific error details</li>
              <li>Re-run the analysis pipeline from the beginning</li>
            </ol>
          </div>
        </body>
        </html>
      `;
      
      await fs.writeFile(path.join(this.outputDir, 'index.html'), errorHtml);
      console.log(`⚠️  Generated error report: ${path.join(this.outputDir, 'index.html')}`);
      
    } catch (err) {
      console.error('Failed to generate error report:', err);
    }
  }
}

module.exports = { HTMLReportService };