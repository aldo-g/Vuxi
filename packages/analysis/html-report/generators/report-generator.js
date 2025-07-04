const fs = require('fs-extra');
const path = require('path');

class ReportGenerator {
  constructor(options = {}) {
    // Change output to Next.js public directory structure
    this.outputDir = options.outputDir || '/app/data/reports'; 
    this.nextJsPublicDir = options.nextJsPublicDir || path.join(__dirname, '../../../next-app/public');
    this.screenshotsSourceDir = options.screenshotsSourceDir || options.screenshotsDir || '/app/data/screenshots';
    this.usedIds = new Set();

    console.log(`📁 ReportGenerator initialized:`);
    console.log(`   Next.js public dir: ${this.nextJsPublicDir}`);
    console.log(`   Screenshots source: ${this.screenshotsSourceDir}`);
    
    // Ensure Next.js directories exist
    fs.ensureDirSync(path.join(this.nextJsPublicDir, 'all_analysis_runs'));
  }

  async generateAllReports(analysisData) {
    try {
      console.log(`🔍 Generating reports for Next.js app`);

      // Reset used IDs for each generation
      this.usedIds.clear();

      // Generate unique report ID
      const reportId = this.generateReportId(analysisData);
      const reportDir = path.join(this.nextJsPublicDir, 'all_analysis_runs', reportId);
      
      console.log(`📁 Creating report directory: ${reportDir}`);
      await fs.ensureDir(reportDir);

      // 1. Prepare report-data.json for Next.js app
      await this.prepareNextJsReportData(analysisData, reportDir);

      // 2. Copy screenshots to Next.js public directory
      await this.copyScreenshotsToNextJs(reportDir);

      // 3. Update the manifest file
      await this.updateManifest(reportId, analysisData);

      // 4. Create success marker
      const testFilePath = path.join(reportDir, 'generation-successful.txt');
      await fs.writeFile(testFilePath, `Reports generated at ${new Date().toISOString()}`);
      console.log(`✅ Generation verification file created: ${testFilePath}`);

      console.log(`✅ Report generated successfully with ID: ${reportId}`);
      console.log(`🌐 View at: http://localhost:3000/report/${reportId}`);

      return true;
    } catch (error) {
      console.error(`❌ Error generating reports: ${error.message}`);
      console.error(error.stack);
      return false;
    }
  }

  generateReportId(analysisData) {
    // Generate a unique ID based on timestamp and organization
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const orgName = (analysisData.metadata?.organization_name || 'analysis')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);
    return `run_${orgName}_${timestamp}`;
  }

  async prepareNextJsReportData(analysisData, reportDir) {
    console.log('  📊 Preparing report-data.json for Next.js...');
    
    if (!analysisData || !analysisData.page_analyses || !analysisData.overall_summary || !analysisData.metadata) {
      throw new Error('Invalid analysisData structure: missing overall_summary, page_analyses, or metadata.');
    }

    // Create assets directory structure
    const assetsDir = path.join(reportDir, 'assets', 'screenshots');
    await fs.ensureDir(assetsDir);

    const processedPageAnalyses = analysisData.page_analyses.map((page, index) => {
      const pageId = this.createUniquePageId(page, index);
      const screenshotFilename = this.findActualScreenshotFilename(page.url, index, analysisData.page_analyses);
      
      return {
        ...page,
        id: pageId,
        detailed_analysis: this.cleanAnalysisContent(page.original_analysis || ''), 
        raw_analysis: page.original_analysis || 'No raw analysis data.',
        screenshot_path: screenshotFilename ? `assets/screenshots/${screenshotFilename}` : null
      };
    });

    const reportData = {
      organization: analysisData.metadata.organization_name || 'Analysis Report',
      analysis_date: new Date().toISOString(),
      timestamp: analysisData.timestamp || new Date().toISOString(),
      overall_summary: {
        ...analysisData.overall_summary,
        total_pages_analyzed: processedPageAnalyses.length
      },
      page_analyses: processedPageAnalyses,
      metadata: {
        organization_name: analysisData.metadata.organization_name,
        generated_at: new Date().toISOString(),
        total_pages: processedPageAnalyses.length
      }
    };

    const reportDataPath = path.join(reportDir, 'report-data.json');
    await fs.writeJson(reportDataPath, reportData, { spaces: 2 });
    console.log(`    ✅ report-data.json saved to: ${reportDataPath}`);
  }

  async copyScreenshotsToNextJs(reportDir) {
    console.log('  📸 Copying screenshots to Next.js assets...');
    
    try {
      const assetsScreenshotsDir = path.join(reportDir, 'assets', 'screenshots');
      await fs.ensureDir(assetsScreenshotsDir);

      // Check for screenshots in desktop subdirectory first
      const desktopDir = path.join(this.screenshotsSourceDir, 'desktop');
      const sourceDir = await fs.pathExists(desktopDir) ? desktopDir : this.screenshotsSourceDir;
      
      if (!await fs.pathExists(sourceDir)) {
        console.log(`    ⚠️  Screenshots directory not found: ${sourceDir}`);
        return;
      }

      const files = await fs.readdir(sourceDir);
      const screenshotFiles = files.filter(file => file.toLowerCase().endsWith('.png'));
      
      if (screenshotFiles.length === 0) {
        console.log(`    ⚠️  No screenshot files found in: ${sourceDir}`);
        return;
      }

      for (const file of screenshotFiles) {
        const srcPath = path.join(sourceDir, file);
        const destPath = path.join(assetsScreenshotsDir, file);
        await fs.copy(srcPath, destPath, { overwrite: true });
      }
      
      console.log(`    ✅ ${screenshotFiles.length} screenshots copied to: ${assetsScreenshotsDir}`);
    } catch (error) {
      console.error(`    ❌ Error copying screenshots: ${error.message}`);
    }
  }

  async updateManifest(reportId, analysisData) {
    console.log('  📋 Updating manifest file...');
    
    try {
      const manifestPath = path.join(this.nextJsPublicDir, 'all_analysis_runs_manifest.json');
      
      // Read existing manifest or create new one
      let manifest = [];
      if (await fs.pathExists(manifestPath)) {
        manifest = await fs.readJson(manifestPath);
      }

      // Add new report to manifest
      const newEntry = {
        id: reportId,
        name: `${analysisData.metadata.organization_name || 'Analysis'} (${new Date().toISOString().split('T')[0]})`,
        date: new Date().toISOString(),
        description: `Analysis report for ${analysisData.metadata.organization_name || 'organization'} generated on ${new Date().toLocaleDateString()}.`
      };

      // Add to beginning of list (most recent first)
      manifest.unshift(newEntry);

      // Write updated manifest
      await fs.writeJson(manifestPath, manifest, { spaces: 2 });
      console.log(`    ✅ Manifest updated with new report: ${reportId}`);
    } catch (error) {
      console.error(`    ❌ Error updating manifest: ${error.message}`);
    }
  }

  createUniquePageId(page, index) {
    const baseId = page.id || 
                   page.title?.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 30) || 
                   `page-${index}`;
    
    let uniqueId = baseId;
    let counter = 1;
    
    while (this.usedIds.has(uniqueId)) {
      uniqueId = `${baseId}-${counter}`;
      counter++;
    }
    
    this.usedIds.add(uniqueId);
    return uniqueId;
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