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
        screenshot_path: this.findScreenshotPath(page.url),
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
      await this.generatePagesIndex(analysisData);
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
  
  async generatePagesIndex(analysisData) {
    console.log('    📄 Generating pages index...');
    const pageAnalyses = analysisData.pageAnalyses || [];
    const pagesDir = path.join(this.outputDir, 'pages');
    
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
  
  // Helper methods
  extractOrganization(analysisData) {
    // Check different possible locations for the organization name
    if (analysisData.organization) {
      return analysisData.organization;
    }
    
    // Try structured data if available
    if (typeof analysisData === 'object' && 
        analysisData.structured_data && 
        analysisData.structured_data.organization) {
      return analysisData.structured_data.organization;
    }
    
    return 'Website Analysis'; // Default fallback
  }
  
  parseOverviewAnalysis(overviewText) {
    // Check if we're receiving structured data
    if (overviewText && typeof overviewText === 'object') {
      console.log('  ℹ️ Using pre-structured overview data');
      
      // If overviewText is already an object, use its properties directly
      return {
        executive_summary: overviewText.executive_summary || '',
        key_findings: Array.isArray(overviewText.key_findings) ? overviewText.key_findings : [],
        strategic_recommendations: Array.isArray(overviewText.recommendations) ? overviewText.recommendations : [],
        theme_assessment: Array.isArray(overviewText.theme_assessment) ? overviewText.theme_assessment : [],
        implementation_roadmap: Array.isArray(overviewText.implementation_roadmap) ? overviewText.implementation_roadmap : []
      };
    }
    
    // Handle null, undefined, or non-string values
    if (!overviewText || typeof overviewText !== 'string') {
      return {
        executive_summary: 'No overview analysis available',
        key_findings: [],
        strategic_recommendations: [],
        theme_assessment: [],
        implementation_roadmap: []
      };
    }
    
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
    if (!pageData) return {
      scores: [],
      critical_flaws: [],
      recommendations: [],
      summary: 'No analysis data available',
      full_analysis: ''
    };
    
    // Check if we're receiving pre-structured data from the formatting service
    if (pageData.analysis && typeof pageData.analysis === 'object' && 
        !Array.isArray(pageData.analysis) && 
        typeof pageData.analysis.toString !== 'function') {
      console.log(`  ℹ️ Using pre-structured page data for ${pageData.url || 'unknown page'}`);
      
      // Return the pre-structured data
      return {
        scores: Array.isArray(pageData.analysis.scores) ? pageData.analysis.scores : [],
        critical_flaws: Array.isArray(pageData.analysis.critical_flaws) ? pageData.analysis.critical_flaws : [],
        recommendations: Array.isArray(pageData.analysis.recommendations) ? pageData.analysis.recommendations : [],
        summary: pageData.analysis.summary || '',
        full_analysis: JSON.stringify(pageData.analysis, null, 2)
      };
    }
    
    // Handle null or missing analysis field
    if (!pageData.analysis) {
      return {
        scores: [],
        critical_flaws: [],
        recommendations: [],
        summary: 'No analysis data available',
        full_analysis: ''
      };
    }
    
    // For string analysis, use the original parsing logic
    const analysisText = pageData.analysis;
    let sections = {};
    let scores = [];
    let criticalFlaws = [];
    let recommendations = [];
    let summary = '';
    
    try {
      // Try parsing using the section method first
      sections = this.extractSections(analysisText);
      
      // Extract scores - more flexible approach
      Object.entries(sections).forEach(([sectionName, content]) => {
        const scoreMatch = content.match(/Score:\s*(\d+)\/10/i) || content.match(/(\d+)\/10/i);
        if (scoreMatch) {
          scores.push({
            category: sectionName,
            score: parseInt(scoreMatch[1]),
            description: this.extractFirstLine(content)
          });
        }
      });
      
      // If no scores found in sections, try other approaches
      if (scores.length === 0) {
        const scoreRegex = /([A-Z\s&\-]+)\s*\(Score:\s*(\d+)\/10\)/gi;
        let match;
        while ((match = scoreRegex.exec(analysisText)) !== null) {
          scores.push({
            category: match[1].trim(),
            score: parseInt(match[2]),
            description: ''
          });
        }
      }
      
      // Look for critical flaws in specific sections or throughout
      criticalFlaws = this.extractList(sections['CRITICAL FLAWS'] || '');
      if (criticalFlaws.length === 0) {
        // Try alternate formats or look throughout the content
        const criticalMatch = analysisText.match(/CRITICAL FLAWS:([^]*?)(?=ACTIONABLE RECOMMENDATIONS:|RECOMMENDATIONS:|SUMMARY:|$)/i);
        if (criticalMatch) {
          criticalFlaws = this.extractList(criticalMatch[1]);
        }
      }
      
      // Look for recommendations
      recommendations = this.extractList(sections['ACTIONABLE RECOMMENDATIONS'] || sections['RECOMMENDATIONS'] || '');
      if (recommendations.length === 0) {
        // Try alternate formats
        const recsMatch = analysisText.match(/(?:ACTIONABLE )?RECOMMENDATIONS:([^]*?)(?=SUMMARY:|$)/i);
        if (recsMatch) {
          recommendations = this.extractList(recsMatch[1]);
        }
      }
      
      // Look for summary
      summary = sections['SUMMARY'] || '';
      if (!summary) {
        const summaryMatch = analysisText.match(/SUMMARY:([^]*?)$/i);
        if (summaryMatch) {
          summary = summaryMatch[1].trim();
        }
      }
    } catch (error) {
      console.error('Error parsing page analysis:', error);
    }
    
    return {
      scores: scores,
      critical_flaws: criticalFlaws,
      recommendations: recommendations,
      summary: summary,
      full_analysis: pageData.analysis
    };
  }
  
  parseTechnicalSummary(technicalText) {
    // Check if we're receiving structured data
    if (technicalText && typeof technicalText === 'object') {
      console.log('  ℹ️ Using pre-structured technical data');
      
      return {
        performance_overview: technicalText.performance_overview || technicalText.overview || '',
        key_metrics: Array.isArray(technicalText.key_metrics) ? technicalText.key_metrics : [],
        optimization_opportunities: Array.isArray(technicalText.optimization_opportunities) ? 
                                   technicalText.optimization_opportunities : [],
        implementation_priorities: Array.isArray(technicalText.implementation_priorities) ? 
                                  technicalText.implementation_priorities : []
      };
    }
    
    // Handle null, undefined, or non-string values
    if (!technicalText || typeof technicalText !== 'string') {
      return {
        performance_overview: 'No technical summary available',
        key_metrics: [],
        optimization_opportunities: [],
        implementation_priorities: []
      };
    }
    
    const sections = this.extractSections(technicalText);
    
    return {
      performance_overview: sections['PERFORMANCE OVERVIEW'] || sections['TECHNICAL OVERVIEW'] || '',
      key_metrics: this.extractList(sections['TECHNICAL FINDINGS'] || sections['KEY METRICS'] || ''),
      optimization_opportunities: this.extractList(sections['PERFORMANCE OPTIMIZATIONS'] || 
                                                 sections['OPTIMIZATION OPPORTUNITIES'] || ''),
      implementation_priorities: this.extractList(sections['IMPLEMENTATION PRIORITIES'] || '')
    };
  }
  
  createExecutiveSummary(analysisData) {
    const overview = this.parseOverviewAnalysis(analysisData.overview);
    const technical = this.parseTechnicalSummary(analysisData.technicalSummary);
    
    // Extract page summaries
    const pageSummaries = [];
    
    // Check if we have pre-structured page summaries
    if (analysisData.structured_data && analysisData.structured_data.page_summaries) {
      // Use pre-structured page summaries
      Object.entries(analysisData.structured_data.page_summaries).forEach(([pageType, summary]) => {
        pageSummaries.push([pageType, summary]);
      });
    } else if (analysisData.pageAnalyses) {
      // Extract page summaries from page analyses
      analysisData.pageAnalyses.forEach(page => {
        const pageType = this.getPageType(page.url);
        const pageData = this.parsePageAnalysis(page);
        if (pageData && pageData.summary) {
          pageSummaries.push([pageType, pageData.summary]);
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
    
    // Check for pre-structured critical issues
    if (analysisData.structured_data && Array.isArray(analysisData.structured_data.critical_issues)) {
      return analysisData.structured_data.critical_issues.slice(0, 10);
    }
    
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
    
    // Check for pre-structured recommendations
    if (analysisData.structured_data && Array.isArray(analysisData.structured_data.recommendations)) {
      return analysisData.structured_data.recommendations.slice(0, 8);
    }
    
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
    // Handle non-string inputs
    if (!text || typeof text !== 'string') {
      console.log(`  ⚠️ Warning: extractSections() received ${typeof text} instead of string`);
      return {};
    }
    
    const sections = {};
    let currentSection = null;
    let currentContent = [];
    
    try {
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
    } catch (error) {
      console.error('Error in extractSections:', error);
    }
    
    return sections;
  }
  
  extractList(text) {
    // Check if text is already an array
    if (Array.isArray(text)) {
      return text;
    }
    
    // Handle null, undefined, or non-string values
    if (!text || typeof text !== 'string') {
      return [];
    }
    
    // Extract numbered or bulleted lists
    const listItems = [];
    
    try {
      const lines = text.split('\n');
      
      for (const line of lines) {
        const trimmed = line.trim();
        // Match various list formats
        if (trimmed.match(/^[•\-*]/) || 
            trimmed.match(/^\d+\./) ||
            trimmed.match(/^\d+\)/) ||
            trimmed.match(/^[\(]?\d+[\):]/) ||
            trimmed.match(/^[A-Z\d]+[\):]/) ||
            trimmed.match(/^\[\d+\]/)) {
          // Remove the list marker and clean up
          let item = trimmed
            .replace(/^[•\-*]\s*/, '')
            .replace(/^\d+\.\s*/, '')
            .replace(/^\d+\)\s*/, '')
            .replace(/^[\(]?\d+[\):]\s*/, '')
            .replace(/^[A-Z\d]+[\):]\s*/, '')
            .replace(/^\[\d+\]\s*/, '');
            
          if (item.length > 0) {
            listItems.push(item);
          }
        }
      }
    } catch (error) {
      console.error('Error in extractList:', error);
    }
    
    return listItems;
  }
  
  extractFirstLine(text) {
    if (!text || typeof text !== 'string') return '';
    
    try {
      const lines = text.split('\n');
      return lines.find(line => line.trim() && !line.includes('Score:')) || '';
    } catch (error) {
      console.error('Error in extractFirstLine:', error);
      return '';
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
        .toLowerCase();
    }
  }
  
  getPageType(url) {
    try {
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
    } catch (e) {
      return 'Page';
    }
  }
  
  findScreenshotPath(url) {
    try {
      // Create a simplified pattern to search for matching screenshots
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace(/^www\./, '');
      
      // Try to identify the screenshot file based on pattern matching
      return `${domain}.png`;
    } catch (e) {
      return 'placeholder.png';
    }
  }
}

module.exports = { ReportGenerator };