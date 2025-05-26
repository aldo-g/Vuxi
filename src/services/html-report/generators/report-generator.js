// html-report-service/src/generators/report-generator.js

const fs = require('fs-extra');
const path = require('path');
const { TemplateSystem } = require('./template-system');

class ReportGenerator {
  constructor(options = {}) {
    this.outputDir = options.outputDir || '/app/data/reports';
    this.screenshotsDir = options.screenshotsDir || '/app/data/screenshots';
    this.templateSystem = new TemplateSystem();
    
    // Ensure output directory exists
    console.log(`📁 Creating output directory: ${this.outputDir}`);
    fs.ensureDirSync(this.outputDir);
  }
  
  async generateAllReports(analysisData) {
    try {
      console.log(`🔍 Generating reports in: ${this.outputDir}`);
      
      // Generate main overview report
      await this.generateOverviewReport(analysisData);
      
      // Generate individual page reports
      await this.generatePageReports(analysisData);
      
      // Generate technical summary
      await this.generateTechnicalReport(analysisData);
      
      // Generate executive summary
      await this.generateExecutiveSummary(analysisData);
      
      // Copy screenshots
      await this.copyScreenshots();
      
      // Create a test file to verify directory exists
      const testFilePath = path.join(this.outputDir, 'generation-successful.txt');
      await fs.writeFile(testFilePath, `Reports generated at ${new Date().toISOString()}`);
      console.log(`✅ Generation verification file created: ${testFilePath}`);
      
      // List the output directory contents
      const files = await fs.readdir(this.outputDir);
      console.log(`📄 Generated files: ${files.join(', ')}`);
      
      return true;
    } catch (error) {
      console.error(`❌ Error generating reports: ${error.message}`);
      console.error(error.stack);
      return false;
    }
  }
  
  async generateOverviewReport(analysisData) {
    console.log('  📋 Generating overview report...');
    
    // Process the overview analysis
    const overview = {
      executive_summary: analysisData.overview?.executive_summary || 'No overview available',
      key_findings: analysisData.strengths || [],
      strategic_recommendations: analysisData.recommendations || []
    };
    
    const context = {
      organization: "Edinburgh Peace Institute",
      analysis_date: new Date().toLocaleDateString(),
      overview_content: overview,
      screenshots_analyzed: analysisData.page_analyses?.length || 0,
      scores: analysisData.scores || []  // Pass the scores array from the JSON data
    };
    
    // Add common styles
    context.common_styles = this.templateSystem.getCommonStyles();
    
    const html = this.templateSystem.render('overview.html', context);
    const outputPath = path.join(this.outputDir, 'index.html');
    
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, html);
    console.log(`    ✅ Generated: ${outputPath}`);
  }
  
  async generatePageReports(analysisData) {
    console.log('  📑 Generating page reports...');
    
    // Check if page analyses exist in the expected format
    let pageAnalyses = [];
    if (Array.isArray(analysisData.page_analyses)) {
      pageAnalyses = analysisData.page_analyses;
    }
    
    const pagesDir = path.join(this.outputDir, 'pages');
    await fs.ensureDir(pagesDir);
    
    // Generate individual page reports
    for (const page of pageAnalyses) {
      const pageData = {
        scores: page.scores || [], // Add scores from page data if available
        critical_flaws: page.critical_flaws || [],
        recommendations: page.recommendations || [],
        summary: page.summary || 'No summary available',
        full_analysis: JSON.stringify(page, null, 2)
      };
      
      const pageName = this.sanitizeFilename(page.url || '');
      
      const context = {
        organization: "Edinburgh Peace Institute",
        page_url: page.url || '',
        page_type: page.page_type || this.getPageType(page.url || ''),
        analysis_date: new Date().toLocaleDateString(),
        page_analysis: pageData,
        screenshot_path: this.findScreenshotPath(page.url || ''),
        common_styles: this.templateSystem.getCommonStyles()
      };
      
      const html = this.templateSystem.render('page-analysis.html', context);
      const outputPath = path.join(pagesDir, `${pageName}.html`);
      
      await fs.ensureDir(path.dirname(outputPath));
      await fs.writeFile(outputPath, html);
      console.log(`    ✅ Generated: ${outputPath}`);
    }
    
    // Generate pages index
    await this.generatePagesIndex(analysisData, pageAnalyses);
  }
  
  async generatePagesIndex(analysisData, pageAnalyses) {
    console.log('    📄 Generating pages index...');
    const pagesDir = path.join(this.outputDir, 'pages');
    
    const context = {
      organization: "Edinburgh Peace Institute",
      analysis_date: new Date().toLocaleDateString(),
      pages: pageAnalyses.map(page => ({
        name: page.page_type || this.getPageType(page.url || ''),
        url: page.url || '',
        filename: `${this.sanitizeFilename(page.url || '')}.html`
      })),
      common_styles: this.templateSystem.getCommonStyles()
    };
    
    try {
      const html = this.templateSystem.render('page-index.html', context);
      const outputPath = path.join(pagesDir, 'index.html');
      
      await fs.ensureDir(path.dirname(outputPath));
      await fs.writeFile(outputPath, html);
      console.log(`    ✅ Generated: ${outputPath}`);
    } catch (error) {
      console.error(`    ❌ Error rendering pages index: ${error.message}`);
      throw error;
    }
  }
  
  async generateTechnicalReport(analysisData) {
    console.log('  🔧 Generating technical report...');
    
    const technical = {
      performance_overview: analysisData.technical_summary || 'No technical summary available',
      key_metrics: [],
      optimization_opportunities: [],
      implementation_priorities: []
    };
    
    const context = {
      organization: "Edinburgh Peace Institute",
      analysis_date: new Date().toLocaleDateString(),
      technical_content: technical,
      common_styles: this.templateSystem.getCommonStyles()
    };
    
    const html = this.templateSystem.render('technical-summary.html', context);
    const outputPath = path.join(this.outputDir, 'technical-summary.html');
    
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, html);
    console.log(`    ✅ Generated: ${outputPath}`);
  }
  
  async generateExecutiveSummary(analysisData) {
    console.log('  📊 Generating executive summary...');
    
    // Create a simple context object with all the needed data
    const context = {
      organization: "Edinburgh Peace Institute",
      report_date: new Date().toLocaleDateString(),
      overview: analysisData.overview?.executive_summary || '',
      overall_score: analysisData.overview?.overall_score || 5,
      critical_issues: analysisData.critical_issues || [],
      recommendations: analysisData.recommendations || [],
      strengths: analysisData.strengths || [],
      technical_summary: analysisData.technical_summary || 'No technical summary available',
      page_summaries: [],
      scores: analysisData.scores || []
    };
    
    // Process page summaries
    if (analysisData.page_analyses && Array.isArray(analysisData.page_analyses)) {
      analysisData.page_analyses.forEach(page => {
        if (page.summary) {
          context.page_summaries.push({
            name: page.page_type || '',
            summary: page.summary
          });
        }
      });
    }
    
    // Add common styles
    context.common_styles = this.templateSystem.getCommonStyles();
    
    const html = this.templateSystem.render('executive-summary.html', context);
    const outputPath = path.join(this.outputDir, 'executive-summary.html');
    
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, html);
    console.log(`    ✅ Generated: ${outputPath}`);
  }
  
  async copyScreenshots() {
    console.log('  📸 Copying screenshots...');
    
    try {
      const outputScreenshotsDir = path.join(this.outputDir, 'screenshots');
      await fs.ensureDir(outputScreenshotsDir);
      
      // Create desktop directory
      await fs.ensureDir(path.join(outputScreenshotsDir, 'desktop'));
      
      // Copy desktop screenshots
      const desktopDir = path.join(this.screenshotsDir, 'desktop');
      if (await fs.pathExists(desktopDir)) {
        // List files in desktop directory
        const files = await fs.readdir(desktopDir);
        
        // Copy each file individually
        for (const file of files) {
          const srcPath = path.join(desktopDir, file);
          const destPath = path.join(outputScreenshotsDir, 'desktop', file);
          
          // Only copy PNG files
          if (file.endsWith('.png')) {
            await fs.copy(srcPath, destPath);
            console.log(`    ✅ Copied: ${file}`);
          }
        }
      } else {
        console.log(`    ⚠️ Desktop screenshots directory not found: ${desktopDir}`);
        
        // Check if there are screenshots in the root screenshots directory
        const rootScreenshots = await fs.readdir(this.screenshotsDir);
        const pngFiles = rootScreenshots.filter(file => file.endsWith('.png'));
        
        if (pngFiles.length > 0) {
          console.log(`    ℹ️ Found ${pngFiles.length} PNG files in root screenshots directory, copying them...`);
          
          for (const file of pngFiles) {
            const srcPath = path.join(this.screenshotsDir, file);
            const destPath = path.join(outputScreenshotsDir, 'desktop', file);
            
            await fs.copy(srcPath, destPath);
            console.log(`    ✅ Copied: ${file}`);
          }
        } else {
          // Create a placeholder image
          const placeholderPath = path.join(outputScreenshotsDir, 'desktop', 'placeholder.png');
          await fs.writeFile(placeholderPath, 'Placeholder for screenshot');
          console.log(`    ✅ Created placeholder: ${placeholderPath}`);
        }
      }
      
      console.log(`    ✅ Screenshots setup to: ${outputScreenshotsDir}`);
    } catch (error) {
      console.error(`    ❌ Error copying screenshots: ${error.message}`);
    }
  }
  
  sanitizeFilename(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/\./g, '-') + urlObj.pathname
        .replace(/[^a-zA-Z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase();
    } catch (e) {
      // Fallback for invalid URLs
      return url
        .replace(/[^a-zA-Z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase() || 'page';
    }
  }
  
  getPageType(url) {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname.toLowerCase();
      
      if (path === '/' || path === '' || path.includes('index')) {
        return 'Homepage';
      } else if (path.includes('contact')) {
        return 'Contact Page';
      } else if (path.includes('about')) {
        return 'About Page';
      } else if (path.includes('privacy')) {
        return 'Privacy Policy';
      } else if (path.includes('cart')) {
        return 'Cart Page';
      } else if (path.includes('training')) {
        return 'Training Page';
      } else if (path.includes('research')) {
        return 'Research Page';
      } else if (path.includes('project')) {
        return 'Projects Page';
      } else {
        // Extract page name from URL
        const segments = path.split('/').filter(Boolean);
        const lastSegment = segments[segments.length - 1] || 'Page';
        return lastSegment
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
    } catch (e) {
      return 'Page';
    }
  }
  
  findScreenshotPath(url) {
    if (!url) return 'placeholder.png';
    
    try {
      // Extract filename pattern from URL
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace(/^www\./, '');
      const path = urlObj.pathname.replace(/^\/|\/$/g, '').replace(/\//g, '_') || 'index';
      
      // Look for common filename patterns for screenshots
      // 1. Try index-based pattern: 000_domain_path.png
      // 2. Try direct domain_path.png
      // Use desktop as fallback
      return `edinburghpeaceinstitute.org_${path}.png`;
    } catch (e) {
      return 'placeholder.png';
    }
  }
}

module.exports = { ReportGenerator };