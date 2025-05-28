const fs = require('fs-extra');
const path = require('path');

class ReportGenerator {
  constructor(options = {}) {
    this.outputDir = options.outputDir || '/app/data/reports'; 
    this.screenshotsSourceDir = options.screenshotsSourceDir || options.screenshotsDir || '/app/data/screenshots';
    this.reportUiBuildDir = options.reportUiBuildDir || path.join(__dirname, '../../../../../report-ui/dist'); // Assumes report-ui is a sibling to the project root

    console.log(`📁 ReportGenerator initialized:`);
    console.log(`   Outputting to: ${this.outputDir}`);
    console.log(`   Screenshots source: ${this.screenshotsSourceDir}`);
    console.log(`   React UI build source: ${this.reportUiBuildDir}`);
    fs.ensureDirSync(this.outputDir);
  }

  async generateAllReports(analysisData) { // analysisData is the content of structured-analysis.json
    try {
      console.log(`🔍 Generating reports in: ${this.outputDir}`);

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
        const pageId = this.createPageId(page, index);
        // Attempt to find the actual screenshot filename based on its order or a naming convention
        const screenshotFilename = this.findActualScreenshotFilename(page.url, index, analysisData.page_analyses);
        
        return {
            ...page, // Spread all original page data
            id: pageId, // Add id for routing
            // Ensure detailed_analysis and raw_analysis are populated from original_analysis
            detailed_analysis: this.cleanAnalysisContent(page.original_analysis || ''), 
            raw_analysis: page.original_analysis || 'No raw analysis data.',
            screenshot_path: screenshotFilename ? `assets/screenshots/${screenshotFilename}` : 'assets/screenshots/placeholder.png',
        };
    });

    // Construct the reportData by taking most of analysisData as is,
    // but replacing page_analyses with our processed version.
    // Also add top-level convenience fields if the React app expects them.
    const reportData = {
      timestamp: analysisData.timestamp, // from structured-analysis.json
      overall_summary: analysisData.overall_summary, // from structured-analysis.json
      page_analyses: processedPageAnalyses,
      metadata: analysisData.metadata, // from structured-analysis.json

      // Convenience fields for easier access in React root components, matching previous ReportData interface
      organization: analysisData.metadata?.organization_name || "Edinburgh Peace Institute",
      analysis_date: new Date(analysisData.timestamp || analysisData.metadata?.generated_at || Date.now()).toLocaleDateString(),
      total_pages_analyzed: analysisData.overall_summary.total_pages_analyzed,
      overall_score: analysisData.overall_summary.overall_score,
      executive_summary: analysisData.overall_summary.executive_summary,
      most_critical_issues: analysisData.overall_summary.most_critical_issues,
      top_recommendations: analysisData.overall_summary.top_recommendations,
      key_strengths: analysisData.overall_summary.key_strengths,
      performance_summary: analysisData.overall_summary.performance_summary,
    };

    const outputPath = path.join(this.outputDir, 'report-data.json');
    await fs.writeJson(outputPath, reportData, { spaces: 2 });
    console.log(`    ✅ Generated (minimal transform): ${outputPath}`);
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
  
  createPageId(page, index) {
    const namePart = page.page_type || page.title || `page-${index + 1}`;
    return namePart
      .toLowerCase()
      .replace(/\s+/g, '-') 
      .replace(/[^a-z0-9-]/g, '') 
      .replace(/^-+|-+$/g, '');
  }

  findActualScreenshotFilename(url, index, allPageAnalyses) {
    // This logic assumes screenshots are named in a way that correlates with their order in page_analyses
    // or matches a generated pattern.
    // For example, if screenshots are 000_..., 001_..., etc.
    
    const sourceBaseDir = path.join(this.screenshotsSourceDir, 'desktop');
    let filesInSourceDir = [];
    if (fs.existsSync(sourceBaseDir)) {
        filesInSourceDir = fs.readdirSync(sourceBaseDir);
    } else if (fs.existsSync(this.screenshotsSourceDir)) {
        filesInSourceDir = fs.readdirSync(this.screenshotsSourceDir);
    }
    
    const pngFiles = filesInSourceDir.filter(f => f.endsWith('.png')).sort();

    // Attempt to find by index (if naming is sequential and matches order of page_analyses)
    if (pngFiles[index]) {
      // console.log(`    📸 Matched screenshot by index ${index}: ${pngFiles[index]} for URL ${url}`);
      return pngFiles[index];
    }

    // Fallback to generating a name (less reliable if actual names differ significantly)
    const generatedName = this.generateScreenshotFilenameFromUrl(url, index);
    // console.warn(`    ⚠️ Could not find screenshot for URL: ${url} at index ${index} by direct listing. Falling back to generated name: ${generatedName}`);
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