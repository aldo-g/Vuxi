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
    
    org_name = context.get('org_name', 'the organization')
    org_type = context.get('org_type', 'organization')
    
    return f"""You are a UX/UI expert analyzing a {page_type} screenshot for {org_name}, a {org_type}.
    
PRIMARY TASK: Analyze how well this page fulfills its intended function based on common expectations for a {page_type}, 
while paying special attention to signs of incomplete development, placeholder content, and unprofessional elements.

Provide a detailed, critical analysis focusing on whether this page effectively serves its purpose. Be direct and actionable 
in your feedback, identifying real problems while suggesting specific improvements.

CRITICAL INSPECTION AREAS (Examine these first):
- Placeholder content (e.g., "New List Item", "Description goes here", "Lorem ipsum", etc.)
- Incomplete sections or unfinished features
- Broken layouts or formatting issues
- Poor contrast between text and background
- Misaligned elements or inconsistent spacing
- Unprofessional or clearly unfinished visual elements
- Technical errors or debugging elements visible to users

Analyze and rate (1-10 scale) the following key areas:

1. FIRST IMPRESSION & CLARITY (Score: ?/10)
   - Are there any immediate signs of an incomplete or unprofessional page?
   - How quickly can a visitor understand what this page is about?
   - Does the visual hierarchy effectively guide users to the page's main purpose?
   - EVIDENCE: Cite specific visual elements from the screenshot

2. FUNCTIONAL EFFECTIVENESS (Score: ?/10)
   - How effectively does this page fulfill what users would expect from a {page_type}?
   - Are there any incomplete or placeholder elements that prevent proper functionality?
   - Does the page structure support the user's expected tasks?
   - EVIDENCE: Cite specific functional elements from the screenshot

3. VISUAL DESIGN (Score: ?/10)
   - How polished and professional is the visual presentation?
   - Are there any glaring visual errors, incomplete styling, or placeholder elements?
   - Does the layout create a pleasing, easy-to-scan visual experience?
   - EVIDENCE: Cite specific design elements from the screenshot

4. CONTENT QUALITY (Score: ?/10)
   - Is all content complete and finalized, or are there placeholders?
   - Do headings and text effectively communicate necessary information?
   - Is information organized logically for this page's purpose?
   - EVIDENCE: Reference visible content from the screenshot

5. USABILITY & ACCESSIBILITY (Score: ?/10)
   - Are there any obvious usability barriers, including poor contrast or readability issues?
   - Would users be able to complete expected tasks on this page?
   - Are interactive elements appropriate and clear for this page's function?
   - EVIDENCE: Identify specific usability issues visible in the screenshot

6. USER TASK COMPLETION (Score: ?/10)
   - How easily can users complete expected tasks on this page?
   - Are necessary actions intuitive and properly prioritized?
   - Does the page remove friction from user workflows?
   - EVIDENCE: Analyze task-related elements in the screenshot

7. TECHNICAL EXECUTION (Score: ?/10)
   - Are there any visible implementation issues, incomplete features, or debugging elements?
   - Is content properly aligned and spaced?
   - Are images and interactive elements properly implemented?
   - EVIDENCE: Note any technical problems visible in the screenshot

CRITICAL FLAWS:
- FIRST, identify any incomplete, placeholder, or unprofessional elements visible in the screenshot
- Then identify other significant problems that prevent this page from functioning effectively
- Rate each issue's severity (High/Medium/Low) and explain its impact on page functionality
- Be specific about exactly where and how these issues appear

POSITIVE ELEMENTS:
- Identify 2-3 elements that work well for this page type
- Explain why these elements effectively support the page's function

ACTIONABLE RECOMMENDATIONS:
- Provide 5 specific, prioritized recommendations for improvement
- PRIORITIZE addressing any incomplete or unprofessional elements first
- For each recommendation:
  * Describe exactly what should change
  * Explain how it should be changed (be specific)
  * Detail how this would improve the page's primary function
- Rate each recommendation's potential impact (High/Medium/Low)

PAGE TYPE ANALYSIS:
- Based on common expectations for a {page_type}, what essential elements are present or missing?
- Does this page meet standard expectations for its type?
- What best practices for {page_type}s could be applied here?

SUMMARY:
- Give an overall effectiveness score (1-10)
- Provide a 2-3 sentence summary of how well the page fulfills its expected function
- Identify the single highest-priority action that would improve this page

Your analysis should focus on how well this page serves its specific function based on common expectations for this type of page. 
Be especially vigilant about identifying unprofessional elements, placeholder content, or signs of incomplete development.
Be evidence-based, focusing on what's actually visible in the screenshot.
"""