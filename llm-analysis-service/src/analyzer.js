const Anthropic = require('@anthropic-ai/sdk');
const { OpenAI } = require('openai');
const fs = require('fs-extra');
const path = require('path');
const { loadImage, prepareImageForLLM } = require('./utils');
const { getAnalysisPrompt, getTechnicalPrompt } = require('./prompts/analysis-prompt');

class LLMAnalyzer {
  constructor(options = {}) {
    this.provider = options.provider || 'anthropic';
    this.model = options.model || 'claude-3-5-sonnet-20241022';
    this.screenshotsDir = options.screenshotsDir;
    this.lighthouseDir = options.lighthouseDir;
    
    // Initialize LLM client
    this.initializeClient();
  }
  
  initializeClient() {
    if (this.provider === 'anthropic') {
      this.client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    } else if (this.provider === 'openai') {
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    } else {
      throw new Error(`Unsupported provider: ${this.provider}`);
    }
  }
  
  async loadScreenshots() {
    try {
      const desktopDir = path.join(this.screenshotsDir, 'desktop');
      const files = await fs.readdir(desktopDir);
      const screenshots = [];
      
      for (const file of files) {
        if (file.endsWith('.png')) {
          const filePath = path.join(desktopDir, file);
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
      const trimmedDir = path.join(this.lighthouseDir, 'trimmed');
      const files = await fs.readdir(trimmedDir);
      const lighthouseData = [];
      
      for (const file of files) {
        if (file.endsWith('_trimmed.json')) {
          const filePath = path.join(trimmedDir, file);
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
      overview: null,
      pageAnalyses: [],
      technicalSummary: null,
      recommendations: null
    };
    
    try {
      // 1. Generate overview analysis
      console.log('📊 Generating overview analysis...');
      analysis.overview = await this.generateOverviewAnalysis(analysisData);
      
      // 2. Analyze each page
      console.log('📄 Analyzing individual pages...');
      for (const [index, pageData] of analysisData.entries()) {
        console.log(`   Analyzing page ${index + 1}/${analysisData.length}: ${pageData.url}`);
        const pageAnalysis = await this.analyzeIndividualPage(pageData);
        analysis.pageAnalyses.push(pageAnalysis);
      }
      
      // 3. Generate technical summary
      console.log('🔧 Generating technical summary...');
      analysis.technicalSummary = await this.generateTechnicalSummary(analysisData);
      
      // 4. Generate recommendations
      console.log('💡 Generating recommendations...');
      analysis.recommendations = await this.generateRecommendations(analysisData);
      
    } catch (error) {
      console.error('Error during analysis:', error);
      throw error;
    }
    
    return analysis;
  }
  
  async generateOverviewAnalysis(analysisData) {
    const prompt = getAnalysisPrompt('overview', {
      pages: analysisData.map(page => ({
        url: page.url,
        lighthouseScores: page.lighthouse ? {
          performance: page.lighthouse.scores.performance?.score,
          accessibility: page.lighthouse.scores.accessibility?.score,
          bestPractices: page.lighthouse.scores['best-practices']?.score,
          seo: page.lighthouse.scores.seo?.score
        } : null
      }))
    });
    
    // For overview, we'll just use text analysis
    return await this.callLLM(prompt, null, 'overview');
  }
  
  async analyzeIndividualPage(pageData) {
    const prompt = getAnalysisPrompt('page', {
      url: pageData.url,
      lighthouse: pageData.lighthouse
    });
    
    // Include screenshot for page analysis
    const screenshots = pageData.screenshot ? [pageData.screenshot] : [];
    
    return await this.callLLM(prompt, screenshots, 'page analysis');
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
  
  async generateRecommendations(analysisData) {
    const prompt = getAnalysisPrompt('recommendations', {
      pages: analysisData
    });
    
    // Include all screenshots for comprehensive recommendations
    const screenshots = analysisData
      .filter(page => page.screenshot)
      .map(page => page.screenshot);
    
    return await this.callLLM(prompt, screenshots, 'recommendations');
  }
  
  async callLLM(prompt, screenshots = null, analysisType = 'analysis') {
    console.log(`   Calling LLM for ${analysisType}...`);
    
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
        
        // Note: OpenAI vision API has different format
        // This is a simplified version - you'd need to adjust for images
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