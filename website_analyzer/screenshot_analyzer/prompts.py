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
    
    return f"""You are a brutally honest UX/UI design critic analyzing a {page_type} for {org_name}, a charity. I need specific, actionable critique that identifies real problems - NOT generic or overly positive feedback. The organization needs a website that effectively encourages donations and training signups.

IMPORTANT: Focus on what's actually WRONG with the design rather than providing generic assessments. Be direct, specific, and reference exact elements from the screenshot.

Analyze the following areas with a critical eye:

1. CRITICAL FLAWS (Start here)
   - Identify the 3-5 most significant problems that actively harm the user experience
   - Rate each issue's severity (High/Medium/Low)
   - Explain exactly how each issue impacts the donation/signup goals
   
2. VISUAL COHESION & HIERARCHY
   - Are visual elements competing or disconnected from each other?
   - Is important content being obscured or minimized?
   - Are there awkward crops, alignments, or spacing issues?
   - Is the brand identity consistent and professional?

3. USABILITY BARRIERS
   - What specific elements would confuse users or create friction?
   - Are there accessibility issues that would prevent users from donating?
   - Is the navigation clear and intuitive for first-time visitors?
   - Are CTAs prominent and compelling enough to drive action?

4. TECHNICAL IMPLEMENTATION
   - Identify any apparent technical issues (cutoff elements, overlapping content)
   - Note any responsive design problems visible in this view
   - Are there inconsistencies in implementation quality?

5. ACTIONABLE RECOMMENDATIONS
   - Provide 3-5 SPECIFIC changes (not generic advice)
   - For each recommendation:
     * Describe exactly what should change (with specific elements)
     * Explain precisely how it should be changed
     * Detail how this would improve conversions
   - Prioritize these by impact (High/Medium/Low)

Do NOT use templated, generic language or vague compliments. Be precise and critical, pointing out exactly what isn't working and why. Focus on CONCRETE ISSUES visible in this specific design rather than theoretical best practices.
"""