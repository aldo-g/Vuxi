"""
Prompts for screenshot analysis.
"""
from typing import Dict, Any, Optional


def get_desktop_analysis_prompt(context: Optional[Dict[str, Any]] = None) -> str:
    """
    Get the prompt for desktop screenshot analysis.
    
    Args:
        context (Dict[str, Any], optional): Additional context for the prompt
        
    Returns:
        str: Analysis prompt
    """
    # Default context values
    if context is None:
        context = {}
    
    org_name = context.get('org_name', 'the organization')
    
    return f"""You are a UX/UI design expert analyzing multiple screenshots of a website. Your task is to evaluate visual consistency and thematic elements across all pages to assess the overall brand coherence and user experience continuity. User Context: I have a charity called {org_name}. I would like users to donate and sign up for trainings.
These pages are for the desktop version of the site.

Analyze the following aspects across all provided screenshots:

1. Brand Identity & Visual Language
   - Consistency of logo placement and usage
   - Brand color application across pages
   - Typography system consistency
   - Visual style and imagery cohesion

2. Layout Patterns & Structural Consistency
   - Grid system and alignment patterns
   - Header and footer consistency
   - Whitespace usage patterns
   - Content organization similarities/differences

3. Navigation & Wayfinding
   - Navigation element consistency
   - Current state indicators
   - Information architecture coherence
   - Breadcrumb and contextual navigation

4. Design System Implementation
   - Component reuse and visual consistency
   - Button styles and interactive element patterns
   - Form elements and input styling
   - Icon system and visual vocabulary

5. Responsive Design Patterns
   - Consistent adaptation across device sizes
   - Breakpoint handling similarities
   - Mobile-specific pattern consistency

6. Content Hierarchy Patterns
   - Heading structure consistency
   - Content emphasis techniques
   - Call-to-action presentation
   - Information density patterns

7. Cross-Page Journey Analysis
   - Visual continuity between related pages
   - Context retention between pages
   - Progressive disclosure patterns
   - First-time vs. returning user visual cues

8. Theme-Based Analysis
   - Identify contradictions or inconsistencies in the visual language
   - Assess how well visual design supports stated site goals
   - Evaluate visual branding effectiveness and memorability
   - Analyze visual storytelling across the site journey

9. Recommendations
   - Provide 3-5 specific recommendations for improving visual consistency
   - Suggest design system refinements or component standardization
   - Prioritize changes that would improve brand cohesion and user experience

Format your analysis as a comprehensive report with distinct sections addressing each aspect. Focus on patterns rather than individual elements, and provide evidence-based reasoning for your observations. Include specific references to page examples that illustrate your points.
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