"""
Prompts for screenshot analysis.
"""
from typing import Dict, Any, Optional


def get_desktop_analysis_prompt(context: Optional[Dict[str, Any]] = None) -> str:
    """
    Get the prompt for desktop screenshot analysis with a focus on thematic elements.
    
    Args:
        context (Dict[str, Any], optional): Additional context for the prompt
        
    Returns:
        str: Analysis prompt
    """
    # Default context values
    if context is None:
        context = {}
    
    org_name = context.get('org_name', 'the organization')
    org_type = context.get('org_type', 'non-profit')
    org_purpose = context.get('org_purpose', 'to encourage donations and sign-ups for trainings')
    
    return f"""You are a UX/UI design expert analyzing multiple screenshots of a website for {org_name}, a {org_type} organization. 
    
WEBSITE PURPOSE: {org_purpose}

Provide a comprehensive thematic analysis focusing on overall design patterns and consistency rather than page-specific issues. Evaluate how well the website aligns with the organization's goals and purpose.

Analyze and rate (1-10 scale) the following key areas:

1. BRAND IDENTITY (Score: ?/10)
   - How consistently and effectively is the brand identity expressed across pages?
   - Are there clear visual signatures that build brand recognition?
   - Is there a cohesive color palette aligned with the organization's mission?
   - Does typography reinforce the organization's identity and values?
   - EVIDENCE: Cite specific examples from the screenshots

2. INFORMATION ARCHITECTURE (Score: ?/10)
   - How well-organized is the content across the site?
   - Is navigation consistent and intuitive for the target audience?
   - How well does the hierarchy emphasize the most important content and actions?
   - Would a visitor easily understand what the organization does and how to engage?
   - EVIDENCE: Cite specific examples from the screenshots

3. ACTION-ORIENTED DESIGN (Score: ?/10)
   - How effectively does the design prioritize key actions ({org_purpose})?
   - Are calls-to-action visually prominent and compelling?
   - Is there a clear conversion path for visitors?
   - Does the site create urgency and motivation to engage?
   - EVIDENCE: Cite specific examples from the screenshots

4. VISUAL STORYTELLING (Score: ?/10)
   - Does the imagery tell a cohesive story about the organization?
   - How effectively do visuals communicate the impact and value of the organization?
   - Do the visuals authentically represent the organization's work and community?
   - Is there emotional resonance in the visual language?
   - EVIDENCE: Cite specific examples from the screenshots

5. COMPONENT CONSISTENCY (Score: ?/10)
   - Are UI components (buttons, forms, cards, etc.) used consistently?
   - Is there evidence of a design system or shared component library?
   - Do recurring elements maintain visual consistency across contexts?
   - Are interactive elements visually intuitive?
   - EVIDENCE: Cite specific examples from the screenshots

6. RESPONSIVE DESIGN APPROACH (Score: ?/10)
   - Is there evidence of a cohesive responsive design strategy?
   - Do layouts adapt thoughtfully to different viewport sizes?
   - Is content prioritization appropriate across devices?
   - EVIDENCE: Cite specific examples from the screenshots

7. AUDIENCE ALIGNMENT (Score: ?/10)
   - How well does the design appeal to the likely audience of a {org_type}?
   - Does the visual language match audience expectations and preferences?
   - Is the tone appropriate for driving the desired actions?
   - EVIDENCE: Cite specific examples from the screenshots

OVERALL THEME ASSESSMENT:
- What are the 3-5 defining characteristics of this website's design theme?
- What emotional response does the design evoke, and is this appropriate?
- How well does the design theme support the stated purpose: {org_purpose}?

STRATEGIC RECOMMENDATIONS:
- Provide 3 high-impact recommendations to strengthen thematic consistency
- Suggest approaches to better align the design with the organization's purpose
- Recommend specific visual themes or elements that should be amplified

EFFECTIVENESS SUMMARY:
- Give an overall effectiveness score (1-10) for how well the current design supports the organization's goals
- Explain the primary factors influencing this score
- Identify the single most important area for improvement

Format your analysis as a comprehensive report with distinct sections for each area, including specific examples. Use concrete, evidence-based observations rather than assumptions. Focus on patterns that affect the user's understanding of and engagement with the organization.
"""


def get_individual_page_analysis_prompt(page_type: str, context: Optional[Dict[str, Any]] = None) -> str:
    """
    Get the prompt for analyzing an individual page screenshot with a critical eye.
    
    Args:
        page_type (str): Type of page being analyzed (e.g., "home page", "contact page")
        context (Dict[str, Any], optional): Additional context for the prompt
        
    Returns:
        str: Analysis prompt
    """
    # Default context values
    if context is None:
        context = {}
    
    org_name = context.get('org_name', 'the Edinburgh Peace Institute')
    org_type = context.get('org_type', 'non-profit')
    org_purpose = context.get('org_purpose', 'to encourage donations and sign-ups for trainings')
    
    return f"""You are a UX/UI expert analyzing a {page_type} screenshot for {org_name}, a {org_type} organization.
    
WEBSITE PURPOSE: {org_purpose}

Provide a detailed, critical analysis focusing on how well this specific page supports the organization's goals. Be direct and actionable in your feedback, identifying real problems while suggesting specific improvements.

Analyze and rate (1-10 scale) the following key areas:

1. FIRST IMPRESSION & CLARITY (Score: ?/10)
   - How quickly can a visitor understand what this page is about?
   - Does the visual hierarchy effectively guide users to important content?
   - Is the page's purpose immediately clear within the site context?
   - EVIDENCE: Cite specific visual elements from the screenshot

2. GOAL ALIGNMENT (Score: ?/10)
   - How effectively does this page support the website's purpose: {org_purpose}?
   - Are there clear calls-to-action aligned with the organization's goals?
   - Is the most important content given appropriate prominence?
   - EVIDENCE: Cite specific examples from the screenshot

3. VISUAL DESIGN (Score: ?/10)
   - How polished and professional is the visual presentation?
   - Is the use of color, typography, and imagery effective and on-brand?
   - Does the layout create a pleasing, easy-to-scan visual experience?
   - EVIDENCE: Cite specific design elements from the screenshot

4. CONTENT QUALITY (Score: ?/10)
   - Is the content concise, compelling, and audience-appropriate?
   - Do headings and text effectively communicate key messages?
   - Is there a clear hierarchy in how information is presented?
   - EVIDENCE: Reference visible content from the screenshot

5. USABILITY & ACCESSIBILITY (Score: ?/10)
   - Are there any obvious usability barriers or points of confusion?
   - Would users of varying abilities be able to navigate and use this page?
   - Are interactive elements (links, buttons, forms) clear and intuitive?
   - EVIDENCE: Identify specific usability issues visible in the screenshot

6. CONVERSION OPTIMIZATION (Score: ?/10)
   - How effectively does this page guide users toward desired actions?
   - Are CTAs visible, compelling, and appropriately positioned?
   - Does the page remove friction from the user journey?
   - EVIDENCE: Analyze conversion elements present in the screenshot

7. TECHNICAL EXECUTION (Score: ?/10)
   - Are there any visible implementation issues or inconsistencies?
   - Is content properly aligned and spaced?
   - Are images appropriately sized and displayed?
   - EVIDENCE: Note any technical problems visible in the screenshot

CRITICAL FLAWS:
- Identify the 3 most significant problems that actively harm this page's effectiveness
- Rate each issue's severity (High/Medium/Low) and explain its impact on website goals
- Be specific about exactly where and how these issues appear

POSITIVE ELEMENTS:
- Identify 2-3 elements that are working well and should be preserved
- Explain why these elements are effective in supporting the organization's goals

ACTIONABLE RECOMMENDATIONS:
- Provide 5 specific, prioritized recommendations for improvement
- For each recommendation:
  * Describe exactly what should change
  * Explain how it should be changed (be specific)
  * Detail how this would improve alignment with the website's purpose
- Rate each recommendation's potential impact (High/Medium/Low)

PAGE ROLE ANALYSIS:
- Considering this is a {page_type}, how well does it fulfill its specific purpose?
- Is there anything missing that would be expected on this type of page?
- Does this page effectively connect to other likely pages in the user journey?

SUMMARY:
- Give an overall effectiveness score (1-10)
- Provide a 2-3 sentence summary of the page's strengths and weaknesses
- Identify the single highest-priority action that would improve this page

Your analysis should be evidence-based, not theoretical. Focus on what's actually visible in the screenshot and provide specific references to page elements. Be honest and constructive, prioritizing improvements that would best support the stated goals of {org_purpose}.
"""


def get_formatting_prompt() -> str:
    """
    Get the prompt for formatting the analysis results into a structured format.
    
    Returns:
        str: Formatting prompt
    """
    return """You are tasked with formatting a UX/UI analysis into a structured JSON format that can be easily parsed and displayed in a web report.

Extract the following from the analysis:

1. SCORES:
   - Extract all numerical scores on a 1-10 scale for each category mentioned
   - For each score, include the category name, numerical value, and a brief description of what the score means

2. CRITICAL ISSUES:
   - Extract all critical issues or flaws mentioned in the analysis
   - For each issue, include a title, severity level (High/Medium/Low), description, and the area affected

3. RECOMMENDATIONS:
   - Extract all specific recommendations for improvement
   - For each recommendation, include a title, impact level (High/Medium/Low), description, and the area it would improve

4. SUMMARY:
   - Extract or create a concise overall summary (2-3 sentences max)
   - Include the overall effectiveness score if mentioned

Please return a JSON structure with these exact keys:
{
  "scores": [
    {"category": "Brand Identity", "score": 7, "description": "Brief explanation of score..."},
    ...
  ],
  "critical_issues": [
    {"title": "Issue title", "severity": "High", "description": "Issue details...", "area": "Affected area"},
    ...
  ],
  "recommendations": [
    {"title": "Recommendation title", "impact": "High", "description": "Recommendation details...", "area": "Area to improve"},
    ...
  ],
  "summary": {
    "text": "Concise overall summary...",
    "overall_score": 6
  }
}

Important notes:
- Analyze the text to extract accurate information, don't invent scores or issues
- If a particular section is missing in the original analysis, include an empty array for that key
- Format numeric scores as numbers, not strings (e.g., 7 not "7")
- The summary should be 2-3 sentences maximum
- Maintain the original meaning and intent of the analysis throughout
"""


def get_html_generation_prompt() -> str:
    """
    Get the prompt for generating HTML from structured analysis data.
    
    Returns:
        str: HTML generation prompt
    """
    return """You are tasked with formatting a UX/UI analysis into clean, semantic HTML for display on a webpage.

Take the provided analysis text and convert it into a well-structured HTML report with the following sections:

1. SCORES SECTION:
   - Create a visual representation of all numerical scores (1-10 scale)
   - Use appropriate semantic HTML (e.g., <section>, <h2>, etc.)
   - Apply appropriate classes for styling

2. CRITICAL ISSUES SECTION:
   - Format critical issues or flaws in a clear, scannable format
   - Highlight severity levels with appropriate visual cues
   - Use numbered or bulleted lists for clarity

3. RECOMMENDATIONS SECTION:
   - Present recommendations in a prioritized, actionable format
   - Highlight impact levels with appropriate visual cues
   - Create clear separation between different recommendations

4. SUMMARY SECTION:
   - Format the overall summary in a prominent, easy-to-read way
   - Highlight the overall effectiveness score

Use these HTML class names for consistency:
- For sections: "section", "scores-section", "issues-section", "recommendations-section", "summary-section"
- For scores: "score-item", "score-value", "good" (8-10), "average" (6-7), "poor" (1-5)
- For severity/impact: "high-severity", "medium-severity", "low-severity", "high-impact", etc.

Please return clean, semantic HTML that focuses on structure and content organization. Do not include CSS styles in the HTML.

Important notes:
- Use proper heading hierarchy (h1, h2, h3, etc.)
- Use appropriate semantic elements (<section>, <article>, <ul>, <ol>, etc.)
- Break up long paragraphs into more readable chunks
- Use <strong> for emphasis where appropriate
- The HTML should be valid and well-formed
- Do not include <html>, <head>, or <body> tags - just the content HTML
"""