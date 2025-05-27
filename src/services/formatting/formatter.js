require('dotenv').config();

const Anthropic = require('@anthropic-ai/sdk');
const { getFormattingPrompts } = require('./prompts/formatting-prompts');
const { validateStructuredData } = require('./utils/validator');

class Formatter {
  constructor(options = {}) {
    this.model = options.model || process.env.ANTHROPIC_MODEL || 'claude-3-7-sonnet-20250219';
    this.concurrency = options.concurrency || 4;
    
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  
  async format(rawAnalysisData) {
    try {
      if (!process.env.ANTHROPIC_API_KEY) {
        return {
          status: 'error',
          error: 'ANTHROPIC_API_KEY environment variable is not set'
        };
      }
      
      console.log('🔄 Formatting analysis for individual pages + overall summary...');
      
      const pageAnalyses = await this.formatPageAnalysesConcurrently(rawAnalysisData);
      const overallSummary = await this.createOverallSummary(rawAnalysisData, pageAnalyses);
      
      const structuredData = {
        timestamp: new Date().toISOString(),
        overall_summary: overallSummary,
        page_analyses: pageAnalyses,
        metadata: {
          total_pages: pageAnalyses.length,
          analysis_provider: rawAnalysisData.provider,
          analysis_model: rawAnalysisData.model,
          generated_at: new Date().toISOString()
        }
      };
      
      console.log('🔍 Validating structured data...');
      const validationResult = validateStructuredData(structuredData);
      
      if (validationResult.valid) {
        return {
          status: 'success',
          data: validationResult.data
        };
      } else {
        console.error('   ❌ Validation failed:', validationResult.errors);
        return {
          status: 'error',
          error: 'Structured data validation failed: ' + validationResult.errors.join('; '),
          data: structuredData
        };
      }
      
    } catch (error) {
      console.error('Error during formatting:', error);
      return {
        status: 'error',
        error: error.message
      };
    }
  }
  
  async formatPageAnalysesConcurrently(rawAnalysisData) {
    const pageAnalyses = rawAnalysisData.pageAnalyses || [];
    if (pageAnalyses.length === 0) {
      console.log('   ⚠️  No page analyses found');
      return [];
    }
    
    console.log(`📄 Formatting ${pageAnalyses.length} individual page analyses...`);
    console.log(`   🔀 Processing ${this.concurrency} pages concurrently`);
    
    const allResults = [];
    const batchSize = this.concurrency;
    
    for (let i = 0; i < pageAnalyses.length; i += batchSize) {
      const batch = pageAnalyses.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(pageAnalyses.length / batchSize);
      
      console.log(`   Batch ${batchNum}/${totalBatches}: Formatting ${batch.length} pages...`);
      
      const batchStartTime = Date.now();
      const promises = batch.map((pageAnalysis, batchIndex) => 
        this.formatIndividualPage(pageAnalysis, i + batchIndex)
      );
      
      const batchResults = await Promise.allSettled(promises);
      
      batchResults.forEach((result, batchIndex) => {
        const pageAnalysis = batch[batchIndex];
        if (result.status === 'fulfilled') {
          allResults.push(result.value);
        } else {
          console.error(`   ❌ Failed to format page ${pageAnalysis.url}: ${result.reason.message}`);
          allResults.push(this.createFallbackPageAnalysis(pageAnalysis, i + batchIndex));
        }
      });
      
      const batchDuration = (Date.now() - batchStartTime) / 1000;
      console.log(`   ⚡ Batch ${batchNum} completed in ${batchDuration.toFixed(2)}s`);
    }
    
    return allResults;
  }
  
  async formatIndividualPage(pageAnalysis, index) {
    console.log(`     📄 [${index}] Formatting: ${pageAnalysis.url}`);
    
    const prompt = getFormattingPrompts().individualPage(pageAnalysis);
    
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });
      
      const formattedText = response.content[0].text.trim();
      
      // Try multiple JSON parsing methods
      const parsed = this.parseJSON(formattedText, pageAnalysis.url);
      
      return {
        ...parsed,
        url: pageAnalysis.url,
        original_analysis: pageAnalysis.analysis
      };
      
    } catch (error) {
      console.error(`     ❌ LLM call failed for ${pageAnalysis.url}:`, error.message);
      throw error;
    }
  }
  
  async createOverallSummary(rawAnalysisData, pageAnalyses) {
    console.log('📊 Creating overall summary for main page...');
    
    const prompt = getFormattingPrompts().overallSummary(rawAnalysisData, pageAnalyses);
    
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 3000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });
      
      const summaryText = response.content[0].text.trim();
      
      // Try multiple JSON parsing methods
      return this.parseJSON(summaryText, 'overall summary');
      
    } catch (error) {
      console.error('   ❌ Failed to create overall summary:', error.message);
      return this.createFallbackSummary(rawAnalysisData, pageAnalyses);
    }
  }
  
  parseJSON(text, source) {
    // Method 1: Direct JSON parse
    try {
      return JSON.parse(text);
    } catch (e) {
      // Method 2: Extract JSON from code blocks
      const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (codeBlockMatch) {
        try {
          return JSON.parse(codeBlockMatch[1].trim());
        } catch (e2) {
          // Continue to next method
        }
      }
      
      // Method 3: Find JSON object in text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e3) {
          // Continue to next method
        }
      }
      
      // Method 4: Clean and retry
      const cleaned = text
        .replace(/^[^{]*/, '') // Remove text before first {
        .replace(/[^}]*$/, '') // Remove text after last }
        .trim();
      
      if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
        try {
          return JSON.parse(cleaned);
        } catch (e4) {
          // Continue to fallback
        }
      }
    }
    
    console.warn(`     ⚠️  JSON parse failed for ${source}, using text extraction`);
    
    // Fallback: create structure from text
    if (source === 'overall summary') {
      return this.extractSummaryFromText(text);
    } else {
      return this.extractPageDataFromText(text, { url: source });
    }
  }
  
  extractPageDataFromText(text, pageAnalysis) {
    return {
      page_type: this.extractPageType(pageAnalysis.url),
      title: this.extractPageType(pageAnalysis.url),
      overall_score: this.extractScore(text) || 5,
      key_issues: this.extractList(text, ['issues', 'problems', 'flaws']).slice(0, 5),
      recommendations: this.extractList(text, ['recommendations', 'suggestions', 'improvements']).slice(0, 5),
      summary: this.extractSummary(text) || 'Page analysis available'
    };
  }
  
  extractSummaryFromText(text) {
    return {
      executive_summary: this.extractSummary(text) || 'Website analysis completed',
      overall_score: this.extractScore(text) || 6,
      total_pages_analyzed: 6, // Default
      most_critical_issues: this.extractList(text, ['critical', 'urgent', 'important']).slice(0, 5),
      top_recommendations: this.extractList(text, ['recommendations', 'priorities', 'actions']).slice(0, 5),
      key_strengths: this.extractList(text, ['strengths', 'positives', 'good']).slice(0, 3),
      performance_summary: 'Performance evaluated based on technical analysis'
    };
  }
  
  createFallbackPageAnalysis(pageAnalysis) {
    return {
      page_type: this.extractPageType(pageAnalysis.url),
      title: this.extractPageType(pageAnalysis.url),
      url: pageAnalysis.url,
      overall_score: 5,
      key_issues: ['Analysis formatting failed - manual review needed'],
      recommendations: ['Review page analysis manually'],
      summary: pageAnalysis.analysis ? pageAnalysis.analysis.substring(0, 200) + '...' : 'Page analysis available',
      original_analysis: pageAnalysis.analysis
    };
  }
  
  createFallbackSummary(rawAnalysisData, pageAnalyses) {
    return {
      executive_summary: 'Website analysis completed with technical and design evaluation. Manual review of detailed analysis recommended.',
      overall_score: 6,
      total_pages_analyzed: pageAnalyses.length,
      most_critical_issues: ['Review detailed page analyses for specific issues'],
      top_recommendations: ['Implement improvements based on individual page recommendations'],
      key_strengths: ['Website is functional and accessible'],
      performance_summary: rawAnalysisData.technicalSummary || 'Technical performance evaluated'
    };
  }
  
  // Helper methods
  extractScore(text) {
    const scoreMatch = text.match(/(?:score|rating)[\s:]*(\d+)(?:\/10)?/i);
    return scoreMatch ? parseInt(scoreMatch[1]) : null;
  }
  
  extractList(text, keywords) {
    const items = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      const hasKeyword = keywords.some(keyword => 
        line.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (hasKeyword || line.match(/^[-*•]\s/)) {
        const cleaned = line.replace(/^[-*•]\s*/, '').trim();
        if (cleaned.length > 10) {
          items.push(cleaned);
        }
      }
    }
    
    return items.slice(0, 10);
  }
  
  extractSummary(text) {
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.length > 100 && !line.includes(':')) {
        return line.trim();
      }
    }
    
    const paragraphs = text.split('\n\n');
    return paragraphs[0] ? paragraphs[0].substring(0, 300) : 'Analysis completed';
  }
  
  extractPageType(url) {
    if (!url) return 'Page';
    
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
      } else if (path.includes('training')) {
        return 'Training Page';
      } else if (path.includes('research')) {
        return 'Research Page';
      } else if (path.includes('project')) {
        return 'Projects Page';
      }
      
      return 'Page';
    } catch (e) {
      return 'Page';
    }
  }
}

module.exports = { Formatter };