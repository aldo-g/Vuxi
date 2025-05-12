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
    const overview = this.parseOverviewAnalysis(analysisData.overview);
    
    const context = {
      organization: this.extractOrganization(analysisData),
      analysis_date: new Date(analysisData.timestamp).toLocaleDateString(),
      timestamp: analysisData.timestamp,
      overview_content: overview,
      screenshots_analyzed: analysisData.pageAnalyses ? analysisData.pageAnalyses.length : 0,
      common_styles: this.templateSystem.getCommonStyles()
    };
    
    const html = this.templateSystem.render('overview.html', context);
    const outputPath = path.join(this.outputDir, 'index.html');
    
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, html);
    console.log(`    ✅ Generated: ${outputPath}`);
  }
  
  async generatePageReports(analysisData) {
    console.log('  📑 Generating page reports...');
    
    const pageAnalyses = analysisData.pageAnalyses || [];
    const pagesDir = path.join(this.outputDir, 'pages');
    
    await fs.ensureDir(pagesDir);
    
    // Generate individual page reports
    for (const page of pageAnalyses) {
      const pageData = this.parsePageAnalysis(page);
      const pageName = this.sanitizeFilename(page.url);
      
      const context = {
        organization: this.extractOrganization(analysisData),
        page_url: page.url,
        page_type: this.getPageType(page.url),
        analysis_date: new Date(analysisData.timestamp).toLocaleDateString(),
        page_analysis: pageData,
        screenshot_path: this.getScreenshotPath(page.url),
        common_styles: this.templateSystem.getCommonStyles()
      };
      
      const html = this.templateSystem.render('page-analysis.html', context);
      const outputPath = path.join(pagesDir, `${pageName}.html`);
      
      await fs.ensureDir(path.dirname(outputPath));
      await fs.writeFile(outputPath, html);
      console.log(`    ✅ Generated: ${outputPath}`);
    }
    
    try {
      // Generate pages index
      await this.generatePagesIndex(analysisData, pagesDir);
    } catch (error) {
      console.error(`    ⚠️ Warning: Could not generate pages index: ${error.message}`);
      // Create a simple index instead
      const simpleIndex = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Page Analysis Index</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
      .container { max-width: 800px; margin: 0 auto; }
      h1 { color: #2c3e50; }
      .page-list { margin-top: 20px; }
      .page-item { margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
      a { color: #3498db; text-decoration: none; }
      a:hover { text-decoration: underline; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Page Analyses</h1>
      <p><a href="../index.html">← Back to Overview</a></p>
      <div class="page-list">
        ${(analysisData.pageAnalyses || []).map(page => `
          <div class="page-item">
            <a href="${this.sanitizeFilename(page.url)}.html">${this.getPageType(page.url)}</a>
            <p>${page.url}</p>
          </div>
        `).join('')}
      </div>
    </div>
  </body>
  </html>`;
      
      const indexPath = path.join(pagesDir, 'index.html');
      await fs.writeFile(indexPath, simpleIndex);
      console.log(`    ✅ Generated fallback index: ${indexPath}`);
    }
  }
  
  async generatePagesIndex(analysisData, pagesDir) {
    console.log('    📄 Generating pages index...');
    const pageAnalyses = analysisData.pageAnalyses || [];
    
    const context = {
      organization: this.extractOrganization(analysisData),
      analysis_date: new Date(analysisData.timestamp).toLocaleDateString(),
      pages: pageAnalyses.map(page => ({
        name: this.getPageType(page.url),
        url: page.url,
        filename: `${this.sanitizeFilename(page.url)}.html`
      })),
      common_styles: this.templateSystem.getCommonStyles()
    };
    
    try {
      const html = this.templateSystem.render('pages-index.html', context);
      const outputPath = path.join(pagesDir, 'index.html');
      
      await fs.ensureDir(path.dirname(outputPath));
      await fs.writeFile(outputPath, html);
      console.log(`    ✅ Generated: ${outputPath}`);
    } catch (error) {
      console.error(`    ❌ Error rendering pages index: ${error.message}`);
      throw error; // Let the calling function handle this with a fallback
    }
  }
  
  async generatePagesIndex(analysisData) {
    const pageAnalyses = analysisData.pageAnalyses || [];
    
    const context = {
      organization: this.extractOrganization(analysisData),
      analysis_date: new Date(analysisData.timestamp).toLocaleDateString(),
      pages: pageAnalyses.map(page => ({
        name: this.getPageType(page.url),
        url: page.url,
        filename: `${this.sanitizeFilename(page.url)}.html`
      })),
      common_styles: this.templateSystem.getCommonStyles()
    };
    
    const html = this.templateSystem.render('pages-index.html', context);
    const outputPath = path.join(this.outputDir, 'pages', 'index.html');
    
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, html);
    console.log(`    ✅ Generated: ${outputPath}`);
  }
  
  async generateTechnicalReport(analysisData) {
    console.log('  🔧 Generating technical report...');
    
    const technical = this.parseTechnicalSummary(analysisData.technicalSummary);
    
    const context = {
      organization: this.extractOrganization(analysisData),
      analysis_date: new Date(analysisData.timestamp).toLocaleDateString(),
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
    
    const summary = this.createExecutiveSummary(analysisData);
    
    const context = {
      organization: this.extractOrganization(analysisData),
      report_date: new Date(analysisData.timestamp).toLocaleDateString(),
      summary_results: summary,
      common_styles: this.templateSystem.getCommonStyles()
    };
    
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
        
        // Create a placeholder image
        const placeholderPath = path.join(outputScreenshotsDir, 'desktop', 'placeholder.png');
        await fs.writeFile(placeholderPath, 'Placeholder for screenshot');
        console.log(`    ✅ Created placeholder: ${placeholderPath}`);
      }
      
      console.log(`    ✅ Screenshots setup to: ${outputScreenshotsDir}`);
    } catch (error) {
      console.error(`    ❌ Error copying screenshots: ${error.message}`);
    }
  }
  
  // Helper methods
  extractOrganization(analysisData) {
    // Try to extract organization name from the data
    return 'Website Analysis'; // Default fallback
  }
  
  parseOverviewAnalysis(overviewText) {
    if (!overviewText) return {
      executive_summary: 'No overview analysis available',
      key_findings: [],
      strategic_recommendations: [],
      theme_assessment: [],
      implementation_roadmap: []
    };
    
    // Parse the overview text into structured sections
    const sections = this.extractSections(overviewText);
    
    return {
      executive_summary: sections['EXECUTIVE SUMMARY'] || sections['OVERALL ASSESSMENT'] || '',
      key_findings: this.extractList(sections['KEY FINDINGS'] || sections['STRENGTHS'] || ''),
      strategic_recommendations: this.extractList(sections['STRATEGIC RECOMMENDATIONS'] || sections['ACTIONABLE RECOMMENDATIONS'] || ''),
      theme_assessment: this.extractList(sections['OVERALL THEME ASSESSMENT'] || ''),
      implementation_roadmap: this.extractList(sections['IMPLEMENTATION ROADMAP'] || '')
    };
  }
  
  parsePageAnalysis(pageData) {
    if (!pageData || !pageData.analysis) return null;
    
    const sections = this.extractSections(pageData.analysis);
    
    return {
      scores: this.extractScores(sections),
      critical_flaws: this.extractList(sections['CRITICAL FLAWS'] || ''),
      recommendations: this.extractList(sections['ACTIONABLE RECOMMENDATIONS'] || sections['RECOMMENDATIONS'] || ''),
      summary: sections['SUMMARY'] || '',
      full_analysis: pageData.analysis
    };
  }
  
  parseTechnicalSummary(technicalText) {
    if (!technicalText) return {
      performance_overview: 'No technical summary available',
      key_metrics: [],
      optimization_opportunities: [],
      implementation_priorities: []
    };
    
    const sections = this.extractSections(technicalText);
    
    return {
      performance_overview: sections['PERFORMANCE OVERVIEW'] || sections['TECHNICAL OVERVIEW'] || '',
      key_metrics: this.extractList(sections['TECHNICAL FINDINGS'] || sections['KEY METRICS'] || ''),
      optimization_opportunities: this.extractList(sections['PERFORMANCE OPTIMIZATIONS'] || ''),
      implementation_priorities: this.extractList(sections['IMPLEMENTATION PRIORITIES'] || '')
    };
  }
  
  createExecutiveSummary(analysisData) {
    const overview = this.parseOverviewAnalysis(analysisData.overview);
    const technical = this.parseTechnicalSummary(analysisData.technicalSummary);
    
    // Extract page summaries
    const pageSummaries = {};
    if (analysisData.pageAnalyses) {
      analysisData.pageAnalyses.forEach(page => {
        const pageType = this.getPageType(page.url);
        const pageData = this.parsePageAnalysis(page);
        if (pageData && pageData.summary) {
          pageSummaries[pageType] = pageData.summary;
        }
      });
    }
    
    return {
      overview: overview.executive_summary,
      critical_issues: this.combineCriticalIssues(analysisData),
      recommendations: this.combineRecommendations(analysisData),
      strengths: overview.key_findings,
      technical: technical.performance_overview,
      page_summaries: pageSummaries
    };
  }
  
  combineCriticalIssues(analysisData) {
    const issues = [];
    
    // Extract critical issues from overview
    const overview = this.parseOverviewAnalysis(analysisData.overview);
    if (overview.key_findings) {
      overview.key_findings.forEach(finding => {
        if (finding.includes('critical') || finding.includes('issue') || finding.includes('problem')) {
          issues.push(finding);
        }
      });
    }
    
    // Extract critical issues from pages
    if (analysisData.pageAnalyses) {
      analysisData.pageAnalyses.forEach(page => {
        const pageData = this.parsePageAnalysis(page);
        if (pageData && pageData.critical_flaws) {
          pageData.critical_flaws.forEach(flaw => {
            issues.push(`${this.getPageType(page.url)}: ${flaw}`);
          });
        }
      });
    }
    
    return issues.slice(0, 10); // Limit to top 10 issues
  }
  
  combineRecommendations(analysisData) {
    const recommendations = [];
    
    // Extract recommendations from overview
    const overview = this.parseOverviewAnalysis(analysisData.overview);
    if (overview.strategic_recommendations) {
      recommendations.push(...overview.strategic_recommendations);
    }
    
    // Extract high-impact recommendations from pages
    if (analysisData.pageAnalyses) {
      analysisData.pageAnalyses.forEach(page => {
        const pageData = this.parsePageAnalysis(page);
        if (pageData && pageData.recommendations) {
          pageData.recommendations.forEach(rec => {
            if (rec.includes('High') || rec.includes('Priority')) {
              recommendations.push(`${this.getPageType(page.url)}: ${rec}`);
            }
          });
        }
      });
    }
    
    return recommendations.slice(0, 8); // Limit to top 8 recommendations
  }
  
  extractSections(text) {
    const sections = {};
    let currentSection = null;
    let currentContent = [];
    
    const lines = text.split('\n');
    
    for (const line of lines) {
      // Check if line is a section header
      if (line.match(/^[A-Z][A-Z\s&-]+:?$/)) {
        // Save previous section
        if (currentSection) {
          sections[currentSection] = currentContent.join('\n').trim();
        }
        
        // Start new section
        currentSection = line.replace(':', '').trim();
        currentContent = [];
      } else if (currentSection) {
        // Add to current section
        currentContent.push(line);
      }
    }
    
    // Save last section
    if (currentSection) {
      sections[currentSection] = currentContent.join('\n').trim();
    }
    
    return sections;
  }
  
  extractList(text) {
    if (!text) return [];
    
    // Extract numbered or bulleted lists
    const listItems = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.match(/^[•\-*]/) || trimmed.match(/^\d+\./)) {
        listItems.push(trimmed.replace(/^[•\-*]\s*/, '').replace(/^\d+\.\s*/, ''));
      }
    }
    
    return listItems;
  }
  
  extractScores(sections) {
    const scores = [];
    
    for (const [sectionName, content] of Object.entries(sections)) {
      const scoreMatch = content.match(/Score: (\d+)\/10/);
      if (scoreMatch) {
        scores.push({
          category: sectionName,
          score: parseInt(scoreMatch[1]),
          description: this.extractFirstLine(content)
        });
      }
    }
    
    return scores;
  }
  
  extractFirstLine(text) {
    if (!text) return '';
    const lines = text.split('\n');
    return lines.find(line => line.trim() && !line.includes('Score:')) || '';
  }
  
  sanitizeFilename(url) {
    return url
      .replace(/^https?:\/\//, '')
      .replace(/[^a-zA-Z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
  }
  
  getPageType(url) {
    const urlObj = new URL(url);
    const path = urlObj.pathname.toLowerCase();
    
    if (path === '/' || path === '') {
      return 'Homepage';
    } else if (path.includes('contact')) {
      return 'Contact Page';
    } else if (path.includes('about')) {
      return 'About Page';
    } else if (path.includes('privacy')) {
      return 'Privacy Policy';
    } else {
      // Extract page name from URL
      const segments = path.split('/').filter(Boolean);
      const lastSegment = segments[segments.length - 1] || 'Page';
      return lastSegment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
  }
  
  getScreenshotPath(url) {
    const filename = this.sanitizeFilename(url);
    return `../screenshots/desktop/${filename}.png`;
  }
}

module.exports = { ReportGenerator };