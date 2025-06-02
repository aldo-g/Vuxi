const fs = require('fs-extra');
const path = require('path');

class ReportGenerator {
  constructor(options = {}) {
    this.outputDir = options.outputDir || '/app/data/reports'; 
    this.screenshotsSourceDir = options.screenshotsSourceDir || options.screenshotsDir || '/app/data/screenshots';
    this.reportUiBuildDir = options.reportUiBuildDir || path.join(__dirname, '../../../../../report-ui/dist');
    this.usedIds = new Set(); // Track used IDs to ensure uniqueness

    console.log(`📁 ReportGenerator initialized:`);
    console.log(`   Outputting to: ${this.outputDir}`);
    console.log(`   Screenshots source: ${this.screenshotsSourceDir}`);
    console.log(`   React UI build source: ${this.reportUiBuildDir}`);
    fs.ensureDirSync(this.outputDir);
  }

  async generateAllReports(analysisData) {
    try {
      console.log(`🔍 Generating reports in: ${this.outputDir}`);

      // Reset used IDs for each generation
      this.usedIds.clear();

      // 1. Prepare report-data.json (with minimal transformation)
      await this.prepareReportData(analysisData);

      // 2. Copy React UI static assets
      await this.copyReactAppAssets();

      // 3. Copy screenshots
      await this.copyScreenshots();

      const testFilePath = path.join(this.outputDir, 'generation-successful.txt');
      await fs.writeFile(testFilePath, `Reports generated at ${new Date().toISOString()}`);
      console.log(`✅ Generation verification file created: ${testFilePath}`);

      const files = await fs.readdir(this.outputDir);
      console.log(`📄 Generated files in outputDir: ${files.join(', ')}`);

      return true;
    } catch (error) {
      console.error(`❌ Error generating reports: ${error.message}`);
      console.error(error.stack);
      await fs.writeFile(path.join(this.outputDir, 'error.html'), `<h1>Report Generation Failed</h1><pre>${error.stack}</pre>`);
      return false;
    }
  }

  async prepareReportData(analysisData) {
    console.log('  📊 Preparing report-data.json (minimal transformation)...');
    if (!analysisData || !analysisData.page_analyses || !analysisData.overall_summary || !analysisData.metadata) {
        throw new Error('Invalid analysisData structure: missing overall_summary, page_analyses, or metadata.');
    }

    const processedPageAnalyses = analysisData.page_analyses.map((page, index) => {
        const pageId = this.createUniquePageId(page, index);
        const screenshotFilename = this.findActualScreenshotFilename(page.url, index, analysisData.page_analyses);
        
        return {
            ...page,
            id: pageId,
            detailed_analysis: this.cleanAnalysisContent(page.original_analysis || ''), 
            raw_analysis: page.original_analysis || 'No raw analysis data.',
            screenshot_path: screenshotFilename ? `assets/screenshots/${screenshotFilename}` : 'assets/screenshots/placeholder.png',
        };
    });

    // Clean up the overall_summary data
    const cleanedOverallSummary = this.cleanOverallSummary(analysisData.overall_summary);

    const reportData = {
      timestamp: analysisData.timestamp,
      overall_summary: cleanedOverallSummary,
      page_analyses: processedPageAnalyses,
      metadata: analysisData.metadata,

      // Convenience fields for easier access in React root components
      organization: analysisData.metadata?.organization_name || "Presustainability",
      analysis_date: new Date(analysisData.timestamp || analysisData.metadata?.generated_at || Date.now()).toLocaleDateString(),
      total_pages_analyzed: cleanedOverallSummary.total_pages_analyzed,
      overall_score: cleanedOverallSummary.overall_score,
      executive_summary: cleanedOverallSummary.executive_summary,
      most_critical_issues: cleanedOverallSummary.most_critical_issues,
      top_recommendations: cleanedOverallSummary.top_recommendations,
      key_strengths: cleanedOverallSummary.key_strengths,
      performance_summary: cleanedOverallSummary.performance_summary,
    };

    const outputPath = path.join(this.outputDir, 'report-data.json');
    await fs.writeJson(outputPath, reportData, { spaces: 2 });
    console.log(`    ✅ Generated (minimal transform): ${outputPath}`);
  }

  cleanOverallSummary(overallSummary) {
    console.log('  🧹 Cleaning overall summary data...');
    
    // If the detailed_markdown_content contains nested JSON, try to parse it
    if (overallSummary.detailed_markdown_content && 
        typeof overallSummary.detailed_markdown_content === 'string' &&
        overallSummary.detailed_markdown_content.trim().startsWith('{')) {
      
      try {
        const nestedData = JSON.parse(overallSummary.detailed_markdown_content);
        console.log('    📊 Found nested JSON data in detailed_markdown_content');
        
        // Use the nested data to populate missing fields
        return {
          executive_summary: this.cleanExecutiveSummary(nestedData.executive_summary || overallSummary.executive_summary),
          overall_score: nestedData.overall_score || overallSummary.overall_score || 7,
          site_score_explanation: nestedData.site_score_explanation || overallSummary.site_score_explanation || "Overall site score evaluation highlights key strengths and areas needing improvement.",
          total_pages_analyzed: nestedData.total_pages_analyzed || overallSummary.total_pages_analyzed || 0,
          most_critical_issues: nestedData.most_critical_issues || overallSummary.most_critical_issues || [],
          top_recommendations: nestedData.top_recommendations || overallSummary.top_recommendations || [],
          key_strengths: nestedData.key_strengths || overallSummary.key_strengths || [],
          performance_summary: nestedData.performance_summary || overallSummary.performance_summary || 'Performance details require review.',
          detailed_markdown_content: nestedData.detailed_markdown_content || overallSummary.detailed_markdown_content || ''
        };
      } catch (error) {
        console.warn('    ⚠️ Failed to parse nested JSON, using original data');
      }
    }

    // Clean the executive summary if it's malformed
    return {
      ...overallSummary,
      executive_summary: this.cleanExecutiveSummary(overallSummary.executive_summary),
      most_critical_issues: Array.isArray(overallSummary.most_critical_issues) ? overallSummary.most_critical_issues : [],
      top_recommendations: Array.isArray(overallSummary.top_recommendations) ? overallSummary.top_recommendations : [],
      key_strengths: Array.isArray(overallSummary.key_strengths) ? overallSummary.key_strengths : [],
    };
  }

  cleanExecutiveSummary(executiveSummary) {
    if (!executiveSummary || typeof executiveSummary !== 'string') {
      return 'Executive summary not available.';
    }

    // Remove malformed JSON artifacts
    let cleaned = executiveSummary.trim();
    
    // Remove leading ": " if present
    if (cleaned.startsWith('": "')) {
      cleaned = cleaned.substring(4);
    }
    
    // Remove leading " if present
    if (cleaned.startsWith('"') && !cleaned.startsWith('""')) {
      cleaned = cleaned.substring(1);
    }
    
    // Remove trailing " if present and not part of content
    if (cleaned.endsWith('"') && !cleaned.endsWith('""')) {
      cleaned = cleaned.substring(0, cleaned.length - 1);
    }

    // Clean up any escaped quotes
    cleaned = cleaned.replace(/\\"/g, '"');
    
    return cleaned;
  }

  createUniquePageId(page, index) {
    // Create base ID from page type or title
    let baseName = page.page_type || page.title || `page-${index + 1}`;
    
    // Clean the base name
    baseName = baseName
      .toLowerCase()
      .replace(/\s+/g, '-') 
      .replace(/[^a-z0-9-]/g, '') 
      .replace(/^-+|-+$/g, '');

    // If this ID is already used, append index or URL info to make it unique
    let uniqueId = baseName;
    if (this.usedIds.has(uniqueId)) {
      // Try with index first
      uniqueId = `${baseName}-${index + 1}`;
      
      // If still not unique, use URL info
      if (this.usedIds.has(uniqueId) && page.url) {
        try {
          const url = new URL(page.url);
          const pathPart = url.pathname.split('/').pop() || 'page';
          uniqueId = `${baseName}-${pathPart.replace(/[^a-z0-9-]/g, '')}-${index + 1}`;
        } catch {
          uniqueId = `${baseName}-${Date.now()}-${index + 1}`;
        }
      }
    }

    this.usedIds.add(uniqueId);
    return uniqueId;
  }

  async copyReactAppAssets() {
    console.log(`  ⚛️ Copying React UI assets from ${this.reportUiBuildDir} to ${this.outputDir}...`);
    if (!await fs.pathExists(this.reportUiBuildDir)) {
        throw new Error(`React UI build directory not found: ${this.reportUiBuildDir}. Please build the report-ui project first.`);
    }
    try {
        await fs.copy(this.reportUiBuildDir, this.outputDir, { overwrite: true });
        console.log('    ✅ React UI assets copied successfully.');
    } catch (error) {
        console.error(`    ❌ Error copying React UI assets: ${error.message}`);
        throw error;
    }
  }

  async copyScreenshots() {
    console.log('  📸 Copying screenshots...');
    const outputScreenshotsDir = path.join(this.outputDir, 'assets/screenshots');
    await fs.ensureDir(outputScreenshotsDir);

    try {
      const sourceDir = path.join(this.screenshotsSourceDir, 'desktop');
      let filesToCopy = [];

      if (await fs.pathExists(sourceDir)) {
        filesToCopy = (await fs.readdir(sourceDir)).filter(file => file.endsWith('.png'));
        console.log(`    Found ${filesToCopy.length} PNGs in ${sourceDir}`);
      } else {
        console.warn(`    ⚠️ Desktop screenshots directory not found: ${sourceDir}`);
        if (await fs.pathExists(this.screenshotsSourceDir)) {
            filesToCopy = (await fs.readdir(this.screenshotsSourceDir)).filter(file => file.endsWith('.png'));
            console.log(`    Found ${filesToCopy.length} PNGs in root screenshots dir: ${this.screenshotsSourceDir}`);
        } else {
          console.warn(`    ⚠️ Screenshots source directory not found: ${this.screenshotsSourceDir}`);
          return; 
        }
      }

      if (filesToCopy.length === 0) {
        console.log('    No PNG screenshots found to copy.');
        return;
      }

      for (const file of filesToCopy) {
        const srcPath = path.join(await fs.pathExists(sourceDir) ? sourceDir : this.screenshotsSourceDir, file);
        const destPath = path.join(outputScreenshotsDir, file); 
        await fs.copy(srcPath, destPath, { overwrite: true });
      }
      console.log(`    ✅ Screenshots copied to: ${outputScreenshotsDir}`);
    } catch (error) {
      console.error(`    ❌ Error copying screenshots: ${error.message}`);
    }
  }
  
  findActualScreenshotFilename(url, index, allPageAnalyses) {
    const sourceBaseDir = path.join(this.screenshotsSourceDir, 'desktop');
    let filesInSourceDir = [];
    if (fs.existsSync(sourceBaseDir)) {
        filesInSourceDir = fs.readdirSync(sourceBaseDir);
    } else if (fs.existsSync(this.screenshotsSourceDir)) {
        filesInSourceDir = fs.readdirSync(this.screenshotsSourceDir);
    }
    
    const pngFiles = filesInSourceDir.filter(f => f.endsWith('.png')).sort();

    if (pngFiles[index]) {
      return pngFiles[index];
    }

    const generatedName = this.generateScreenshotFilenameFromUrl(url, index);
    return generatedName;
  }

  generateScreenshotFilenameFromUrl(url, index) {
    if (!url && index === undefined) return 'placeholder.png';
    try {
        const urlObj = new URL(url || 'http://localhost');
        let domain = urlObj.hostname.replace(/^www\./, '');
        let pathname = (urlObj.pathname + urlObj.search + urlObj.hash)
            .replace(/^\/+|\/+$/g, '')
            .replace(/[\/\?\=\&\#]/g, '_')
            .replace(/[^a-zA-Z0-9_-]/g, '') || 'index';

        if (pathname.length > 50) {
            pathname = pathname.substring(0, 50);
        }
        const safeIndex = String(index !== undefined ? index : 0).padStart(3, '0');
        return `${safeIndex}_${domain}_${pathname}.png`;
    } catch (error) {
        const safeIndex = String(index !== undefined ? index : 0).padStart(3, '0');
        return `${safeIndex}_invalid_url.png`;
    }
  }
  
  cleanAnalysisContent(analysisText) {
    if (!analysisText) return '';
    return analysisText.trim(); 
  }
}

module.exports = { ReportGenerator };