function getScoringDefinitions() {
  return `
    SCORING RUBRIC:
    1-3: Poor - Significantly hinders user experience and requires immediate attention
    4-5: Below Average - Has notable issues affecting effectiveness
    6-7: Average - Functional but with clear opportunities for improvement
    8-9: Good - Effectively supports goals with minor refinements needed
    10: Excellent - Exemplary implementation with no significant issues
  `;
}

function getExampleSection() {
  return `
    EXAMPLES OF PROPERLY FORMATTED RESPONSES:
    
    CRITICAL FLAWS EXAMPLE:
    1. Inconsistent Navigation Structure (Severity: High) - The main navigation bar changes layout and options between pages, causing user confusion and hindering site exploration.
    
    RECOMMENDATIONS EXAMPLE:
    1. Implement Consistent Call-to-Action Buttons (Impact: High) - Standardize the design, color, and positioning of action buttons across all pages to create a clear visual pattern that users can easily recognize and follow.
    
    SCORING EXAMPLE:
    VISUAL DESIGN (Score: 7/10)
    - The color palette is consistent and aligned with the organization's brand
    - Typography hierarchy effectively guides users through content
    - Image quality is inconsistent, with some low-resolution photos
    - White space is well-utilized to create a clean, uncluttered experience
    - EVIDENCE: The homepage hero section demonstrates effective use of brand colors and typography, but the "Our Projects" section contains pixelated images that diminish credibility.
  `;
}

function createAnalysisPrompt(pageType, context, sections) {
  let prompt = `You are a UX/UI expert analyzing a ${pageType} for ${context.org_name || 'this organization'}, a ${context.org_type || 'organization'}.
    
    WEBSITE PURPOSE: ${context.org_purpose || 'to achieve its business goals and serve its users effectively'}
    
    ${getScoringDefinitions()}
    
    Provide a detailed, critical analysis focusing on how well this supports the organization's goals.\n\n`;
    
    // Add each section
    sections.forEach(section => {
      prompt += `${section.number}. ${section.name} (Score: ?/10)\n`;
      section.questions.forEach(question => {
        prompt += `   - ${question}\n`;
      });
      prompt += `   - EVIDENCE: Cite specific examples from the ${pageType}\n\n`;
    });
    
    // Add standard sections at the end
    prompt += `
    CRITICAL FLAWS:
    - Identify the 3 most significant problems (numbered)
    - Rate each issue's severity (High/Medium/Low)
    - For each flaw, provide a brief "How to Fix" section detailing steps to resolve it.
    - Format as: "1. [Issue title] (Severity: High) - [Description] How to Fix: [Fix details]"

    ACTIONABLE RECOMMENDATIONS:
    - Provide 5 specific, prioritized recommendations (numbered)
    - Rate each recommendation's impact (High/Medium/Low)
    - For each recommendation, describe the primary "Benefit" of implementing it.
    - Format as: "1. [Recommendation] (Impact: High) - [Implementation details]"
    
    SUMMARY:
    - Overall effectiveness score (1-10)
    - 2-3 sentence summary of strengths and weaknesses
    - Single highest-priority action for improvement
    `;
    
    return prompt;
}

function getAnalysisPrompt(type, data) {
  const context = {
    org_name: data.context?.org_name || 'the organization',
    org_type: data.context?.org_type || 'organization',
    org_purpose: data.context?.org_purpose || 'to achieve its business goals and serve its users effectively'
  };

  switch (type) {
    case 'comprehensive_overview':
      return `You are a senior UX/UI consultant providing a comprehensive final analysis of ${context.org_name}, a ${context.org_type}.

      WEBSITE PURPOSE: ${context.org_purpose}

      Please format your response as a Markdown document.
      The main sections of your report should be H2 headings (e.g., ## Section Title).
      Sub-sections should use H3 headings (e.g., ### Subsection Title), and bullet points for lists.

      This is the final step of our analysis. You now have access to:
      1. All website screenshots
      2. Detailed individual page analyses
      3. Technical performance summary
      4. All Lighthouse performance data

      INDIVIDUAL PAGE ANALYSES:
      ${data.pageAnalyses.map(page => `
      === ${page.url} ===
      ${page.analysis}
      `).join('\n\n')}

      TECHNICAL SUMMARY:
      ${data.technicalSummary}

      LIGHTHOUSE SCORES SUMMARY:
      ${data.pages.map(page => `
      - ${page.url}
        Performance: ${page.lighthouseScores?.performance ? (page.lighthouseScores.performance * 100).toFixed(1) + '%' : 'N/A'}
        Accessibility: ${page.lighthouseScores?.accessibility ? (page.lighthouseScores.accessibility * 100).toFixed(1) + '%' : 'N/A'}
        Best Practices: ${page.lighthouseScores?.bestPractices ? (page.lighthouseScores.bestPractices * 100).toFixed(1) + '%' : 'N/A'}
        SEO: ${page.lighthouseScores?.seo ? (page.lighthouseScores.seo * 100).toFixed(1) + '%' : 'N/A'}
      `).join('\n')}

      Based on all this comprehensive data, provide the following sections using the specified Markdown heading levels:

      ## EXECUTIVE SUMMARY
         - Provide an overall assessment of the website's effectiveness (Score: ?/10).
         - How well does it achieve ${context.org_purpose}?
         - Summarize key strengths and critical weaknesses.

      ## KEY FINDINGS
         ### Top 3 strengths discovered across all analyses
           - Strength 1: (Description)
           - Strength 2: (Description)
           - Strength 3: (Description)
         ### Top 5 critical issues that must be addressed
           - Issue 1 (Severity: High/Medium/Low) - (Description). How to Fix: (Details).
           - Issue 2 (Severity: High/Medium/Low) - (Description). How to Fix: (Details).
           - ...and so on for up to 5 issues.

      ## STRATEGIC RECOMMENDATIONS
         ### Priority fixes (Critical/High/Medium priority)
           - Recommendation 1 (Impact: High/Medium/Low, Effort: High/Medium/Low) - (Details).
           - ...
         ### Performance optimizations
           - (Recommendation and details)
           - ...
         ### User experience enhancements
           - (Recommendation and details)
           - ...
         ### Accessibility improvements
           - (Recommendation and details)
           - ...
           (Each recommendation should include estimated impact and implementation effort where possible)

      ## OVERALL THEME ASSESSMENT
         ### Consistency of brand identity across pages
           - (Your assessment)
         ### How well the visual design supports the mission
           - (Your assessment)
         ### Areas where the design either helps or hinders conversions
           - (Your assessment)

      ## IMPLEMENTATION ROADMAP
         ### Quick wins (1-2 weeks)
           - (Actionable item 1)
           - (Actionable item 2)
           - ...
         ### Medium-term improvements (1-2 months)
           - (Actionable item 1)
           - ...
         ### Long-term strategic changes (3-6 months)
           - (Actionable item 1)
           - ...

      Synthesize all previous analyses into actionable insights within this Markdown structure.
      Ensure your language is professional and consultancy-grade.
      `;

    case 'page':
      const pageSections = [
        {
          number: 1,
          name: "FIRST IMPRESSION & CLARITY",
          questions: [
            "How quickly can a visitor understand what this page is about?",
            "Does the visual hierarchy effectively guide users to important content?",
            "Is the page's purpose immediately clear within the site context?"
          ]
        },
        {
          number: 2,
          name: "GOAL ALIGNMENT",
          questions: [
            `How effectively does this page support the website's purpose: ${context.org_purpose}?`,
            "Are there clear calls-to-action aligned with the organization's goals?",
            "Is the most important content given appropriate prominence?"
          ]
        },
        {
          number: 3,
          name: "VISUAL DESIGN",
          questions: [
            "How polished and professional is the visual presentation?",
            "Is the use of color, typography, and imagery effective and on-brand?",
            "Does the layout create a pleasing, easy-to-scan visual experience?"
          ]
        },
        {
          number: 4,
          name: "CONTENT QUALITY",
          questions: [
            "Is the content concise, compelling, and audience-appropriate?",
            "Do headings and text effectively communicate key messages?",
            "Is there a clear hierarchy in how information is presented?"
          ]
        },
        {
          number: 5,
          name: "USABILITY & ACCESSIBILITY",
          questions: [
            "Are there any obvious usability barriers or points of confusion?",
            "Would users of varying abilities be able to navigate and use this page?",
            "Are interactive elements (links, buttons, forms) clear and intuitive?"
          ]
        },
        {
          number: 6,
          name: "CONVERSION OPTIMIZATION",
          questions: [
            "How effectively does this page guide users toward desired actions?",
            "Are CTAs visible, compelling, and appropriately positioned?",
            "Does the page remove friction from the user journey?"
          ]
        },
        {
          number: 7,
          name: "TECHNICAL EXECUTION",
          questions: [
            "Are there any visible implementation issues or inconsistencies?",
            "Is content properly aligned and spaced?",
            "Are images appropriately sized and displayed?"
          ]
        }
      ];

      let pagePrompt = createAnalysisPrompt(`${data.page_type || 'webpage'}`, context, pageSections);
      
      pagePrompt += `
      URL: ${data.url}
      
      Lighthouse Performance Metrics:
      ${data.lighthouse ? formatLighthouseMetrics(data.lighthouse) : 'No lighthouse data available'}
      
      PAGE ROLE ANALYSIS:
      - Considering this is a ${data.page_type || 'webpage'}, how well does it fulfill its specific purpose?
      - Is there anything missing that would be expected on this type of page?
      - Does this page effectively connect to other likely pages in the user journey?
      `;
      
      pagePrompt += getExampleSection();
      return pagePrompt;

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
  getAnalysisPrompt,
  getScoringDefinitions, // Exporting this as it's used internally by createAnalysisPrompt
  getExampleSection, // Exporting this for the same reason
  createAnalysisPrompt, // Exporting this if it's intended to be reusable
  formatLighthouseMetrics // Exporting this as it's a utility function
};