"""
Screenshot analysis module for the website analyzer.

This module provides functionality for analyzing screenshots for UX/UI design issues.
"""

import os
import json
import base64
import requests
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Optional

from . import constants


class ScreenshotAnalyzer:
    """
    Analyzes website screenshots for UX/UI design issues.
    """
    
    def __init__(self, output_dir: str):
        """
        Initialize the ScreenshotAnalyzer with configuration options.
        
        Args:
            output_dir (str): Directory where screenshots are saved
        """
        self.output_dir = output_dir
        self.screenshots_dir = os.path.join(output_dir, "screenshots")
        self.analysis_dir = os.path.join(output_dir, "analysis")
        os.makedirs(self.analysis_dir, exist_ok=True)
    
    def collect_desktop_screenshots(self) -> List[str]:
        """
        Collect all desktop screenshots from the output directory.
        
        Returns:
            List[str]: List of paths to desktop screenshots
        """
        desktop_dir = os.path.join(self.screenshots_dir, "desktop")
        if not os.path.exists(desktop_dir):
            return []
        
        return [os.path.join(desktop_dir, f) for f in os.listdir(desktop_dir) if f.endswith('.png')]
    
    def get_desktop_analysis_prompt(self, context: Optional[Dict[str, Any]] = None) -> str:
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
    
    def analyze_desktop_screenshots(self, org_name: str = "the Edinburgh Peace Institute",
                                  save_format: str = "html") -> str:
        """
        Analyze desktop screenshots for UX/UI design issues.
        
        Args:
            org_name (str): Name of the organization for context
            save_format (str): Format to save results (json or html)
            
        Returns:
            str: Path to the analysis results file
        """
        # Collect desktop screenshots
        screenshots = self.collect_desktop_screenshots()
        if not screenshots:
            print("No desktop screenshots found")
            return ""
        
        print(f"Analyzing {len(screenshots)} desktop screenshots...")
        
        # Get prompt with context
        prompt = self.get_desktop_analysis_prompt({"org_name": org_name})
        
        # Analyze screenshots with external service
        if constants.API_PROVIDER.lower() == "openai":
            results = self.analyze_with_openai(screenshots, prompt)
        else:
            print(f"Unknown API provider: {constants.API_PROVIDER}. Defaulting to OpenAI.")
            results = self.analyze_with_openai(screenshots, prompt)
        
        # Add analysis date
        results["analysis_date"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        results["screenshots_analyzed"] = len(screenshots)
        results["organization"] = org_name
        
        # Save results
        output_path = self.save_analysis_results(results, format=save_format)
        
        print(f"Screenshot analysis saved to: {output_path}")
        
        return output_path
    
    def analyze_with_openai(self, screenshots: List[str], prompt: str) -> Dict[str, Any]:
        """
        Send screenshots to OpenAI's GPT-4 Vision API for analysis.
        
        Args:
            screenshots (List[str]): List of screenshot paths
            prompt (str): Analysis prompt
            
        Returns:
            Dict[str, Any]: Analysis results
        """
        # Use the API key from constants
        api_key = constants.OPENAI_API_KEY
        api_endpoint = constants.OPENAI_API_ENDPOINT
        model = constants.OPENAI_MODEL
        
        # Check if API key is valid
        if not api_key or api_key == "your_openai_api_key_here":
            print("Warning: Using default API key. Please update the API key in constants.py")
            return {
                "prompt": prompt,
                "screenshot_count": len(screenshots),
                "results": "Please set your OpenAI API key in constants.py before running analysis."
            }
        
        try:
            print(f"Processing {len(screenshots)} screenshots for OpenAI analysis")
            
            # Prepare the content for the API request
            content = [{"type": "text", "text": prompt}]
            
            # Process and add each screenshot
            for i, screenshot_path in enumerate(screenshots):
                print(f"Processing screenshot {i+1}/{len(screenshots)}: {os.path.basename(screenshot_path)}")
                with open(screenshot_path, "rb") as img_file:
                    encoded_image = base64.b64encode(img_file.read()).decode('utf-8')
                    
                    # Add image in OpenAI's expected format
                    content.append({
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{encoded_image}"
                        }
                    })
            
            # Prepare the OpenAI API request
            payload = {
                "model": model,
                "messages": [
                    {
                        "role": "user",
                        "content": content
                    }
                ],
                "max_tokens": 4000
            }
            
            # Set up headers
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}"
            }
            
            print("Sending request to OpenAI API...")
            
            # Make the API request
            response = requests.post(
                api_endpoint,
                headers=headers,
                json=payload
            )
            
            # Save the request and response for debugging if needed
            debug_dir = os.path.join(self.analysis_dir, "debug")
            os.makedirs(debug_dir, exist_ok=True)
            
            # Save a simplified version of the payload (without the full base64 images)
            with open(os.path.join(debug_dir, "openai_request.json"), "w") as f:
                simplified_payload = payload.copy()
                simplified_payload["messages"][0]["content"] = "[CONTENT REMOVED FOR DEBUGGING]"
                json.dump(simplified_payload, f, indent=2)
            
            # Save the response
            with open(os.path.join(debug_dir, "openai_response.json"), "w") as f:
                try:
                    json.dump(response.json(), f, indent=2)
                except:
                    f.write(response.text)
            
            # Check if the request was successful
            if response.status_code == 200:
                # Parse the response
                response_data = response.json()
                
                # Extract the analysis text from the response
                try:
                    analysis_text = response_data["choices"][0]["message"]["content"]
                    
                    return {
                        "status": "success",
                        "prompt": prompt,
                        "screenshot_count": len(screenshots),
                        "screenshots_analyzed": len(screenshots),
                        "results": analysis_text
                    }
                except (KeyError, IndexError) as e:
                    error_message = f"Could not extract analysis from response: {str(e)}"
                    print(error_message)
                    
                    return {
                        "status": "error",
                        "prompt": prompt,
                        "screenshot_count": len(screenshots),
                        "error": error_message,
                        "results": "Could not extract analysis from the API response."
                    }
            else:
                # Handle error
                error_message = f"API request failed with status code {response.status_code}: {response.text}"
                print(error_message)
                
                return {
                    "status": "error",
                    "prompt": prompt,
                    "screenshot_count": len(screenshots),
                    "error": error_message,
                    "results": "Analysis failed. Please check your API key and try again."
                }
                
        except Exception as e:
            error_message = f"Error during API request: {str(e)}"
            print(error_message)
            
            return {
                "status": "error",
                "prompt": prompt,
                "screenshot_count": len(screenshots),
                "error": error_message,
                "results": "Analysis failed due to an exception. See error details."
            }
    
    def save_analysis_results(self, results: Dict[str, Any], format: str = "html") -> str:
        """
        Save analysis results to a file.
        
        Args:
            results (Dict[str, Any]): Analysis results
            format (str): Output format (json or html)
            
        Returns:
            str: Path to the saved file
        """
        if format == "json":
            # Save to JSON file
            output_path = os.path.join(self.analysis_dir, "desktop_screenshot_analysis.json")
            with open(output_path, "w") as f:
                json.dump(results, f, indent=2)
            
            return output_path
        
        elif format == "html":
            # Save to HTML file
            output_path = os.path.join(self.analysis_dir, "desktop_screenshot_analysis.html")
            
            # Get analysis results
            analysis_text = results.get("results", "No results available")
            status = results.get("status", "unknown")
            
            # Try to convert markdown to HTML
            try:
                # Simple markdown-to-HTML conversions
                # Headers
                for i in range(6, 0, -1):  # Start with h6 to h1
                    hashes = '#' * i
                    pattern = f"{hashes} (.+)"
                    replacement = f"<h{i}>\\1</h{i}>"
                    analysis_text = analysis_text.replace(pattern, replacement)
                
                # Basic formatting
                analysis_text = analysis_text.replace("**", "<strong>").replace("**", "</strong>")
                analysis_text = analysis_text.replace("*", "<em>").replace("*", "</em>")
                
                # Lists
                analysis_text = analysis_text.replace("\n- ", "\n<li>").replace("\n* ", "\n<li>")
                analysis_text = analysis_text.replace("\n1. ", "\n<li>").replace("\n2. ", "\n<li>").replace("\n3. ", "\n<li>")
                
                # Paragraphs
                paragraphs = analysis_text.split("\n\n")
                analysis_html = ""
                for p in paragraphs:
                    if p.strip():
                        if p.startswith("<h") or p.startswith("<li>"):
                            analysis_html += p + "\n"
                        else:
                            analysis_html += "<p>" + p + "</p>\n"
            except:
                # Fallback to simple line break conversion if markdown conversion fails
                analysis_html = analysis_text.replace("\n", "<br>")
            
            # Add error information if status is error
            error_section = ""
            if status == "error" and "error" in results:
                error_section = f"""
                <div class="section error">
                    <h2>Error Information</h2>
                    <p>{results.get("error", "Unknown error")}</p>
                </div>
                """
            
            # Create a simple HTML report
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Desktop Screenshot Analysis Report</title>
                <style>
                    body {{
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        margin: 0;
                        padding: 20px;
                        color: #333;
                    }}
                    .container {{
                        max-width: 1200px;
                        margin: 0 auto;
                    }}
                    h1, h2, h3, h4, h5, h6 {{
                        color: #2c3e50;
                        margin-top: 1.5em;
                        margin-bottom: 0.5em;
                    }}
                    h1 {{ font-size: 2em; }}
                    h2 {{ font-size: 1.75em; }}
                    h3 {{ font-size: 1.5em; }}
                    h4 {{ font-size: 1.25em; }}
                    h5 {{ font-size: 1.1em; }}
                    h6 {{ font-size: 1em; }}
                    p {{
                        margin-bottom: 1em;
                    }}
                    .section {{
                        background-color: #f8f9fa;
                        border-radius: 5px;
                        padding: 20px;
                        margin-bottom: 20px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    }}
                    .error {{
                        background-color: #fee;
                        border-left: 4px solid #c00;
                    }}
                    pre {{
                        background-color: #f5f5f5;
                        padding: 10px;
                        border-radius: 5px;
                        overflow-x: auto;
                        white-space: pre-wrap;
                    }}
                    .analysis-result {{
                        margin-top: 20px;
                    }}
                    li {{
                        margin-bottom: 0.5em;
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Desktop Screenshot Analysis Report</h1>
                    
                    <div class="section">
                        <h2>Analysis Summary</h2>
                        <p><strong>Organization:</strong> {results.get('organization', 'Unknown')}</p>
                        <p><strong>Screenshots Analyzed:</strong> {results.get('screenshots_analyzed', 0)} of {results.get('screenshot_count', 0)} total</p>
                        <p><strong>Analysis Date:</strong> {results.get('analysis_date', 'Unknown')}</p>
                        <p><strong>Status:</strong> {status}</p>
                    </div>
                    
                    {error_section}
                    
                    <div class="section">
                        <h2>Analysis Results</h2>
                        <div class="analysis-result">
                            {analysis_html}
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """
            
            with open(output_path, "w") as f:
                f.write(html_content)
            
            return output_path
        
        else:
            print(f"Unsupported format: {format}")
            return ""