require('dotenv').config(); // Load environment variables

const Anthropic = require('@anthropic-ai/sdk');
// Import OpenAI only when needed
let OpenAI;

const fs = require('fs-extra');
const path = require('path');
const { prepareImageForLLM } = require('./utils');
const { getAnalysisPrompt } = require('./prompts/analysis-prompt');
const { getTechnicalPrompt } = require('./prompts/technical-prompt');

class LLMAnalyzer {
  constructor(options = {}) {
    this.provider = options.provider || 'anthropic';
    this.model = options.model || process.env.ANTHROPIC_MODEL || 'claude-3-7-sonnet-20250219';
    this.concurrency = options.concurrency || 3;
    this.screenshotsDir = options.screenshotsDir;
    this.lighthouseDir = options.lighthouseDir;
    
    // Organization context
    this.orgContext = options.orgContext || {
      org_name: 'the organization',
      org_type: 'organization',
      org_purpose: 'to achieve its business goals and serve its users effectively'
    };
    
    // Initialize LLM client
    this.initializeClient();
  }
  
  initializeClient() {
    if (this.provider === 'anthropic') {
      // Check for API key in environment
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY environment variable is required. Please set it in your .env file.');
      }
      
      console.log(`API Key loaded from environment: ${apiKey.substring(0, 8)}...`);
      
      this.client = new Anthropic({
        apiKey: apiKey,
      });
      
      if (!this.client) {
        throw new Error('Failed to initialize Anthropic client');
      }
    } else if (this.provider === 'openai') {
      if (!OpenAI) {
        OpenAI = require('openai').OpenAI;
      }
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    } else {
      throw new Error(`Unsupported provider: ${this.provider}`);
    }
  }
  
  async loadScreenshots() {
    try {
      // Use screenshotsDir directly - it should already point to the desktop folder
      console.log(`📸 Loading screenshots from: ${this.screenshotsDir}`);
      
      // Check if the path exists
      if (!await fs.pathExists(this.screenshotsDir)) {
        console.error(`Screenshots directory does not exist: ${this.screenshotsDir}`);
        return [];
      }
      
      const files = await fs.readdir(this.screenshotsDir);
      const screenshots = [];
      
      for (const file of files) {
        if (file.endsWith('.png')) {
          const filePath = path.join(this.screenshotsDir, file);
          console.log(`📸 Processing screenshot: ${file}`);
          const imageData = await prepareImageForLLM(filePath);
          
          screenshots.push({
            filename: file,
            path: filePath,
            imageData: imageData,
            url: this.extractUrlFromFilename(file)
          });
        }
      }
      
      // Sort by filename to ensure consistent order
      screenshots.sort((a, b) => a.filename.localeCompare(b.filename));
      
      return screenshots;
    } catch (error) {
      console.error('Error loading screenshots:', error);
      return [];
    }
  }
  
  async loadLighthouseData() {
    try {
      // Use lighthouseDir directly - it should already point to the trimmed folder
      console.log(`🚦 Loading lighthouse data from: ${this.lighthouseDir}`);
      
      // Check if the path exists
      if (!await fs.pathExists(this.lighthouseDir)) {
        console.error(`Lighthouse directory does not exist: ${this.lighthouseDir}`);
        return [];
      }
      
      const files = await fs.readdir(this.lighthouseDir);
      const lighthouseData = [];
      
      for (const file of files) {
        if (file.endsWith('_trimmed.json')) {
          const filePath = path.join(this.lighthouseDir, file);
          console.log(`🚦 Processing lighthouse report: ${file}`);
          const data = await fs.readJson(filePath);
          
          lighthouseData.push({
            filename: file,
            path: filePath,
            data: data,
            url: data.requestedUrl || data.finalUrl
          });
        }
      }
      
      // Sort by filename to ensure consistent order
      lighthouseData.sort((a, b) => a.filename.localeCompare(b.filename));
      
      return lighthouseData;
    } catch (error) {
      console.error('Error loading lighthouse data:', error);
      return [];
    }
  }
  
  async analyzeWebsite() {
    const screenshots = await this.loadScreenshots();
    const lighthouseData = await this.loadLighthouseData();
    
    // Prepare data for analysis
    const analysisData = [];
    
    // Match screenshots with lighthouse data
    for (const screenshot of screenshots) {
      const matchingLighthouse = lighthouseData.find(lh => lh.url === screenshot.url);
      
      analysisData.push({
        url: screenshot.url,
        screenshot: screenshot,
        lighthouse: matchingLighthouse ? matchingLighthouse.data : null
      });
    }
    
    // Run analysis
    const analysis = {
      timestamp: new Date().toISOString(),
      provider: this.provider,
      model: this.model,
      concurrency: this.concurrency,
      orgContext: this.orgContext,
      pageAnalyses: [],
      technicalSummary: null,
      overview: null
    };
    
    try {
      // 1. Analyze pages CONCURRENTLY
      console.log(`📄 Analyzing ${analysisData.length} pages concurrently (${this.concurrency} at a time)...`);
      const pageAnalyses = await this.analyzePagesConcurrently(analysisData);
      analysis.pageAnalyses = pageAnalyses;
      
      // 2. Generate technical summary (depends on all pages)
      console.log('🔧 Generating technical summary...');
      analysis.technicalSummary = await this.generateTechnicalSummary(analysisData);
      
      // 3. Generate comprehensive overview (depends on everything)
      console.log('📊 Generating comprehensive overview...');
      analysis.overview = await this.generateComprehensiveOverview(analysisData, analysis);
      
    } catch (error) {
      console.error('Error during analysis:', error);
      throw error;
    }
    
    return analysis;
  }
  
  async analyzePagesConcurrently(analysisData) {
    const allResults = [];
    const batchSize = this.concurrency;
    
    // Process pages in concurrent batches
    for (let i = 0; i < analysisData.length; i += batchSize) {
      const batch = analysisData.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(analysisData.length / batchSize);
      
      console.log(`   Batch ${batchNum}/${totalBatches}: Analyzing ${batch.length} pages concurrently...`);
      
      const batchStartTime = Date.now();
      
      // Create promises for concurrent analysis
      const promises = batch.map((pageData, index) => 
        this.analyzeIndividualPageWithRetry(pageData, i + index)
      );
      
      // Wait for all analyses in this batch to complete
      const batchResults = await Promise.allSettled(promises);
      
      // Process results
      batchResults.forEach((result, index) => {
        const pageData = batch[index];
        if (result.status === 'fulfilled') {
          allResults.push({
            url: pageData.url,
            analysis: result.value
          });
        } else {
          console.error(`   ❌ Failed to analyze ${pageData.url}: ${result.reason.message}`);
          allResults.push({
            url: pageData.url,
            analysis: `Analysis failed: ${result.reason.message}`
          });
        }
      });
      
      const batchDuration = (Date.now() - batchStartTime) / 1000;
      console.log(`   ⚡ Batch ${batchNum} completed in ${batchDuration.toFixed(2)}s`);
    }
    
    return allResults;
  }
  
  async analyzeIndividualPageWithRetry(pageData, index, maxRetries = 2) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`     📄 [${index}] Analyzing: ${pageData.url} (attempt ${attempt})`);
        return await this.analyzeIndividualPage(pageData);
      } catch (error) {
        lastError = error;
        console.log(`     ⚠️  [${index}] Attempt ${attempt} failed: ${error.message}`);
        
        if (attempt < maxRetries) {
          // Wait before retry with exponential backoff
          const waitTime = 1000 * attempt;
          console.log(`     ⏳ Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    throw lastError;
  }
  
  async analyzeIndividualPage(pageData) {
    const prompt = getAnalysisPrompt('page', {
      url: pageData.url,
      lighthouse: pageData.lighthouse,
      page_type: pageData.page_type || 'webpage',
      context: this.orgContext
    });
    
    // Include screenshot for page analysis
    const screenshots = pageData.screenshot ? [pageData.screenshot] : [];
    
    return await this.callLLM(prompt, screenshots, `page analysis for ${pageData.url}`);
  }
  
  async generateTechnicalSummary(analysisData) {
    const prompt = getTechnicalPrompt('summary', {
      lighthouseData: analysisData.map(page => ({
        url: page.url,
        lighthouse: page.lighthouse
      }))
    });
    
    return await this.callLLM(prompt, null, 'technical summary');
  }
  
  async generateComprehensiveOverview(analysisData, previousAnalysis) {
    // Prepare comprehensive context
    const overviewData = {
      pages: analysisData.map(page => ({
        url: page.url,
        lighthouseScores: page.lighthouse ? {
          performance: page.lighthouse.scores.performance?.score,
          accessibility: page.lighthouse.scores.accessibility?.score,
          bestPractices: page.lighthouse.scores['best-practices']?.score,
          seo: page.lighthouse.scores.seo?.score
        } : null
      })),
      pageAnalyses: previousAnalysis.pageAnalyses,
      technicalSummary: previousAnalysis.technicalSummary,
      context: this.orgContext
    };
    
    const prompt = getAnalysisPrompt('comprehensive_overview', overviewData);
    
    // Include all screenshots for comprehensive overview
    const screenshots = analysisData
      .filter(page => page.screenshot)
      .map(page => page.screenshot);
    
    return await this.callLLM(prompt, screenshots, 'comprehensive overview');
  }
  
  async callLLM(prompt, screenshots = null, analysisType = 'analysis') {
    console.log(`   🧠 Calling LLM for ${analysisType}...`);
    
    try {
      if (this.provider === 'anthropic') {
        const content = [];
        
        // Add text content
        content.push({
          type: 'text',
          text: prompt
        });
        
        // Add images if provided
        if (screenshots && screenshots.length > 0) {
          for (const screenshot of screenshots) {
            content.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: screenshot.imageData.mediaType,
                data: screenshot.imageData.data
              }
            });
          }
        }
        
        const response = await this.client.messages.create({
          model: this.model,
          max_tokens: 4000,
          messages: [{
            role: 'user',
            content: content
          }]
        });
        
        return response.content[0].text;
        
      } else if (this.provider === 'openai') {
        const messages = [{
          role: 'user',
          content: prompt
        }];
        
        const response = await this.client.chat.completions.create({
          model: this.model,
          messages: messages,
          max_tokens: 4000
        });
        
        return response.choices[0].message.content;
      }
      
    } catch (error) {
      console.error(`Error calling LLM for ${analysisType}:`, error);
      throw error;
    }
  }
  
  extractUrlFromFilename(filename) {
    // Extract URL from filename pattern: 000_domain_path.png
    const match = filename.match(/^\d+_(.+)\.png$/);
    if (!match) return filename;
    
    const urlPart = match[1];
    // Convert underscores back to slashes and add https://
    const url = urlPart.replace(/_/g, '/');
    
    // Try to reconstruct the full URL
    return `https://${url}`;
  }
}

module.exports = { LLMAnalyzer };