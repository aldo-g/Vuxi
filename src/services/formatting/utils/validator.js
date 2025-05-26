/**
 * Validates and cleans up structured data from LLM.
 * 
 * @param {Object} data - The structured data from formatting stage
 * @returns {Object} Validation result with status and data or errors
 */
function validateStructuredData(data) {
    const errors = [];
    
    // Check required top-level keys
    const requiredKeys = ["overview", "critical_issues", "recommendations", "strengths"];
    for (const key of requiredKeys) {
      if (!data[key]) {
        errors.push(`Missing required key: ${key}`);
        data[key] = key === 'overview' ? { text: '', overall_score: 5 } : [];
      }
    }
    
    // Validate overview
    if (data.overview) {
      if (!data.overview.executive_summary) {
        data.overview.executive_summary = '';
        errors.push('Missing executive_summary in overview');
      }
      
      if (typeof data.overview.overall_score !== 'number' || 
          data.overview.overall_score < 1 || 
          data.overview.overall_score > 10) {
        data.overview.overall_score = 5;
        errors.push('Invalid overall_score (should be number between 1-10)');
      }
    }
    
    // Validate scores
    if (data.scores) {
      if (!Array.isArray(data.scores)) {
        errors.push('scores should be an array');
        data.scores = [];
      } else {
        for (let i = 0; i < data.scores.length; i++) {
          const score = data.scores[i];
          if (!score.category) {
            score.category = `Unnamed Category ${i + 1}`;
            errors.push(`Score ${i} missing category`);
          }
          if (typeof score.score !== 'number' || score.score < 1 || score.score > 10) {
            errors.push(`Score ${i} has invalid value: ${score.score}`);
            score.score = 5;
          }
          if (!score.description) {
            score.description = 'No description provided';
            errors.push(`Score ${i} missing description`);
          }
        }
      }
    } else {
      data.scores = [];
    }
    
    // Validate critical_issues, recommendations, strengths
    ['critical_issues', 'recommendations', 'strengths'].forEach(field => {
      if (!Array.isArray(data[field])) {
        errors.push(`${field} should be an array`);
        data[field] = [];
      }
    });
    
    // Validate page_analyses
    if (data.page_analyses) {
      if (!Array.isArray(data.page_analyses)) {
        errors.push('page_analyses should be an array');
        data.page_analyses = [];
      } else {
        for (let i = 0; i < data.page_analyses.length; i++) {
          const page = data.page_analyses[i];
          if (!page.page_type) {
            page.page_type = `Page ${i + 1}`;
            errors.push(`Page analysis ${i} missing page_type`);
          }
          if (!page.url) {
            errors.push(`Page analysis ${i} missing url`);
          }
          if (!Array.isArray(page.critical_flaws)) {
            page.critical_flaws = [];
            errors.push(`Page analysis ${i} critical_flaws should be an array`);
          }
          if (!Array.isArray(page.recommendations)) {
            page.recommendations = [];
            errors.push(`Page analysis ${i} recommendations should be an array`);
          }
          if (!page.summary) {
            page.summary = '';
            errors.push(`Page analysis ${i} missing summary`);
          }
        }
      }
    } else {
      data.page_analyses = [];
    }
    
    // Validate technical_summary
    if (!data.technical_summary) {
      data.technical_summary = '';
      errors.push('Missing technical_summary');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors,
      data: data
    };
  }
  
  module.exports = { validateStructuredData };