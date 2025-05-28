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
      
      // Generate overview report
      await this.generateOverviewReport(analysisData);
      
      // Generate individual page reports  
      await this.generateIndividualPageReports(analysisData);
      
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
    
    // Extract data from the structure
    const overallSummary = analysisData.overall_summary || {};
    const pageAnalyses = analysisData.page_analyses || [];
    
    const context = {
      organization: "Edinburgh Peace Institute",
      analysis_date: new Date().toLocaleDateString(),
      total_pages_analyzed: overallSummary.total_pages_analyzed || pageAnalyses.length,
      overall_score: overallSummary.overall_score || 5,
      executive_summary: overallSummary.executive_summary || 'No executive summary available',
      most_critical_issues: overallSummary.most_critical_issues || [],
      top_recommendations: overallSummary.top_recommendations || [],
      key_strengths: overallSummary.key_strengths || [],
      performance_summary: overallSummary.performance_summary || 'No performance summary available',
      page_summaries: pageAnalyses.map((page, index) => ({
        name: page.page_type || page.title || 'Page',
        url: page.url || '',
        summary: page.summary || 'No summary available',
        score: page.overall_score || 5,
        filename: this.createPageFilename(page),
        index: index
      })),
      common_styles: this.templateSystem.getCommonStyles()
    };
    
    const html = this.templateSystem.render('website-overview.html', context);
    const outputPath = path.join(this.outputDir, 'overview.html');
    
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, html);
    console.log(`    ✅ Generated: ${outputPath}`);
  }
  
  async generateIndividualPageReports(analysisData) {
    console.log('  📑 Generating individual page reports...');
    
    // Get page analyses from structure
    const pageAnalyses = analysisData.page_analyses || [];
    
    console.log(`    📄 Found ${pageAnalyses.length} pages to process`);
    
    // Generate individual page reports directly in output directory
    for (let i = 0; i < pageAnalyses.length; i++) {
      const page = pageAnalyses[i];
      
      console.log(`    📄 [${i+1}/${pageAnalyses.length}] Processing: ${page.page_type || 'Unknown'}`);
      
      // Clean the original analysis to remove repetitive sections
      const cleanedAnalysis = this.cleanAnalysisContent(page.original_analysis || '');
      
      const pageData = {
        overall_score: page.overall_score || 5,
        key_issues: page.key_issues || [],
        recommendations: page.recommendations || [],
        summary: page.summary || 'No summary available',
        original_analysis: page.original_analysis || 'No detailed analysis available',
        cleaned_analysis: cleanedAnalysis
      };
      
      const filename = this.createPageFilename(page);
      
      const context = {
        organization: "Edinburgh Peace Institute",
        page_url: page.url || '',
        page_type: page.page_type || this.getPageTypeFromUrl(page.url || ''),
        page_title: page.title || page.page_type || 'Page Analysis',
        analysis_date: new Date().toLocaleDateString(),
        page_analysis: pageData,
        screenshot_path: this.findScreenshotPath(page.url || '', i),
        common_styles: this.templateSystem.getCommonStyles()
      };
      
      const html = this.templateSystem.render('individual-page.html', context);
      const outputPath = path.join(this.outputDir, filename);
      
      await fs.ensureDir(path.dirname(outputPath));
      await fs.writeFile(outputPath, html);
      console.log(`    ✅ Generated: ${outputPath}`);
    }
  }
  
  cleanAnalysisContent(analysis) {
    if (!analysis) return 'No detailed analysis available';
    
    // Split by sections and extract PAGE ROLE ANALYSIS
    const lines = analysis.split('\n');
    const cleanedLines = [];
    const pageRoleLines = [];
    let currentSection = '';
    let skipSection = false;
    let inPageRoleSection = false;
    
    for (const line of lines) {
      // Check if we're starting PAGE ROLE ANALYSIS section
      if (line.includes('PAGE ROLE ANALYSIS:')) {
        inPageRoleSection = true;
        pageRoleLines.push(line);
        continue;
      }
      
      // If we're in PAGE ROLE ANALYSIS section, collect those lines
      if (inPageRoleSection) {
        // Stop collecting when we hit another major section or end
        if (line.includes('CRITICAL FLAWS:') || 
            line.includes('ACTIONABLE RECOMMENDATIONS:') || 
            line.includes('SUMMARY:')) {
          inPageRoleSection = false;
          skipSection = true;
          continue;
        } else {
          pageRoleLines.push(line);
          continue;
        }
      }
      
      // Check if we're starting a section to skip
      if (line.includes('CRITICAL FLAWS:') || 
          line.includes('ACTIONABLE RECOMMENDATIONS:') || 
          line.includes('SUMMARY:')) {
        skipSection = true;
        continue;
      }
      
      // Check if we're starting a new main section (reset skip)
      if (line.match(/^## \d+\./)) {
        skipSection = false;
      }
      
      // Add line if we're not skipping
      if (!skipSection) {
        cleanedLines.push(line);
      }
    }
    
    // Combine PAGE ROLE ANALYSIS at the beginning, then the main content
    const result = [];
    if (pageRoleLines.length > 0) {
      result.push(...pageRoleLines);
      result.push(''); // Add spacing
    }
    result.push(...cleanedLines);
    
    return result.join('\n').trim();
  }
  
  createPageFilename(page) {
    // Create clean filename from page type
    const pageType = page.page_type || this.getPageTypeFromUrl(page.url || '');
    return pageType
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') + '.html';
  }
  
  getPageTypeFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname.toLowerCase();
      
      if (path === '/' || path === '' || path.includes('index')) {
        return 'Homepage';
      } else if (path.includes('contact')) {
        return 'Contact Page';
      } else if (path.includes('about')) {
        return 'About Page';
      } else if (path.includes('cart')) {
        return 'Cart Page';
      } else if (path.includes('training')) {
        return 'Training Page';
      } else if (path.includes('research')) {
        return 'Research Page';
      } else if (path.includes('project')) {
        return 'Projects Page';
      } else {
        return 'Page';
      }
    } catch (e) {
      return 'Page';
    }
  }
  
  async copyScreenshots() {
    console.log('  📸 Copying screenshots...');
    
    try {
      const outputScreenshotsDir = path.join(this.outputDir, 'screenshots');
      await fs.ensureDir(outputScreenshotsDir);
      
      // Copy desktop screenshots
      const desktopDir = path.join(this.screenshotsDir, 'desktop');
      if (await fs.pathExists(desktopDir)) {
        const files = await fs.readdir(desktopDir);
        
        for (const file of files) {
          if (file.endsWith('.png')) {
            const srcPath = path.join(desktopDir, file);
            const destPath = path.join(outputScreenshotsDir, file);
            
            await fs.copy(srcPath, destPath);
            console.log(`    ✅ Copied: ${file}`);
          }
        }
      } else {
        console.log(`    ⚠️ Desktop screenshots directory not found: ${desktopDir}`);
        
        // Check root screenshots directory
        if (await fs.pathExists(this.screenshotsDir)) {
          const rootScreenshots = await fs.readdir(this.screenshotsDir);
          const pngFiles = rootScreenshots.filter(file => file.endsWith('.png'));
          
          if (pngFiles.length > 0) {
            console.log(`    ℹ️ Found ${pngFiles.length} PNG files in root, copying them...`);
            
            for (const file of pngFiles) {
              const srcPath = path.join(this.screenshotsDir, file);
              const destPath = path.join(outputScreenshotsDir, file);
              
              await fs.copy(srcPath, destPath);
              console.log(`    ✅ Copied: ${file}`);
            }
          }
        }
      }
      
      console.log(`    ✅ Screenshots copied to: ${outputScreenshotsDir}`);
    } catch (error) {
      console.error(`    ❌ Error copying screenshots: ${error.message}`);
    }
  }
  
  findScreenshotPath(url, index) {
    if (!url) return '000_placeholder.png';
    
    try {
      // Map URLs to their indexed screenshot filenames based on the pattern we see
      const urlMappings = {
        'https://edinburghpeaceinstitute.org/index': '000_edinburghpeaceinstitute.org_index.png',
        'https://edinburghpeaceinstitute.org/cart': '001_edinburghpeaceinstitute.org_cart.png',
        'https://edinburghpeaceinstitute.org/training': '002_edinburghpeaceinstitute.org_training.png',
        'https://edinburghpeaceinstitute.org/research': '003_edinburghpeaceinstitute.org_research.png',
        'https://edinburghpeaceinstitute.org/projects': '004_edinburghpeaceinstitute.org_projects.png',
        'https://edinburghpeaceinstitute.org/contact-us': '005_edinburghpeaceinstitute.org_contact-us.png'
      };
      
      // Check for exact match first
      if (urlMappings[url]) {
        return urlMappings[url];
      }
      
      // Fallback: try to construct filename from URL
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace(/^www\./, '');
      const path = urlObj.pathname.replace(/^\/|\/$/g, '').replace(/\//g, '_') || 'index';
      
      // Look for a file that matches this pattern (with index prefix)
      return `${String(index).padStart(3, '0')}_${domain}_${path}.png`;
    } catch (e) {
      return '000_placeholder.png';
    }
  }
}

module.exports = { ReportGenerator };