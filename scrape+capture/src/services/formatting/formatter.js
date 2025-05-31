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

  // --- HELPER METHODS CORRECTLY DEFINED ON THE CLASS ---
  extractSectionScores(analysisText) {
    const scores = {};
    if (!analysisText || typeof analysisText !== 'string') {
      return scores;
    }
    const sectionMappings = {
      'FIRST IMPRESSION & CLARITY': 'first_impression_clarity',
      'GOAL ALIGNMENT': 'goal_alignment',
      'VISUAL DESIGN': 'visual_design',
      'CONTENT QUALITY': 'content_quality',
      'USABILITY & ACCESSIBILITY': 'usability_accessibility',
      'CONVERSION OPTIMIZATION': 'conversion_optimization',
      'TECHNICAL EXECUTION': 'technical_execution'
    };
    const scoreRegex = /##\s*\d+\.\s*([^(]+)\(Score:\s*(\d+)\/10\)/gi;
    let match;
    while ((match = scoreRegex.exec(analysisText)) !== null) {
      const sectionNameFull = match[1].trim().toUpperCase();
      const score = parseInt(match[2], 10);
      for (const [key, value] of Object.entries(sectionMappings)) {
        if (sectionNameFull.includes(key)) {
          scores[value] = score;
          // console.log(`     📊 Extracted score: ${key} = ${score}/10`);
          break;
        }
      }
    }
    return scores;
  }

  extractListFallback(text, keywords) {
    const items = [];
    if (!text || typeof text !== 'string') return items;
    const lines = text.split('\n');
    // let collecting = false; // This logic seems complex and might be error-prone for diverse text.
    // Simplified: look for lines starting with list markers, optionally within keyword sections.

    const keywordRegex = new RegExp(`(?:${keywords.join('|')}):`, 'i');
    let inRelevantBlock = !keywords.length; // If no keywords, always "in block"

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (keywords.length && keywordRegex.test(trimmedLine)) {
            inRelevantBlock = true;
            continue;
        }

        if (inRelevantBlock) {
            if (trimmedLine.match(/^[-*•\d]\s/) || trimmedLine.match(/^\d+\.\s/)) {
                let itemText = trimmedLine.replace(/^[-*•\d\.]\s*/, '').trim();
                const fixMatch = itemText.match(/(.*?)\s*How to Fix:\s*(.*)/i);
                const benefitMatch = itemText.match(/(.*?)\s*Benefit:\s*(.*)/i);

                if (keywords.some(k => k.toLowerCase().includes('issue') || k.toLowerCase().includes('flaw')) && fixMatch) {
                    items.push({ issue: fixMatch[1].trim(), how_to_fix: fixMatch[2].trim() });
                } else if (keywords.some(k => k.toLowerCase().includes('recommendation')) && benefitMatch) {
                    items.push({ recommendation: benefitMatch[1].trim(), benefit: benefitMatch[2].trim() });
                } else {
                    // Fallback for items that don't match the detailed structure but are list items
                    if (keywords.some(k => k.toLowerCase().includes('issue') || k.toLowerCase().includes('flaw'))) {
                        items.push({ issue: itemText, how_to_fix: "Details not clearly parsed." });
                    } else if (keywords.some(k => k.toLowerCase().includes('recommendation'))) {
                        items.push({ recommendation: itemText, benefit: "Details not clearly parsed." });
                    } else {
                         items.push(itemText); // For generic lists like key_strengths
                    }
                }
            } else if (trimmedLine.match(/^(##|SUMMARY:|PAGE ROLE ANALYSIS:)/i) && keywords.length) {
                 inRelevantBlock = false; // Moved this to prevent premature exit
            }
        }
    }
    return items.filter(item => (typeof item === 'string' && item.length > 5) || (typeof item === 'object' && item !== null));
  }

  extractScoreFallback(text) {
    if (!text || typeof text !== 'string') return null;
    const scoreMatch = text.match(/(?:overall_score|overall score|score is|score of)[:\s]*(\d+)(?:\/10)?/i);
    if (scoreMatch && scoreMatch[1]) return parseInt(scoreMatch[1], 10);
    const genericScoreMatch = text.match(/Score:\s*(\d+)\/10/i);
    if (genericScoreMatch && genericScoreMatch[1]) return parseInt(genericScoreMatch[1],10);
    return 3; // Default fallback score
  }

  extractSummaryFallback(text, maxLength = 250) {
    if (!text || typeof text !== 'string') return "Summary not available.";
    const summaryMatch = text.match(/(?:SUMMARY|EXECUTIVE_SUMMARY|EXECUTIVE SUMMARY):?\s*([\s\S]*?)(?=\n\n##|\n\nPAGE ROLE ANALYSIS:|\n\nCRITICAL FLAWS:|\n\nACTIONABLE RECOMMENDATIONS:|$)/i);
    if (summaryMatch && summaryMatch[1] && summaryMatch[1].trim().length > 20) { // Check if the extracted part is substantial
      return summaryMatch[1].replace(/Overall effectiveness score:\s*\d+\/10\s*-?/, '').replace(/Highest priority action:/, '').trim().substring(0, maxLength) + (summaryMatch[1].length > maxLength ? "..." : "");
    }
    // A more generic approach if the specific section isn't found
    const firstMeaningfulParagraph = text.split('\n\n').find(p => p.trim().length > 50 && !p.trim().startsWith("##"));
    return firstMeaningfulParagraph ? firstMeaningfulParagraph.trim().substring(0, maxLength) + (firstMeaningfulParagraph.length > maxLength ? "..." : "") : "Summary requires manual review.";
  }
  
  extractOverallExplanationFallback(text) {
      if (!text || typeof text !== 'string') return "Explanation not available.";
      // Try to find an explicit "overall_explanation" if the LLM tried to output it in a string.
      const explanationMatch = text.match(/(?:overall_explanation|overall explanation)[:\s]*"([^"]*)"/i);
      if (explanationMatch && explanationMatch[1]) return explanationMatch[1];
      // Fallback to a generic statement.
      return "Overall score explanation requires manual review due to formatting issues.";
  }

  extractPageType(url) {
    if (!url || typeof url !== 'string') return 'Page';
    try {
      const saneUrl = !url.startsWith('http') ? `https://${url}` : url;
      const path = new URL(saneUrl).pathname.toLowerCase();
      if (path === '/' || path === '' || path.includes('index') || path.endsWith(new URL(saneUrl).hostname)) return 'Homepage';
      if (path.includes('contact')) return 'Contact Page';
      if (path.includes('about')) return 'About Page';
      if (path.includes('training')) return 'Training Page';
      if (path.includes('research')) return 'Research Page';
      if (path.includes('project')) return 'Projects Page';
      if (path.includes('cart')) return 'Cart Page';
      const parts = path.split('/').filter(Boolean);
      const lastPart = parts.pop() || 'generic';
      return lastPart.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) + ' Page';
    } catch (e) {
      const path = url.substring(url.lastIndexOf('/') + 1);
      const simpleName = path.split('.')[0]; // remove extension
      return simpleName.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Page';
    }
  }

  extractSectionTextFallback(text, sectionKey) {
    if (!text || typeof text !== 'string') return null;
    const regex = new RegExp(`"${sectionKey}"\\s*:\\s*"([^"]*)"`, 'i'); // Simple string value extraction
    const match = text.match(regex);
    if (match && match[1]) return match[1];

    // More generic section extraction
    const sectionRegex = new RegExp(`(?:${sectionKey.replace("_", " ")}|${sectionKey}):\\s*([\\s\\S]*?)(?=\\n\\n[A-Z\\s]+:|$)`, 'i');
    const sectionMatch = text.match(sectionRegex);
    return sectionMatch && sectionMatch[1] ? sectionMatch[1].trim().substring(0, 200) + "..." : null;
  }
  // --- END HELPER METHODS ---

  parseJSON(text, source) {
    let cleanedText = text.trim();
    try { return JSON.parse(cleanedText); } catch (e) { /* continue */ }
    const codeBlockMatch = cleanedText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      try { return JSON.parse(codeBlockMatch[1].trim()); } catch (e) { /* continue */ }
    }
    const firstBrace = cleanedText.indexOf('{');
    const lastBrace = cleanedText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const potentialJson = cleanedText.substring(firstBrace, lastBrace + 1);
      try { return JSON.parse(potentialJson); } catch (e) { /* continue */ }
    }
    console.warn(`     ⚠️  JSON parse failed for ${source}, using text extraction fallback.`);
    if (source === 'overall summary') {
      return this.extractSummaryFromTextFallback(cleanedText);
    } else {
      return this.extractPageDataFromTextFallback(cleanedText, source);
    }
  }

  extractPageDataFromTextFallback(analysisText, url) {
    const key_issue_objects = this.extractListFallback(analysisText, ['CRITICAL FLAWS', 'issues', 'problems', 'flaws']).slice(0, 5);
    const recommendation_objects = this.extractListFallback(analysisText, ['ACTIONABLE RECOMMENDATIONS', 'recommendations', 'suggestions', 'improvements']).slice(0, 5);
    return {
      page_type: this.extractPageType(url),
      title: this.extractPageType(url) || "Untitled Page (Fallback)",
      overall_score: this.extractScoreFallback(analysisText) || 3,
      overall_explanation: this.extractOverallExplanationFallback(analysisText) || "Detailed explanation requires manual review.",
      sections: [],
      section_scores: this.extractSectionScores(analysisText), // Call it here for fallback
      key_issues: key_issue_objects.map(item =>
        typeof item === 'object' && item.issue ? item : { issue: String(item.issue || item), how_to_fix: String(item.how_to_fix || "Fix details not parsed.") }
      ),
      recommendations: recommendation_objects.map(item =>
        typeof item === 'object' && item.recommendation ? item : { recommendation: String(item.recommendation || item), benefit: String(item.benefit || "Benefit details not parsed.") }
      ),
      summary: this.extractSummaryFallback(analysisText, 150) || 'Page analysis summary requires manual review.'
    };
  }

  extractSummaryFromTextFallback(text) { // For overall summary
    return {
      executive_summary: this.extractSummaryFallback(text, 500) || 'Website analysis summary requires review.',
      overall_score: this.extractScoreFallback(text) || 5,
      total_pages_analyzed: 0,
      most_critical_issues: this.extractListFallback(text, ['critical_issues', 'site-wide critical issue']).map(item => typeof item === 'object' ? item.issue : String(item)).slice(0, 5),
      top_recommendations: this.extractListFallback(text, ['top_recommendations', 'priority recommendation']).map(item => typeof item === 'object' ? item.recommendation : String(item)).slice(0, 5),
      key_strengths: this.extractListFallback(text, ['key_strengths', 'website does well']).map(item => String(item)).slice(0, 3),
      performance_summary: this.extractSectionTextFallback(text, 'performance_summary') || 'Performance details require review.'
    };
  }
  
  async format(rawAnalysisData) {
    try {
      if (!process.env.ANTHROPIC_API_KEY) {
        return { status: 'error', error: 'ANTHROPIC_API_KEY environment variable is not set', data: rawAnalysisData };
      }
      console.log('🔄 Formatting analysis for individual pages + overall summary...');
      const pageAnalysesFormatted = await this.formatPageAnalysesConcurrently(rawAnalysisData);
      const overallSummaryFormatted = await this.createOverallSummary(rawAnalysisData, pageAnalysesFormatted);

      const structuredData = {
        timestamp: new Date().toISOString(),
        overall_summary: overallSummaryFormatted,
        page_analyses: pageAnalysesFormatted,
        metadata: {
          total_pages: pageAnalysesFormatted.length,
          analysis_provider: rawAnalysisData.provider,
          analysis_model: rawAnalysisData.model,
          generated_at: new Date().toISOString(),
          ...(rawAnalysisData.metadata || {})
        }
      };
      console.log('🔍 Validating structured data...');
      const validationResult = validateStructuredData(structuredData);

      if (validationResult.valid) {
        console.log('   ✅ Structured data validated successfully.');
        return { status: 'success', data: validationResult.data };
      } else {
        console.error('   ❌ Validation failed:', JSON.stringify(validationResult.errors, null, 2));
        return {
          status: 'error',
          error: 'Structured data validation failed: ' + validationResult.errors.join('; '),
          data: validationResult.data
        };
      }
    } catch (error) {
      console.error('Error during main formatting process:', error);
      return { status: 'error', error: error.message, data: rawAnalysisData };
    }
  }

  async formatPageAnalysesConcurrently(rawAnalysisData) {
    const pageAnalysesInput = rawAnalysisData.pageAnalyses || [];
    if (pageAnalysesInput.length === 0) {
      console.log('   ⚠️  No page analyses found in raw data.');
      return [];
    }
    console.log(`📄 Formatting ${pageAnalysesInput.length} individual page analyses...`);
    console.log(`   🔀 Processing up to ${this.concurrency} pages concurrently`);

    const allResults = [];
    for (let i = 0; i < pageAnalysesInput.length; i += this.concurrency) {
      const batch = pageAnalysesInput.slice(i, i + this.concurrency);
      const batchNum = Math.floor(i / this.concurrency) + 1;
      console.log(`   Batch ${batchNum}/${Math.ceil(pageAnalysesInput.length / this.concurrency)}: Formatting ${batch.length} pages...`);
      const batchStartTime = Date.now();
      const promises = batch.map((pageAnalysisItem, batchIndex) =>
        this.formatIndividualPage(pageAnalysisItem, i + batchIndex) // Errors handled inside formatIndividualPage
      );
      const batchSettledResults = await Promise.all(promises); 
      allResults.push(...batchSettledResults);
      const batchDuration = (Date.now() - batchStartTime) / 1000;
      console.log(`   ⚡ Batch ${batchNum} completed in ${batchDuration.toFixed(2)}s`);
    }
    return allResults;
  }

  async formatIndividualPage(pageAnalysisItem, index) {
    if (!pageAnalysisItem || typeof pageAnalysisItem.analysis !== 'string' || pageAnalysisItem.analysis.trim() === "") {
      console.warn(`     ⚠️  Skipping formatting for item at index ${index} (URL: ${pageAnalysisItem.url || 'N/A'}) due to missing, empty, or invalid analysis text.`);
      return this.createFallbackPageAnalysis(pageAnalysisItem || {url: `Unknown URL ${index}`, analysis: ""}, index);
    }
    console.log(`     📄 [${index}] Formatting: ${pageAnalysisItem.url}`);
    const prompt = getFormattingPrompts().individualPage(pageAnalysisItem);
    let parsed;
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4000, // Increased based on your previous analysis text length
        messages: [{ role: 'user', content: prompt }]
      });
      const formattedText = response.content[0].text.trim();
      parsed = this.parseJSON(formattedText, pageAnalysisItem.url);
    } catch (error) {
      console.error(`     ❌ LLM call or initial parsing failed for ${pageAnalysisItem.url}:`, error.message);
      // Fallback using the original analysis text if LLM call itself failed.
      parsed = this.extractPageDataFromTextFallback(pageAnalysisItem.analysis, pageAnalysisItem.url);
    }

    const sectionScores = this.extractSectionScores(pageAnalysisItem.analysis); // Use original analysis for scores

    const finalParsed = {
        page_type: parsed.page_type || this.extractPageType(pageAnalysisItem.url),
        title: parsed.title || this.extractPageType(pageAnalysisItem.url) || `Page ${index + 1}`,
        overall_score: typeof parsed.overall_score === 'number' ? parsed.overall_score : (this.extractScoreFallback(pageAnalysisItem.analysis) || 3),
        overall_explanation: parsed.overall_explanation || "Requires manual review.",
        sections: Array.isArray(parsed.sections) ? parsed.sections : [],
        key_issues: [],
        recommendations: [],
        summary: parsed.summary || this.extractSummaryFallback(pageAnalysisItem.analysis, 150) || "Summary requires manual review.",
        url: pageAnalysisItem.url,
        original_analysis: pageAnalysisItem.analysis,
        section_scores: sectionScores,
    };

    // Robust mapping for key_issues
    finalParsed.key_issues = (Array.isArray(parsed.key_issues) ? parsed.key_issues : []).map(issue_item => {
        if (typeof issue_item === 'string') return { issue: issue_item, how_to_fix: "Fix details require review." };
        if (typeof issue_item === 'object' && issue_item !== null) {
            return { 
                issue: String(issue_item.issue || "Issue text missing from parsed object."), 
                how_to_fix: String(issue_item.how_to_fix || "Fix details not provided in parsed object.") 
            };
        }
        return { issue: "Invalid issue format in parsed data.", how_to_fix: "Review needed."};
    }).slice(0,5); // Limit to 5 issues

    // Robust mapping for recommendations
    finalParsed.recommendations = (Array.isArray(parsed.recommendations) ? parsed.recommendations : []).map(rec_item => {
        if (typeof rec_item === 'string') return { recommendation: rec_item, benefit: "Benefit details require review." };
        if (typeof rec_item === 'object' && rec_item !== null) {
            return { 
                recommendation: String(rec_item.recommendation || "Recommendation text missing from parsed object."), 
                benefit: String(rec_item.benefit || "Benefit details not provided in parsed object.") 
            };
        }
        return { recommendation: "Invalid recommendation format in parsed data.", benefit: "Review needed."};
    }).slice(0,5); // Limit to 5 recommendations
    
    return finalParsed;
  }

  async createOverallSummary(rawAnalysisData, formattedPageAnalyses) {
    console.log('📊 Creating overall summary for main page...');
    const prompt = getFormattingPrompts().overallSummary(rawAnalysisData, formattedPageAnalyses);
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 3500,
        messages: [{ role: 'user', content: prompt }]
      });
      const summaryText = response.content[0].text.trim();
      let parsedSummary = this.parseJSON(summaryText, 'overall summary');
      
      // Ensure all required fields exist in parsedSummary, using fallback if necessary
      const fallbackSummary = this.createFallbackSummary(rawAnalysisData, formattedPageAnalyses);
      parsedSummary = {
          ...fallbackSummary, // Start with fallback defaults
          ...parsedSummary,   // Overlay with what was successfully parsed
          total_pages_analyzed: formattedPageAnalyses.length, // Ensure this is accurate
          overall_score: typeof parsedSummary.overall_score === 'number' ? parsedSummary.overall_score : fallbackSummary.overall_score,
      };
      // Ensure arrays are arrays of strings as per the overallSummary prompt's JSON structure
      parsedSummary.most_critical_issues = (Array.isArray(parsedSummary.most_critical_issues) ? parsedSummary.most_critical_issues : []).map(String);
      parsedSummary.top_recommendations = (Array.isArray(parsedSummary.top_recommendations) ? parsedSummary.top_recommendations : []).map(String);
      parsedSummary.key_strengths = (Array.isArray(parsedSummary.key_strengths) ? parsedSummary.key_strengths : []).map(String);

      return parsedSummary;

    } catch (error) {
      console.error('   ❌ Failed to create overall summary via LLM:', error.message);
      return this.createFallbackSummary(rawAnalysisData, formattedPageAnalyses);
    }
  }

  createFallbackPageAnalysis(pageAnalysisInput, index) {
    const originalAnalysisText = (pageAnalysisInput && typeof pageAnalysisInput.analysis === 'string') ? pageAnalysisInput.analysis : "Raw analysis not available.";
    const url = (pageAnalysisInput && typeof pageAnalysisInput.url === 'string') ? pageAnalysisInput.url : `Unknown URL ${index}`;

    const sectionScores = this.extractSectionScores(originalAnalysisText);
    const key_issue_items = this.extractListFallback(originalAnalysisText, ['CRITICAL FLAWS', 'issues', 'problems', 'flaws']).slice(0, 3);
    const recommendation_items = this.extractListFallback(originalAnalysisText, ['ACTIONABLE RECOMMENDATIONS', 'recommendations', 'suggestions', 'improvements']).slice(0, 3);

    return {
      page_type: this.extractPageType(url),
      title: `${this.extractPageType(url)} (Review Needed)`,
      url: url,
      overall_score: 2,
      overall_explanation: "Formatting failed. Data based on fallback. Manual review needed.",
      sections: [],
      section_scores: sectionScores,
      key_issues: key_issue_items.map(item => typeof item === 'object' && item.issue ? item : { issue: String(item.issue || item), how_to_fix: String(item.how_to_fix || "Manual review required.") }),
      recommendations: recommendation_items.map(item => typeof item === 'object' && item.recommendation ? item : { recommendation: String(item.recommendation || item), benefit: String(item.benefit || "Manual review required.") }),
      summary: (originalAnalysisText.substring(0, 150) + (originalAnalysisText.length > 150 ? '...' : '')),
      original_analysis: originalAnalysisText
    };
  }

  createFallbackSummary(rawAnalysisData, pageAnalyses) {
    let avgScore = 3;
    const validScores = pageAnalyses.filter(p => p && typeof p.overall_score === 'number').map(p => p.overall_score);
    if (validScores.length > 0) {
      avgScore = Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length);
    }
    return {
      executive_summary: (rawAnalysisData.overview && typeof rawAnalysisData.overview === 'string' ? rawAnalysisData.overview.substring(0,500) : 'Overall website analysis requires review.'),
      overall_score: avgScore,
      total_pages_analyzed: pageAnalyses.length,
      most_critical_issues: ['Review individual page analyses for critical issues.'],
      top_recommendations: ['Implement fixes based on manual review.'],
      key_strengths: ['General site functionality noted; detailed strengths require review.'],
      performance_summary: (rawAnalysisData.technicalSummary && typeof rawAnalysisData.technicalSummary === 'string' ? rawAnalysisData.technicalSummary.substring(0,200) : 'Technical performance summary requires manual review.')
    };
  }
}

module.exports = { Formatter };