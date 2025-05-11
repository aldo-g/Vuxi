const fs = require('fs-extra');
const path = require('path');

/**
 * Prepares an image for LLM analysis
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<Object>} Image data formatted for LLM
 */
async function prepareImageForLLM(imagePath) {
  try {
    // Read the image file
    const imageBuffer = await fs.readFile(imagePath);
    
    // Convert to base64
    const base64Data = imageBuffer.toString('base64');
    
    // Determine media type from extension
    const ext = path.extname(imagePath).toLowerCase();
    let mediaType = 'image/png';
    
    if (ext === '.jpg' || ext === '.jpeg') {
      mediaType = 'image/jpeg';
    } else if (ext === '.gif') {
      mediaType = 'image/gif';
    } else if (ext === '.webp') {
      mediaType = 'image/webp';
    }
    
    return {
      data: base64Data,
      mediaType: mediaType,
      filename: path.basename(imagePath)
    };
  } catch (error) {
    console.error(`Error preparing image ${imagePath}:`, error);
    throw error;
  }
}

/**
 * Processes raw LLM analysis results into structured format
 * @param {Object} rawAnalysis - Raw analysis from LLM
 * @param {Array} screenshots - Screenshot data
 * @param {Array} lighthouseData - Lighthouse report data
 * @returns {Promise<Object>} Structured analysis results
 */
async function processAnalysisResults(rawAnalysis, screenshots, lighthouseData) {
  try {
    // Structure the data for easier consumption
    const processed = {
      timestamp: new Date().toISOString(),
      summary: {
        overview: rawAnalysis.overview || '',
        technicalSummary: rawAnalysis.technicalSummary || '',
        keyFindings: extractKeyFindings(rawAnalysis),
        averageScores: calculateAverageScores(lighthouseData)
      },
      pages: [],
      recommendations: {
        priority: extractPriorityRecommendations(rawAnalysis.recommendations),
        technical: extractTechnicalRecommendations(rawAnalysis.recommendations),
        ux: extractUXRecommendations(rawAnalysis.recommendations),
        performance: extractPerformanceRecommendations(rawAnalysis.recommendations)
      },
      metadata: {
        totalPages: screenshots.length,
        analysisProvider: rawAnalysis.provider,
        analysisModel: rawAnalysis.model,
        generatedAt: rawAnalysis.timestamp
      }
    };
    
    // Process each page analysis
    for (let i = 0; i < rawAnalysis.pageAnalyses.length; i++) {
      const pageAnalysis = rawAnalysis.pageAnalyses[i];
      const screenshot = screenshots[i];
      const lighthouse = lighthouseData[i];
      
      processed.pages.push({
        url: screenshot?.url || lighthouse?.url,
        analysis: pageAnalysis,
        screenshots: screenshot ? [{
          filename: screenshot.filename,
          path: screenshot.path
        }] : [],
        lighthouse: lighthouse ? {
          scores: lighthouse.data.scores,
          metrics: lighthouse.data.metrics,
          coreWebVitals: lighthouse.data.coreWebVitals
        } : null,
        findings: extractPageFindings(pageAnalysis),
        suggestions: extractPageSuggestions(pageAnalysis)
      });
    }
    
    return processed;
  } catch (error) {
    console.error('Error processing analysis results:', error);
    throw error;
  }
}

/**
 * Calculate average lighthouse scores across all pages
 */
function calculateAverageScores(lighthouseData) {
  if (!lighthouseData || lighthouseData.length === 0) return null;
  
  const scores = {
    performance: 0,
    accessibility: 0,
    bestPractices: 0,
    seo: 0
  };
  
  let count = 0;
  
  lighthouseData.forEach(item => {
    if (item.data && item.data.scores) {
      if (item.data.scores.performance) scores.performance += item.data.scores.performance.score;
      if (item.data.scores.accessibility) scores.accessibility += item.data.scores.accessibility.score;
      if (item.data.scores['best-practices']) scores.bestPractices += item.data.scores['best-practices'].score;
      if (item.data.scores.seo) scores.seo += item.data.scores.seo.score;
      count++;
    }
  });
  
  if (count === 0) return null;
  
  return {
    performance: (scores.performance / count * 100).toFixed(1),
    accessibility: (scores.accessibility / count * 100).toFixed(1),
    bestPractices: (scores.bestPractices / count * 100).toFixed(1),
    seo: (scores.seo / count * 100).toFixed(1)
  };
}

/**
 * Extract key findings from raw analysis
 */
function extractKeyFindings(rawAnalysis) {
  // This would parse the LLM output to extract key findings
  // For now, we'll return a basic structure
  return {
    strengths: [],
    weaknesses: [],
    opportunities: [],
    threats: []
  };
}

/**
 * Extract recommendations by category
 */
function extractPriorityRecommendations(recommendations) {
  if (!recommendations) return [];
  
  // Parse LLM output to extract priority recommendations
  // This is a simplified version - you'd want more sophisticated parsing
  const lines = recommendations.split('\n');
  return lines
    .filter(line => line.includes('Priority') || line.includes('High') || line.includes('Critical'))
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

function extractTechnicalRecommendations(recommendations) {
  if (!recommendations) return [];
  
  const lines = recommendations.split('\n');
  return lines
    .filter(line => line.includes('Technical') || line.includes('Code') || line.includes('Performance'))
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

function extractUXRecommendations(recommendations) {
  if (!recommendations) return [];
  
  const lines = recommendations.split('\n');
  return lines
    .filter(line => line.includes('UX') || line.includes('User') || line.includes('Design'))
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

function extractPerformanceRecommendations(recommendations) {
  if (!recommendations) return [];
  
  const lines = recommendations.split('\n');
  return lines
    .filter(line => line.includes('Performance') || line.includes('Speed') || line.includes('Loading'))
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

/**
 * Extract findings from individual page analysis
 */
function extractPageFindings(pageAnalysis) {
  if (!pageAnalysis) return [];
  
  // Parse the analysis to extract specific findings
  const lines = pageAnalysis.split('\n');
  return lines
    .filter(line => line.startsWith('-') || line.startsWith('•') || line.startsWith('*'))
    .map(line => line.replace(/^[-•*]\s*/, '').trim())
    .filter(line => line.length > 0);
}

/**
 * Extract suggestions from individual page analysis
 */
function extractPageSuggestions(pageAnalysis) {
  if (!pageAnalysis) return [];
  
  // Parse the analysis to extract suggestions
  const lines = pageAnalysis.split('\n');
  return lines
    .filter(line => line.includes('suggest') || line.includes('recommend') || line.includes('improve'))
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

module.exports = {
  prepareImageForLLM,
  processAnalysisResults,
  calculateAverageScores,
  extractKeyFindings,
  extractPriorityRecommendations,
  extractTechnicalRecommendations,
  extractUXRecommendations,
  extractPerformanceRecommendations,
  extractPageFindings,
  extractPageSuggestions
};