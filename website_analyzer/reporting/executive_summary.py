# website_analyzer/reporting/executive_summary.py
"""
Executive summary generation using LLM for website analysis.
"""

import os
import re
import json
import base64
from typing import Dict, Any, List, Optional
from datetime import datetime
import requests

from .template_system import render_template, COMMON_STYLES
from ..common.url_utils import get_score_class
from ..common.constants import OPENAI_API_KEY, OPENAI_API_ENDPOINT, OPENAI_MODEL


class ExecutiveSummaryGenerator:
    """
    Generates an executive summary from website analysis data using LLM processing.
    """
    
    def __init__(self, output_dir: str):
        """
        Initialize the executive summary generator.
        
        Args:
            output_dir (str): Directory containing analysis data
        """
        self.output_dir = output_dir
        self.analysis_dir = os.path.join(output_dir, "analysis")
        self.pages_dir = os.path.join(self.analysis_dir, "pages")
        self.lighthouse_dir = os.path.join(output_dir, "lighthouse")
        self.screenshots_dir = os.path.join(output_dir, "screenshots")
        
    def generate(self, output_path: Optional[str] = None) -> str:
        """
        Generate an executive summary report using LLM.
        
        Args:
            output_path (str, optional): Path to save the HTML report
            
        Returns:
            str: Path to the generated report
        """
        if output_path is None:
            output_path = os.path.join(self.output_dir, "executive_summary.html")
        
        # Collect all analysis data
        analysis_data = self._collect_analysis_data()
        
        # Get LLM summary
        summary_results = self._get_llm_summary(analysis_data)
        
        # Find a good example screenshot to include
        example_screenshot = self._find_homepage_screenshot()
        
        # Compile all data for the template
        report_data = {
            "summary_results": summary_results,
            "example_screenshot": example_screenshot,
            "report_date": datetime.now().strftime("%Y-%m-%d"),
            "organization": analysis_data.get("organization", "Unknown Organization"),
            "get_score_class": get_score_class
        }
        
        # Generate HTML from template
        html_content = render_template('executive_summary.html', report_data)
        
        # Save HTML report
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        with open(output_path, 'w') as f:
            f.write(html_content)
        
        print(f"Executive summary generated: {output_path}")
        print("To create a PDF, open this HTML file in a browser and use the Print function (Cmd+P or Ctrl+P)")
        print("Select 'Save as PDF' as the destination in the print dialog")
        
        return output_path
    
    def _collect_analysis_data(self) -> Dict[str, Any]:
        """
        Collect all analysis data from various reports.
        
        Returns:
            Dict[str, Any]: Collected analysis data
        """
        data = {
            "organization": "Unknown Organization",
            "overall_analysis": "",
            "page_analyses": [],
            "lighthouse_data": []
        }
        
        # Extract organization name and overall analysis
        overall_analysis_path = os.path.join(self.analysis_dir, "desktop_screenshot_analysis.html")
        if os.path.exists(overall_analysis_path):
            with open(overall_analysis_path, 'r') as f:
                content = f.read()
            
            # Extract organization name
            organization = re.search(r'<strong>Organization:</strong>\s*([^<]+)', content)
            if organization:
                data["organization"] = organization.group(1).strip()
            
            # Extract overall analysis content
            analysis_content = re.search(r'<div class="analysis-result">(.*?)</div>', content, re.DOTALL)
            if analysis_content:
                # Clean up HTML tags for plain text analysis
                overall_analysis = re.sub(r'<.*?>', ' ', analysis_content.group(1))
                overall_analysis = re.sub(r'\s+', ' ', overall_analysis).strip()
                data["overall_analysis"] = overall_analysis
        
        # Extract page analyses
        if os.path.exists(self.pages_dir):
            for filename in os.listdir(self.pages_dir):
                if filename.endswith(".html") and filename != "index.html":
                    page_path = os.path.join(self.pages_dir, filename)
                    
                    with open(page_path, 'r') as f:
                        content = f.read()
                    
                    # Extract page type
                    page_type = re.search(r'<h1>(.*?) Analysis</h1>', content)
                    page_type_text = page_type.group(1).strip() if page_type else "Unknown Page"
                    
                    # Extract page analysis content
                    page_content = ""
                    
                    # Look for critical issues
                    critical_issues = re.search(r'<div id="tab-flaws".*?>(.*?)</div>\s*<div id="tab-recommendations"', content, re.DOTALL)
                    if critical_issues:
                        issues_text = critical_issues.group(1).strip()
                        # Clean up HTML tags
                        issues_text = re.sub(r'<.*?>', ' ', issues_text)
                        issues_text = re.sub(r'\s+', ' ', issues_text).strip()
                        page_content += f"CRITICAL ISSUES: {issues_text}\n\n"
                    
                    # Look for recommendations
                    recommendations = re.search(r'<div id="tab-recommendations".*?>(.*?)</div>\s*<div id="tab-full"', content, re.DOTALL)
                    if recommendations:
                        recommendations_text = recommendations.group(1).strip()
                        # Clean up HTML tags
                        recommendations_text = re.sub(r'<.*?>', ' ', recommendations_text)
                        recommendations_text = re.sub(r'\s+', ' ', recommendations_text).strip()
                        page_content += f"RECOMMENDATIONS: {recommendations_text}\n\n"
                    
                    data["page_analyses"].append({
                        "page_type": page_type_text,
                        "content": page_content
                    })
        
        # Extract Lighthouse data
        if os.path.exists(self.lighthouse_dir):
            lighthouse_summary = []
            
            # Look for JSON reports
            for filename in os.listdir(self.lighthouse_dir):
                if filename.endswith(".json"):
                    report_path = os.path.join(self.lighthouse_dir, filename)
                    
                    try:
                        with open(report_path, 'r') as f:
                            report_data = json.load(f)
                        
                        # Extract basic information
                        url = report_data.get("requestedUrl", "Unknown URL")
                        
                        # Extract scores
                        scores = {}
                        categories = report_data.get("categories", {})
                        for category_id, category_data in categories.items():
                            scores[category_id] = {
                                "score": category_data.get("score", 0) * 100,
                                "title": category_data.get("title", category_id)
                            }
                        
                        # Format lighthouse entry
                        lighthouse_entry = f"URL: {url}\n"
                        for category_id, score_data in scores.items():
                            lighthouse_entry += f"{score_data['title']}: {score_data['score']:.1f}%\n"
                        
                        lighthouse_summary.append(lighthouse_entry)
                        
                    except Exception as e:
                        print(f"Error processing Lighthouse report {report_path}: {e}")
            
            data["lighthouse_data"] = lighthouse_summary
        
        return data
    
    def _get_llm_summary(self, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get executive summary from LLM API.
        
        Args:
            analysis_data (Dict[str, Any]): Collected analysis data
            
        Returns:
            Dict[str, Any]: LLM summary results
        """
        # Check if API key is available
        if not OPENAI_API_KEY or OPENAI_API_KEY == "your_openai_api_key_here":
            print("Warning: No OpenAI API key found. Using mock summary.")
            return self._generate_mock_summary(analysis_data)
        
        # Prepare the prompt
        prompt = self._create_llm_prompt(analysis_data)
        
        try:
            # Set up headers
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {OPENAI_API_KEY}"
            }
            
            # Prepare API payload WITHOUT temperature parameter
            payload = {
                "model": OPENAI_MODEL,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are an expert UX analyst tasked with creating an executive summary of website analysis results."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
                # No temperature parameter at all
            }
            
            # Make the API request
            response = requests.post(
                OPENAI_API_ENDPOINT,
                headers=headers,
                json=payload
            )
            
            # Check if the request was successful
            if response.status_code == 200:
                # Parse the response
                response_data = response.json()
                summary_text = response_data["choices"][0]["message"]["content"]
                
                # Parse the summary into sections
                return self._parse_summary_sections(summary_text)
            else:
                print(f"Error calling LLM API: {response.status_code} - {response.text}")
                return self._generate_mock_summary(analysis_data)
                
        except Exception as e:
            print(f"Error generating summary with LLM API: {e}")
            return self._generate_mock_summary(analysis_data)
    
    def _create_llm_prompt(self, analysis_data: Dict[str, Any]) -> str:
        """
        Create a prompt for the LLM API.
        
        Args:
            analysis_data (Dict[str, Any]): Collected analysis data
            
        Returns:
            str: Prompt for LLM API
        """
        # Initialize prompt variable first
        prompt = f"""Create an executive summary of the following website analysis for {analysis_data['organization']}.

    OVERALL ANALYSIS:
    {analysis_data['overall_analysis']}

    """
        
        # Add page analyses
        if analysis_data["page_analyses"]:
            prompt += "PAGE ANALYSES:\n\n"
            for page_analysis in analysis_data["page_analyses"]:
                prompt += f"PAGE: {page_analysis['page_type']}\n{page_analysis['content']}\n\n"
        
        # Add lighthouse data
        if analysis_data["lighthouse_data"]:
            prompt += "PERFORMANCE DATA:\n\n"
            for lighthouse_entry in analysis_data["lighthouse_data"]:
                # Check if lighthouse_entry is a dictionary with 'summary' key
                if isinstance(lighthouse_entry, dict) and 'summary' in lighthouse_entry:
                    prompt += f"{lighthouse_entry['summary']}\n"
                else:
                    # If lighthouse_entry is a string or doesn't have 'summary' key
                    prompt += f"{lighthouse_entry}\n"
        
        # Add score information if available
        if "scores" in analysis_data:
            prompt += "\nOVERALL SCORES:\n"
            for key, value in analysis_data["scores"].items():
                prompt += f"{key.replace('_', ' ').title()}: {value}/10\n"
        
        # Add instructions for the output format
        prompt += """
    Based on the above analysis, create a concise executive summary with the following sections:

    1. EXECUTIVE SUMMARY: A detailed 2-3 paragraph overview of the key findings and themes.

    2. CRITICAL ISSUES: List the 3-5 most important issues that need to be addressed, ordered by priority.

    3. KEY RECOMMENDATIONS: Provide 3-5 specific, actionable recommendations to improve the website, ordered by priority.

    4. STRENGTHS: List 2-3 major strengths of the current website.

    5. TECHNICAL OVERVIEW: A brief assessment of the technical performance.

    6. PAGE ANALYSIS: For each page analyzed, provide a brief paragraph summarizing the key findings, issues, and recommendations specific to that page. Format this section as:

    PAGE: [Page Name]
    [One paragraph summary for this page]

    Format your response with these exact section headers. Be concise and focus on insights that would be valuable to executive stakeholders. Use bullet points for the lists."""
        
        return prompt
    
    def _parse_summary_sections(self, summary_text: str) -> Dict[str, Any]:
        """
        Parse the summary text into sections.
        
        Args:
            summary_text (str): Summary text from LLM
            
        Returns:
            Dict[str, Any]: Parsed summary sections
        """
        sections = {
            "overview": "",
            "critical_issues": [],
            "recommendations": [],
            "strengths": [],
            "technical": "",
            "page_summaries": {}  # Add this to store page summaries
        }
        
        # Extract executive summary
        executive_match = re.search(r'EXECUTIVE SUMMARY:(.*?)(?=CRITICAL ISSUES:|$)', summary_text, re.DOTALL)
        if executive_match:
            sections["overview"] = executive_match.group(1).strip()
        
        # Extract critical issues
        issues_match = re.search(r'CRITICAL ISSUES:(.*?)(?=KEY RECOMMENDATIONS:|$)', summary_text, re.DOTALL)
        if issues_match:
            issues_text = issues_match.group(1).strip()
            # Extract bullet points
            issues = re.findall(r'(?:^|\n)\s*[-*•]\s*(.*?)(?=\n\s*[-*•]|\n\s*\n|$)', issues_text, re.DOTALL)
            sections["critical_issues"] = [issue.strip() for issue in issues if issue.strip()]
        
        # Extract recommendations
        recommendations_match = re.search(r'KEY RECOMMENDATIONS:(.*?)(?=STRENGTHS:|$)', summary_text, re.DOTALL)
        if recommendations_match:
            recommendations_text = recommendations_match.group(1).strip()
            # Extract bullet points
            recommendations = re.findall(r'(?:^|\n)\s*[-*•]\s*(.*?)(?=\n\s*[-*•]|\n\s*\n|$)', recommendations_text, re.DOTALL)
            sections["recommendations"] = [rec.strip() for rec in recommendations if rec.strip()]
        
        # Extract strengths
        strengths_match = re.search(r'STRENGTHS:(.*?)(?=TECHNICAL OVERVIEW:|$)', summary_text, re.DOTALL)
        if strengths_match:
            strengths_text = strengths_match.group(1).strip()
            # Extract bullet points
            strengths = re.findall(r'(?:^|\n)\s*[-*•]\s*(.*?)(?=\n\s*[-*•]|\n\s*\n|$)', strengths_text, re.DOTALL)
            sections["strengths"] = [strength.strip() for strength in strengths if strength.strip()]
        
        # Extract technical overview
        technical_match = re.search(r'TECHNICAL OVERVIEW:(.*?)(?=PAGE ANALYSIS:|$)', summary_text, re.DOTALL)
        if technical_match:
            sections["technical"] = technical_match.group(1).strip()
        
        # Extract page analysis summaries
        page_analysis_match = re.search(r'PAGE ANALYSIS:(.*?)$', summary_text, re.DOTALL)
        if page_analysis_match:
            page_analysis_text = page_analysis_match.group(1).strip()
            
            # Extract individual page summaries
            page_pattern = r'PAGE:\s*(.*?)\n(.*?)(?=PAGE:|$)'
            page_matches = re.findall(page_pattern, page_analysis_text, re.DOTALL)
            
            for page_name, page_summary in page_matches:
                page_name = page_name.strip()
                page_summary = page_summary.strip()
                if page_name and page_summary:
                    sections["page_summaries"][page_name] = page_summary
        
        return sections
    
    def _generate_mock_summary(self, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a mock summary if API is not available.
        
        Args:
            analysis_data (Dict[str, Any]): Collected analysis data
            
        Returns:
            Dict[str, Any]: Mock summary data
        """
        # Create the base summary
        mock_summary = {
            "overview": f"This executive summary provides an overview of the website analysis for {analysis_data['organization']}. The analysis evaluated the website's design, usability, content, and technical performance. Several critical issues and strengths were identified, along with recommendations for improvement.",
            "critical_issues": [
                "The website lacks a consistent visual design system across pages, creating a disjointed user experience.",
                "Navigation structure is confusing, making it difficult for users to find important information.",
                "Call-to-action elements lack visual prominence, potentially reducing conversion rates."
            ],
            "recommendations": [
                "Develop and implement a consistent design system with standardized components, colors, and typography.",
                "Restructure the navigation to prioritize key user journeys and important content.",
                "Enhance call-to-action elements with better visual contrast and positioning.",
                "Improve page load performance by optimizing images and reducing JavaScript."
            ],
            "strengths": [
                "Strong brand identity is evident throughout the website.",
                "Content is well-written and addresses the needs of the target audience."
            ],
            "technical": "The website's technical performance is below industry standards, with slow page load times and accessibility issues that need to be addressed. Mobile responsiveness could be improved."
        }
        
        # Add page summaries
        page_summaries = {}
        if "page_analyses" in analysis_data:
            for page in analysis_data["page_analyses"]:
                page_type = page["page_type"]
                
                # Generate a simple summary based on page type
                if "home" in page_type.lower():
                    page_summaries[page_type] = f"The {page_type} effectively introduces the organization but lacks clear calls-to-action. Navigation could be improved to better guide users toward key content. The visual design is generally consistent but could be enhanced to better convey the organization's mission."
                elif "about" in page_type.lower():
                    page_summaries[page_type] = f"The {page_type} contains good content about the organization but the layout could be optimized. Key information should be prioritized and made more scannable. The page would benefit from better use of visuals to illustrate the organization's history and impact."
                elif "contact" in page_type.lower():
                    page_summaries[page_type] = f"The {page_type} provides basic contact information but the form is not prominently displayed. Required fields should be clearly marked and the submission process simplified. Adding a map and response time expectations would improve user experience."
                else:
                    page_summaries[page_type] = f"The {page_type} contains valuable information but has several usability issues. The content organization could be improved, and call-to-action elements should be more prominent. Visual hierarchy should be strengthened to guide users through the page more effectively."
        
        # Add page summaries to the mock summary
        mock_summary["page_summaries"] = page_summaries
        
        return mock_summary
    
    def _find_homepage_screenshot(self) -> str:
        """
        Find a screenshot of the homepage to include in the summary.
        
        Returns:
            str: Path to the screenshot or empty string if not found
        """
        desktop_dir = os.path.join(self.screenshots_dir, "desktop")
        if not os.path.exists(desktop_dir):
            return ""
        
        # Look for a homepage screenshot
        for filename in os.listdir(desktop_dir):
            if "homepage" in filename.lower() and filename.endswith(".png"):
                return os.path.join("..", "screenshots", "desktop", filename)
        
        # If no homepage screenshot, return first screenshot
        for filename in os.listdir(desktop_dir):
            if filename.endswith(".png"):
                return os.path.join("..", "screenshots", "desktop", filename)
        
        return ""