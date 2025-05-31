/**
 * Validates structured data for individual pages + overall summary format
 */
function validateStructuredData(data) {
  const errors = [];

  // Check required top-level keys
  const requiredKeys = ["overall_summary", "page_analyses", "metadata"];
  for (const key of requiredKeys) {
    if (!data[key]) {
      errors.push(`Missing required key: ${key}`);
      // Provide default structures for missing top-level keys
      if (key === 'overall_summary') {
        data[key] = {
          executive_summary: 'Default executive summary.',
          overall_score: 5,
          site_score_explanation: 'Default site score explanation.', // Added default
          total_pages_analyzed: 0,
          most_critical_issues: [],
          top_recommendations: [],
          key_strengths: [],
          performance_summary: 'Default performance summary.',
          detailed_markdown_content: 'No detailed markdown content provided for overview.'
        };
      } else if (key === 'page_analyses') {
        data[key] = [];
      } else if (key === 'metadata') {
        data[key] = {
          total_pages: 0,
          analysis_provider: 'unknown',
          analysis_model: 'unknown',
          generated_at: new Date().toISOString()
        };
      }
    }
  }

  // Validate overall_summary
  if (data.overall_summary) {
    const summary = data.overall_summary;
    if (!summary.executive_summary || typeof summary.executive_summary !== 'string') {
      summary.executive_summary = 'Executive summary not provided or invalid.';
      errors.push('overall_summary.executive_summary is missing or not a string');
    }
    if (typeof summary.overall_score !== 'number' || summary.overall_score < 1 || summary.overall_score > 10) {
      summary.overall_score = 5; 
      errors.push('overall_summary.overall_score is invalid (must be number 1-10)');
    }
    // UPDATED: Validate site_score_explanation
    if (!summary.site_score_explanation || typeof summary.site_score_explanation !== 'string' || summary.site_score_explanation.trim() === "") {
      summary.site_score_explanation = 'Site score explanation not provided or invalid.';
      errors.push('overall_summary.site_score_explanation is missing, not a string, or empty');
    }
    if (!Array.isArray(summary.most_critical_issues)) {
      summary.most_critical_issues = []; errors.push('overall_summary.most_critical_issues must be an array');
    } else {
      summary.most_critical_issues.forEach((item, i) => {
        if(typeof item !== 'string') errors.push(`overall_summary.most_critical_issues[${i}] is not a string`);
      });
    }
    if (!Array.isArray(summary.top_recommendations)) {
      summary.top_recommendations = []; errors.push('overall_summary.top_recommendations must be an array');
    } else {
      summary.top_recommendations.forEach((item, i) => {
        if(typeof item !== 'string') errors.push(`overall_summary.top_recommendations[${i}] is not a string`);
      });
    }
    if (!Array.isArray(summary.key_strengths)) {
      summary.key_strengths = []; errors.push('overall_summary.key_strengths must be an array');
    } else {
      summary.key_strengths.forEach((item, i) => {
        if(typeof item !== 'string') errors.push(`overall_summary.key_strengths[${i}] is not a string`);
      });
    }
    if (!summary.performance_summary || typeof summary.performance_summary !== 'string') {
      summary.performance_summary = 'Performance summary not provided or invalid.';
      errors.push('overall_summary.performance_summary is missing or not a string');
    }
    if (!summary.detailed_markdown_content || typeof summary.detailed_markdown_content !== 'string') {
      summary.detailed_markdown_content = 'Detailed markdown content for overview is missing or not a string.'; 
      errors.push('overall_summary.detailed_markdown_content is missing or not a string');
    }
  }

  // Validate page_analyses
  if (data.page_analyses) {
    if (!Array.isArray(data.page_analyses)) {
      errors.push('page_analyses should be an array');
      data.page_analyses = [];
    } else {
      data.page_analyses.forEach((page, i) => {
        if (!page || typeof page !== 'object') {
          errors.push(`Page analysis ${i} is not a valid object.`);
          data.page_analyses[i] = { title: `Invalid Page Data ${i}`, overall_score: 1, key_issues: [], recommendations: [], summary: "", original_analysis:"", section_scores: {}, page_type:"Unknown", url: "" };
          return; 
        }

        if (!page.page_type || typeof page.page_type !== 'string') {
          page.page_type = `Page ${i + 1}`; errors.push(`Page analysis ${i} missing or invalid page_type`);
        }
        if (!page.url || typeof page.url !== 'string') {
          page.url = `unknown-url-${i}`; errors.push(`Page analysis ${i} missing or invalid url`);
        }
        if (typeof page.overall_score !== 'number' || page.overall_score < 1 || page.overall_score > 10) {
          page.overall_score = 3; errors.push(`Page analysis ${i} (${page.url}) has invalid overall_score`);
        }
        if (!page.summary || typeof page.summary !== 'string') {
          page.summary = 'Summary not available.'; errors.push(`Page analysis ${i} (${page.url}) missing or invalid summary`);
        }
        if (!page.original_analysis || typeof page.original_analysis !== 'string') {
          page.original_analysis = 'Raw analysis not available.';
        }

        if (!Array.isArray(page.key_issues)) {
          page.key_issues = []; errors.push(`Page analysis ${i} (${page.url}) key_issues should be an array`);
        } else {
          page.key_issues.forEach((item, idx) => {
            if (typeof item !== 'object' || item === null) {
              errors.push(`Page analysis ${i} (${page.url}) key_issues item ${idx} should be an object`);
              page.key_issues[idx] = { issue: String(item), how_to_fix: "Details needed." };
            } else {
              if (typeof item.issue !== 'string') item.issue = "Issue description missing.";
              if (typeof item.how_to_fix !== 'string') item.how_to_fix = "Fix details missing.";
            }
          });
        }
        if (!Array.isArray(page.recommendations)) {
          page.recommendations = []; errors.push(`Page analysis ${i} (${page.url}) recommendations should be an array`);
        } else {
          page.recommendations.forEach((item, idx) => {
            if (typeof item !== 'object' || item === null) {
              errors.push(`Page analysis ${i} (${page.url}) recommendations item ${idx} should be an object`);
              page.recommendations[idx] = { recommendation: String(item), benefit: "Details needed." };
            } else {
              if (typeof item.recommendation !== 'string') item.recommendation = "Recommendation description missing.";
              if (typeof item.benefit !== 'string') item.benefit = "Benefit details missing.";
            }
          });
        }
      });
    }
  }

  if (data.metadata) {
    if (typeof data.metadata.total_pages !== 'number') {
      data.metadata.total_pages = (data.page_analyses || []).length;
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors,
    data: data 
  };
}

module.exports = { validateStructuredData };