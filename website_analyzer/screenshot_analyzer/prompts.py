"""
Prompts for screenshot analysis.
"""
from typing import Dict, Any, Optional, List


def get_scoring_definitions() -> str:
    """Define consistent scoring criteria to include in all prompts."""
    return """
    SCORING RUBRIC:
    1-3: Poor - Significantly hinders user experience and requires immediate attention
    4-5: Below Average - Has notable issues affecting effectiveness
    6-7: Average - Functional but with clear opportunities for improvement
    8-9: Good - Effectively supports goals with minor refinements needed
    10: Excellent - Exemplary implementation with no significant issues
    """

def get_example_section() -> str:
    """Return a consistent example section for prompts."""
    return """
    EXAMPLES OF PROPERLY FORMATTED RESPONSES:
    
    CRITICAL FLAWS EXAMPLE:
    1. Inconsistent Navigation Structure (Severity: High) - The main navigation bar changes layout and options between pages, causing user confusion and hindering site exploration.
    
    RECOMMENDATIONS EXAMPLE:
    1. Implement Consistent Call-to-Action Buttons (Impact: High) - Standardize the design, color, and positioning of donation buttons across all pages to create a clear visual pattern that users can easily recognize and follow.
    
    SCORING EXAMPLE:
    VISUAL DESIGN (Score: 7/10)
    - The color palette is consistent and aligned with the organization's brand
    - Typography hierarchy effectively guides users through content
    - Image quality is inconsistent, with some low-resolution photos
    - White space is well-utilized to create a clean, uncluttered experience
    - EVIDENCE: The homepage hero section demonstrates effective use of brand colors and typography, but the "Our Projects" section contains pixelated images that diminish credibility.
    """

def create_analysis_prompt(page_type: str, context: Dict[str, Any], sections: List[Dict]) -> str:
    """
    Create a consistently structured analysis prompt.
    
    Args:
        page_type: Type of page being analyzed
        context: Organization context
        sections: List of evaluation sections
        
    Returns:
        Formatted prompt text
    """
    # Basic info
    prompt = f"""You are a UX/UI expert analyzing a {page_type} for {context['org_name']}, a {context['org_type']} organization.
    
    WEBSITE PURPOSE: {context['org_purpose']}
    
    {get_scoring_definitions()}
    
    Provide a detailed, critical analysis focusing on how well this supports the organization's goals.\n\n"""
    
    # Add each section
    for section in sections:
        prompt += f"{section['number']}. {section['name']} (Score: ?/10)\n"
        for question in section['questions']:
            prompt += f"   - {question}\n"
        prompt += f"   - EVIDENCE: Cite specific examples from the {page_type}\n\n"
    
    # Add standard sections at the end
    prompt += """
    CRITICAL FLAWS:
    - Identify the 3 most significant problems (numbered)
    - Rate each issue's severity (High/Medium/Low) 
    - Format as: "1. [Issue title] (Severity: High) - [Description]"
    
    ACTIONABLE RECOMMENDATIONS:
    - Provide 5 specific, prioritized recommendations (numbered)
    - Rate each recommendation's impact (High/Medium/Low)
    - Format as: "1. [Recommendation] (Impact: High) - [Implementation details]"
    
    SUMMARY:
    - Overall effectiveness score (1-10)
    - 2-3 sentence summary of strengths and weaknesses
    - Single highest-priority action for improvement
    """
    
    return prompt

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
        context = {
            "org_name": "the organization",
            "org_type": "non-profit",
            "org_purpose": "to encourage donations and sign-ups for trainings"
        }
    
    desktop_sections = [
        {
            "number": 1,
            "name": "BRAND IDENTITY",
            "questions": [
                "How consistently and effectively is the brand identity expressed across pages?",
                "Are there clear visual signatures that build brand recognition?",
                "Is there a cohesive color palette aligned with the organization's mission?",
                "Does typography reinforce the organization's identity and values?"
            ]
        },
        {
            "number": 2,
            "name": "INFORMATION ARCHITECTURE",
            "questions": [
                "How well-organized is the content across the site?",
                "Is navigation consistent and intuitive for the target audience?",
                "How well does the hierarchy emphasize the most important content and actions?",
                "Would a visitor easily understand what the organization does and how to engage?"
            ]
        },
        {
            "number": 3,
            "name": "ACTION-ORIENTED DESIGN",
            "questions": [
                f"How effectively does the design prioritize key actions ({context['org_purpose']})?",
                "Are calls-to-action visually prominent and compelling?",
                "Is there a clear conversion path for visitors?",
                "Does the site create urgency and motivation to engage?"
            ]
        },
        {
            "number": 4,
            "name": "VISUAL STORYTELLING",
            "questions": [
                "Does the imagery tell a cohesive story about the organization?",
                "How effectively do visuals communicate the impact and value of the organization?",
                "Do the visuals authentically represent the organization's work and community?",
                "Is there emotional resonance in the visual language?"
            ]
        },
        {
            "number": 5,
            "name": "COMPONENT CONSISTENCY",
            "questions": [
                "Are UI components (buttons, forms, cards, etc.) used consistently?",
                "Is there evidence of a design system or shared component library?",
                "Do recurring elements maintain visual consistency across contexts?",
                "Are interactive elements visually intuitive?"
            ]
        },
        {
            "number": 6,
            "name": "RESPONSIVE DESIGN APPROACH",
            "questions": [
                "Is there evidence of a cohesive responsive design strategy?",
                "Do layouts adapt thoughtfully to different viewport sizes?",
                "Is content prioritization appropriate across devices?"
            ]
        },
        {
            "number": 7,
            "name": "AUDIENCE ALIGNMENT",
            "questions": [
                f"How well does the design appeal to the likely audience of a {context['org_type']}?",
                "Does the visual language match audience expectations and preferences?",
                "Is the tone appropriate for driving the desired actions?"
            ]
        }
    ]
    
    prompt = create_analysis_prompt("website", context, desktop_sections)
    
    # Add overall assessment sections
    prompt += """
    OVERALL THEME ASSESSMENT:
    - What are the 3-5 defining characteristics of this website's design theme?
    - What emotional response does the design evoke, and is this appropriate?
    - How well does the design theme support the stated purpose?

    STRATEGIC RECOMMENDATIONS:
    - Provide 3 high-impact recommendations to strengthen thematic consistency
    - Suggest approaches to better align the design with the organization's purpose
    - Recommend specific visual themes or elements that should be amplified

    EFFECTIVENESS SUMMARY:
    - Give an overall effectiveness score (1-10) for how well the current design supports the organization's goals
    - Explain the primary factors influencing this score
    - Identify the single most important area for improvement
    """
    
    prompt += get_example_section()
    
    return prompt


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
        context = {
            "org_name": "the Edinburgh Peace Institute",
            "org_type": "non-profit",
            "org_purpose": "to encourage donations and sign-ups for trainings"
        }
    
    page_sections = [
        {
            "number": 1,
            "name": "FIRST IMPRESSION & CLARITY",
            "questions": [
                "How quickly can a visitor understand what this page is about?",
                "Does the visual hierarchy effectively guide users to important content?",
                "Is the page's purpose immediately clear within the site context?"
            ]
        },
        {
            "number": 2,
            "name": "GOAL ALIGNMENT",
            "questions": [
                f"How effectively does this page support the website's purpose: {context['org_purpose']}?",
                "Are there clear calls-to-action aligned with the organization's goals?",
                "Is the most important content given appropriate prominence?"
            ]
        },
        {
            "number": 3,
            "name": "VISUAL DESIGN",
            "questions": [
                "How polished and professional is the visual presentation?",
                "Is the use of color, typography, and imagery effective and on-brand?",
                "Does the layout create a pleasing, easy-to-scan visual experience?"
            ]
        },
        {
            "number": 4,
            "name": "CONTENT QUALITY",
            "questions": [
                "Is the content concise, compelling, and audience-appropriate?",
                "Do headings and text effectively communicate key messages?",
                "Is there a clear hierarchy in how information is presented?"
            ]
        },
        {
            "number": 5,
            "name": "USABILITY & ACCESSIBILITY",
            "questions": [
                "Are there any obvious usability barriers or points of confusion?",
                "Would users of varying abilities be able to navigate and use this page?",
                "Are interactive elements (links, buttons, forms) clear and intuitive?"
            ]
        },
        {
            "number": 6,
            "name": "CONVERSION OPTIMIZATION",
            "questions": [
                "How effectively does this page guide users toward desired actions?",
                "Are CTAs visible, compelling, and appropriately positioned?",
                "Does the page remove friction from the user journey?"
            ]
        },
        {
            "number": 7,
            "name": "TECHNICAL EXECUTION",
            "questions": [
                "Are there any visible implementation issues or inconsistencies?",
                "Is content properly aligned and spaced?",
                "Are images appropriately sized and displayed?"
            ]
        }
    ]
    
    prompt = create_analysis_prompt(f"{page_type} page", context, page_sections)
    
    # Add page-specific section
    prompt += f"""
    PAGE ROLE ANALYSIS:
    - Considering this is a {page_type}, how well does it fulfill its specific purpose?
    - Is there anything missing that would be expected on this type of page?
    - Does this page effectively connect to other likely pages in the user journey?
    """
    
    prompt += get_example_section()
    
    return prompt


def get_formatting_prompt() -> str:
    """
    Get the prompt for formatting the analysis results into a structured format.
    
    Returns:
        str: Formatting prompt
    """
    return """Extract the following from the analysis into a specific JSON format:

    {
      "scores": [
        {"category": "String (e.g. 'Brand Identity')", "score": Number (1-10), "description": "String (1 sentence)"}
      ],
      "critical_issues": [
        {"id": Number, "title": "String (5-8 words)", "severity": "String ('High', 'Medium', or 'Low')", "description": "String (1-2 sentences)", "area": "String (e.g. 'Navigation')"}
      ],
      "recommendations": [
        {"id": Number, "title": "String (5-8 words)", "impact": "String ('High', 'Medium', or 'Low')", "description": "String (1-2 sentences)", "area": "String (e.g. 'Call to Action')"}
      ],
      "summary": {
        "text": "String (2-3 sentences)",
        "overall_score": Number (1-10),
        "priority_action": "String (1 sentence)"
      }
    }
    
    IMPORTANT:
    - Every object MUST include ALL fields shown above
    - Every numerical score MUST be a number between 1-10 (not a string)
    - Every critical issue and recommendation MUST have an id (1, 2, 3...)
    - Format severity/impact values as exactly "High", "Medium", or "Low"
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

def validate_structured_data(data: Dict) -> Dict:
    """
    Validate and clean up structured data from LLM.
    
    Args:
        data: The structured data from formatting stage
        
    Returns:
        Validated and cleaned data
    """
    errors = []
    
    # Check required top-level keys
    required_keys = ["scores", "critical_issues", "recommendations", "summary"]
    for key in required_keys:
        if key not in data:
            errors.append(f"Missing required key: {key}")
            data[key] = [] if key != "summary" else {"text": "", "overall_score": 5}
    
    # Validate scores
    if "scores" in data:
        for i, score in enumerate(data["scores"]):
            if not isinstance(score.get("score"), (int, float)):
                errors.append(f"Score {i} has invalid value: {score.get('score')}")
                score["score"] = 5
    
    # Validate summary
    if "summary" in data and isinstance(data["summary"], dict):
        if not isinstance(data["summary"].get("overall_score"), (int, float)):
            errors.append(f"Overall score has invalid value: {data['summary'].get('overall_score')}")
            data["summary"]["overall_score"] = 5
    
    # Add validation results to data
    data["_validation"] = {
        "valid": len(errors) == 0,
        "errors": errors
    }
    
    return data