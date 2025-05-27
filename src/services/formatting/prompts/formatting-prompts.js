/**
 * Formatting prompts for individual pages and overall summary
 */

function getFormattingPrompts() {
  return {
    individualPage: (pageAnalysis) => `
You are formatting a website page analysis for HTML display. Extract key information from this raw analysis and structure it cleanly.

PAGE ANALYSIS:
URL: ${pageAnalysis.url}
Raw Analysis: ${pageAnalysis.analysis}

You MUST return ONLY valid JSON with this EXACT structure (no additional text, no markdown formatting):

{
  "page_type": "Homepage",
  "title": "Descriptive page title",
  "overall_score": 7,
  "key_issues": [
    "Most important issue 1",
    "Most important issue 2",
    "Most important issue 3"
  ],
  "recommendations": [
    "Specific recommendation 1",
    "Specific recommendation 2", 
    "Specific recommendation 3"
  ],
  "summary": "2-3 sentence summary of this page's analysis"
}

CRITICAL: 
- Return ONLY the JSON object
- No code blocks, no \`\`\`json\`\`\`, no extra text
- overall_score must be a number 1-10
- All arrays must contain strings
- Extract 3-5 most important issues and recommendations`,

    overallSummary: (rawAnalysisData, pageAnalyses) => `
You are creating an executive summary for a website analysis. This will be the main page that summarizes findings across all pages.

FULL ANALYSIS DATA:
Overview: ${JSON.stringify(rawAnalysisData.overview || 'No overview', null, 2)}
Technical Summary: ${JSON.stringify(rawAnalysisData.technicalSummary || 'No technical summary', null, 2)}
Total Pages: ${pageAnalyses.length}

INDIVIDUAL PAGE SUMMARIES:
${pageAnalyses.map(page => `- ${page.url}: ${page.summary || 'No summary available'}`).join('\n')}

You MUST return ONLY valid JSON with this EXACT structure (no additional text, no markdown formatting):

{
  "executive_summary": "2-3 paragraph executive summary of key findings across the entire website",
  "overall_score": 7,
  "total_pages_analyzed": ${pageAnalyses.length},
  "most_critical_issues": [
    "Site-wide critical issue 1",
    "Site-wide critical issue 2",
    "Site-wide critical issue 3",
    "Site-wide critical issue 4",
    "Site-wide critical issue 5"
  ],
  "top_recommendations": [
    "Priority recommendation 1", 
    "Priority recommendation 2",
    "Priority recommendation 3",
    "Priority recommendation 4",
    "Priority recommendation 5"
  ],
  "key_strengths": [
    "What the website does well 1",
    "What the website does well 2",
    "What the website does well 3"
  ],
  "performance_summary": "1-2 sentence technical performance overview"
}

CRITICAL:
- Return ONLY the JSON object
- No code blocks, no \`\`\`json\`\`\`, no extra text
- overall_score must be a number 1-10
- Focus on SITE-WIDE issues, not page-specific details
- All arrays must contain strings`
  };
}

module.exports = { getFormattingPrompts };