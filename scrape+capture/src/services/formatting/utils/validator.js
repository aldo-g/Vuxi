/**
 * Validates structured data for individual pages + overall summary format
 */
function validateStructuredData(data) {
  const errors = [];
  
  // Check required top-level keys for NEW structure
  const requiredKeys = ["overall_summary", "page_analyses", "metadata"];
  for (const key of requiredKeys) {
    if (!data[key]) {
      errors.push(`Missing required key: ${key}`);
      if (key === 'overall_summary') {
        data[key] = {
          executive_summary: 'Website analysis completed',
          overall_score: 6,
          total_pages_analyzed: 0,
          most_critical_issues: [],
          top_recommendations: [],
          key_strengths: [],
          performance_summary: 'Performance evaluated'
        };
      } else if (key === 'page_analyses') {
        data[key] = [];
      } else if (key === 'metadata') {
        data[key] = {
          total_pages: 0,
          generated_at: new Date().toISOString()
        };
      }
    }
  }
  
  // Validate overall summary
  if (data.overall_summary) {
    const summary = data.overall_summary;
    
    if (!summary.executive_summary) {
      summary.executive_summary = 'Website analysis completed';
      errors.push('Missing executive_summary in overall_summary');
    }
    
    if (typeof summary.overall_score !== 'number' || 
        summary.overall_score < 1 || 
        summary.overall_score > 10) {
      summary.overall_score = 6;
      errors.push('Invalid overall_score (should be number between 1-10)');
    }
    
    if (!Array.isArray(summary.most_critical_issues)) {
      summary.most_critical_issues = [];
      errors.push('most_critical_issues should be an array');
    }
    
    if (!Array.isArray(summary.top_recommendations)) {
      summary.top_recommendations = [];
      errors.push('top_recommendations should be an array');
    }
    
    if (!Array.isArray(summary.key_strengths)) {
      summary.key_strengths = [];
      errors.push('key_strengths should be an array');
    }
    
    if (!summary.performance_summary) {
      summary.performance_summary = 'Performance evaluated';
      errors.push('Missing performance_summary');
    }
  }
  
  // Validate page analyses
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
        
        if (typeof page.overall_score !== 'number' || 
            page.overall_score < 1 || 
            page.overall_score > 10) {
          page.overall_score = 5;
          errors.push(`Page analysis ${i} has invalid overall_score`);
        }
        
        // Validate section scores if present
        if (page.section_scores) {
          if (typeof page.section_scores !== 'object' || Array.isArray(page.section_scores)) {
            page.section_scores = {};
            errors.push(`Page analysis ${i} section_scores should be an object`);
          } else {
            // Validate individual section scores
            const validSections = [
              'first_impression_clarity',
              'goal_alignment',
              'visual_design',
              'content_quality',
              'usability_accessibility',
              'conversion_optimization',
              'technical_execution'
            ];
            
            for (const [sectionName, score] of Object.entries(page.section_scores)) {
              if (!validSections.includes(sectionName)) {
                errors.push(`Page analysis ${i} has invalid section name: ${sectionName}`);
              }
              
              if (typeof score !== 'number' || score < 1 || score > 10) {
                page.section_scores[sectionName] = 5;
                errors.push(`Page analysis ${i} has invalid section score for ${sectionName}: ${score}`);
              }
            }
          }
        }
        
        // Fix: expect key_issues not critical_flaws
        if (!Array.isArray(page.key_issues)) {
          page.key_issues = [];
          errors.push(`Page analysis ${i} key_issues should be an array`);
        }
        
        if (!Array.isArray(page.recommendations)) {
          page.recommendations = [];
          errors.push(`Page analysis ${i} recommendations should be an array`);
        }
        
        if (!page.summary) {
          page.summary = 'Page analysis available';
          errors.push(`Page analysis ${i} missing summary`);
        }
        
        if (!page.title) {
          page.title = page.page_type || 'Page';
          errors.push(`Page analysis ${i} missing title`);
        }
      }
    }
  }
  
  // Validate metadata
  if (data.metadata) {
    if (typeof data.metadata.total_pages !== 'number') {
      data.metadata.total_pages = (data.page_analyses || []).length;
    }
    if (!data.metadata.generated_at) {
      data.metadata.generated_at = new Date().toISOString();
    }
  }
  
  return {
    valid: errors.length === 0,
    errors: errors,
    data: data
  };
}

module.exports = { validateStructuredData };