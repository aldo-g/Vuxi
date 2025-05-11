function getAnalysisPrompt(type, data) {
    switch (type) {
      case 'overview':
        return `Analyze this website's overall structure and performance based on the following data:
  
  Pages analyzed: ${data.pages.length}
  
  Lighthouse scores by page:
  ${data.pages.map(page => `
  - ${page.url}
    Performance: ${page.lighthouseScores?.performance ? (page.lighthouseScores.performance * 100).toFixed(1) + '%' : 'N/A'}
    Accessibility: ${page.lighthouseScores?.accessibility ? (page.lighthouseScores.accessibility * 100).toFixed(1) + '%' : 'N/A'}
    Best Practices: ${page.lighthouseScores?.bestPractices ? (page.lighthouseScores.bestPractices * 100).toFixed(1) + '%' : 'N/A'}
    SEO: ${page.lighthouseScores?.seo ? (page.lighthouseScores.seo * 100).toFixed(1) + '%' : 'N/A'}
  `).join('\n')}
  
  Please provide:
  1. Overall website structure assessment
  2. Performance trends across pages
  3. Key strengths and areas for improvement
  4. General user experience observations
  
  Format your response in clear, organized sections.`;
  
      case 'page':
        return `Analyze this webpage in detail:
  
  URL: ${data.url}
  
  Lighthouse Performance Metrics:
  ${data.lighthouse ? formatLighthouseMetrics(data.lighthouse) : 'No lighthouse data available'}
  
  Based on the screenshot and performance data, provide:
  1. Visual design assessment
  2. Layout and user experience observations
  3. Performance bottlenecks (if any)
  4. Accessibility considerations
  5. Content organization and readability
  6. Call-to-action effectiveness
  
  Be specific and actionable in your analysis.`;
  
      case 'recommendations':
        return `Based on the comprehensive analysis of this website, provide prioritized recommendations for improvement:
  
  Context: ${data.pages.length} pages analyzed
  
  Please organize recommendations into these categories:
  1. **Priority Fixes** (Critical issues that should be addressed immediately)
  2. **Performance Optimizations** (Speed and loading improvements)
  3. **User Experience Enhancements** (UI/UX improvements)
  4. **Accessibility Improvements** (Make the site more accessible)
  5. **Content & SEO Suggestions** (Content and search optimization)
  
  For each recommendation:
  - Explain the issue clearly
  - Provide specific, actionable steps
  - Estimate the potential impact
  - Suggest implementation priority (High/Medium/Low)
  
  Format as a structured list with clear categories.`;
  
      default:
        return 'Please analyze the provided website data and screenshots.';
    }
  }
  
  function formatLighthouseMetrics(lighthouse) {
    if (!lighthouse.metrics) return 'No metrics available';
    
    return `
  Core Web Vitals:
  - First Contentful Paint: ${lighthouse.metrics.firstContentfulPaint || 'N/A'}ms
  - Largest Contentful Paint: ${lighthouse.metrics.largestContentfulPaint || 'N/A'}ms
  - Total Blocking Time: ${lighthouse.metrics.totalBlockingTime || 'N/A'}ms
  - Cumulative Layout Shift: ${lighthouse.metrics.cumulativeLayoutShift || 'N/A'}
  - Speed Index: ${lighthouse.metrics.speedIndex || 'N/A'}
  
  Overall Scores:
  - Performance: ${lighthouse.scores?.performance ? (lighthouse.scores.performance.score * 100).toFixed(1) + '%' : 'N/A'}
  - Accessibility: ${lighthouse.scores?.accessibility ? (lighthouse.scores.accessibility.score * 100).toFixed(1) + '%' : 'N/A'}
  - Best Practices: ${lighthouse.scores?.['best-practices'] ? (lighthouse.scores['best-practices'].score * 100).toFixed(1) + '%' : 'N/A'}
  - SEO: ${lighthouse.scores?.seo ? (lighthouse.scores.seo.score * 100).toFixed(1) + '%' : 'N/A'}
  `;
  }
  
  module.exports = {
    getAnalysisPrompt
  };