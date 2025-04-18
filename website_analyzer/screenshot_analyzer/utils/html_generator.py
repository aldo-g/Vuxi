"""
HTML generation utilities for screenshot analysis reports.
"""
import json
import os
from typing import Dict, Any

from .markdown_utils import markdown_to_html


def save_analysis_results(results: Dict[str, Any], output_dir: str, format: str = "html") -> str:
    """
    Save analysis results to a file.
    
    Args:
        results (Dict[str, Any]): Analysis results
        output_dir (str): Output directory
        format (str): Output format (json or html)
        
    Returns:
        str: Path to the saved file
    """
    if format == "json":
        # Save to JSON file
        output_path = os.path.join(output_dir, "desktop_screenshot_analysis.json")
        with open(output_path, "w") as f:
            json.dump(results, f, indent=2)
        
        return output_path
    
    elif format == "html":
        # Save to HTML file
        output_path = os.path.join(output_dir, "desktop_screenshot_analysis.html")
        
        # Get analysis results
        analysis_text = results.get("results", "No results available")
        status = results.get("status", "unknown")
        
        # Convert markdown to HTML
        analysis_html = markdown_to_html(analysis_text)
        
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
                ul, ol {{
                    padding-left: 2em;
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
                
                <div class="section">
                    <h2>Individual Page Analysis</h2>
                    <p>For detailed analysis of individual pages, use the following command:</p>
                    <pre>python -m website_analyzer.cli analyze-pages</pre>
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

def save_page_analysis_results(
    results: Dict[str, Any], 
    page_name: str, 
    output_dir: str, 
    format: str = "html"
) -> str:
    """
    Save individual page analysis results to a file with enhanced metrics and visualization.
    
    Args:
        results (Dict[str, Any]): Analysis results
        page_name (str): Name of the page
        output_dir (str): Output directory
        format (str): Output format (json or html)
        
    Returns:
        str: Path to the saved file
    """
    import json
    import re
    
    if format == "json":
        # Save to JSON file
        output_path = os.path.join(output_dir, f"{page_name}_analysis.json")
        with open(output_path, "w") as f:
            json.dump(results, f, indent=2)
        
        return output_path
    
    elif format == "html":
        # Save to HTML file
        output_path = os.path.join(output_dir, f"{page_name}_analysis.html")
        
        # Get analysis results
        analysis_text = results.get("results", "No results available")
        status = results.get("status", "unknown")
        page_type = results.get("page_type", "Unknown Page")
        screenshot = results.get("screenshot", "")
        
        # Get just the filename
        screenshot_filename = os.path.basename(screenshot) if screenshot else ""
        
        # Create relative path to the screenshot
        screenshot_rel_path = f"../../screenshots/desktop/{screenshot_filename}" if screenshot else ""
        
        # Extract scores from analysis text (if they exist)
        scores = {}
        score_patterns = [
            (r"FIRST IMPRESSION & CLARITY \(Score: (\d+)/10\)", "first_impression"),
            (r"GOAL ALIGNMENT \(Score: (\d+)/10\)", "goal_alignment"),
            (r"VISUAL DESIGN \(Score: (\d+)/10\)", "visual_design"),
            (r"CONTENT QUALITY \(Score: (\d+)/10\)", "content_quality"),
            (r"USABILITY & ACCESSIBILITY \(Score: (\d+)/10\)", "usability"),
            (r"CONVERSION OPTIMIZATION \(Score: (\d+)/10\)", "conversion"),
            (r"TECHNICAL EXECUTION \(Score: (\d+)/10\)", "technical"),
            (r"SUMMARY:.*?overall effectiveness score \((\d+)/10\)", "overall"),
            (r"Overall Effectiveness Score[:\s]+(\d+)/10", "overall")
        ]
        
        for pattern, key in score_patterns:
            match = re.search(pattern, analysis_text, re.DOTALL | re.IGNORECASE)
            if match:
                try:
                    scores[key] = int(match.group(1))
                except (ValueError, IndexError):
                    # Skip if we can't convert to int
                    pass
        
        # Generate score visualization HTML if scores were found
        score_html = ""
        if scores:
            score_html = """
            <div class="section">
                <h2>Page Evaluation Scores</h2>
                <div class="score-container">
            """
            
            # Add meter for each score
            score_labels = {
                "first_impression": "First Impression & Clarity",
                "goal_alignment": "Goal Alignment",
                "visual_design": "Visual Design",
                "content_quality": "Content Quality",
                "usability": "Usability & Accessibility",
                "conversion": "Conversion Optimization",
                "technical": "Technical Execution",
                "overall": "Overall Effectiveness"
            }
            
            for key, label in score_labels.items():
                if key in scores:
                    score = scores[key]
                    # Determine color based on score
                    if score >= 8:
                        color_class = "good"
                    elif score >= 6:
                        color_class = "average"
                    else:
                        color_class = "poor"
                        
                    score_html += f"""
                    <div class="score-item">
                        <div class="score-label">{label}</div>
                        <div class="score-meter">
                            <div class="score-bar {color_class}" style="width: {score * 10}%"></div>
                        </div>
                        <div class="score-value {color_class}">{score}/10</div>
                    </div>
                    """
            
            score_html += """
                </div>
            </div>
            """
        
        # More robust pattern matching for Critical Flaws section
        critical_flaws_html = ""
        critical_patterns = [
            r"CRITICAL FLAWS:(.*?)(?:POSITIVE ELEMENTS:|ACTIONABLE RECOMMENDATIONS:|PAGE ROLE ANALYSIS:|SUMMARY:|$)", 
            r"Critical Flaws:(.*?)(?:Positive Elements:|Actionable Recommendations:|Page Role Analysis:|Summary:|$)",
            r"Critical Issues:(.*?)(?:Positive Elements:|Actionable Recommendations:|Page Role Analysis:|Summary:|$)",
            r"\d+\.\s+.*?\(Severity: (?:High|Medium|Low)\)(.*?)(?:\d+\.\s+.*?\(Severity: (?:High|Medium|Low)\)|POSITIVE ELEMENTS:|ACTIONABLE RECOMMENDATIONS:|PAGE ROLE ANALYSIS:|SUMMARY:|$)"
        ]

        for pattern in critical_patterns:
            critical_match = re.search(pattern, analysis_text, re.DOTALL | re.IGNORECASE)
            if critical_match and critical_match.group(1).strip():
                critical_flaws_text = critical_match.group(1).strip()
                critical_flaws_html = f"""
                <div class="section issues-section">
                    <h2>Critical Issues</h2>
                    <div class="issues-content">
                        {markdown_to_html(critical_flaws_text)}
                    </div>
                </div>
                """
                break

        # Also, let's add a fallback that looks for numbered lists with "severity" indicators
        if not critical_flaws_html:
            # Look for patterns like "1. Issue Name (Severity: High)"
            severity_pattern = re.findall(r'\d+\.\s+.+?\(Severity:\s+(?:High|Medium|Low)\)', analysis_text, re.IGNORECASE)
            if severity_pattern:
                # Find the content after each severity pattern until the next one or end of text
                critical_content = []
                for i, match in enumerate(severity_pattern):
                    start_pos = analysis_text.find(match)
                    if start_pos != -1:
                        # Find the end position (next severity pattern or end of text)
                        if i < len(severity_pattern) - 1:
                            next_start = analysis_text.find(severity_pattern[i+1])
                            content = analysis_text[start_pos:next_start].strip()
                        else:
                            # Look for the next section heading
                            next_section = re.search(r'(?:POSITIVE ELEMENTS:|ACTIONABLE RECOMMENDATIONS:|PAGE ROLE ANALYSIS:|SUMMARY:)', 
                                                    analysis_text[start_pos:], re.IGNORECASE)
                            if next_section:
                                end_pos = start_pos + next_section.start()
                                content = analysis_text[start_pos:end_pos].strip()
                            else:
                                # Just take a reasonable chunk
                                content = analysis_text[start_pos:start_pos+500].strip()
                        
                        critical_content.append(content)
                
                if critical_content:
                    combined_content = "\n\n".join(critical_content)
                    critical_flaws_html = f"""
                    <div class="section issues-section">
                        <h2>Critical Issues</h2>
                        <div class="issues-content">
                            {markdown_to_html(combined_content)}
                        </div>
                    </div>
                    """
            
        # More robust pattern matching for Recommendations section
        recommendations_html = ""
        recommendation_patterns = [
            r"ACTIONABLE RECOMMENDATIONS:(.*?)(?:PAGE ROLE ANALYSIS:|SUMMARY:|$)",
            r"Actionable Recommendations:(.*?)(?:Page Role Analysis:|Summary:|$)",
            r"Recommendations:(.*?)(?:Page Role Analysis:|Summary:|$)",
            r"\d+\.\s+(?:High|Medium|Low) Impact:.*?((?:\n\s*-.*?){1,10})(?:\d+\.\s+(?:High|Medium|Low) Impact:|PAGE ROLE ANALYSIS:|SUMMARY:|$)"
        ]

        for pattern in recommendation_patterns:
            recommendations_match = re.search(pattern, analysis_text, re.DOTALL | re.IGNORECASE)
            if recommendations_match and recommendations_match.group(1).strip():
                recommendations_text = recommendations_match.group(1).strip()
                recommendations_html = f"""
                <div class="section recommendations-section">
                    <h2>Recommendations</h2>
                    <div class="recommendations-content">
                        {markdown_to_html(recommendations_text)}
                    </div>
                </div>
                """
                break
        
        # Convert full markdown to HTML
        analysis_html = markdown_to_html(analysis_text)
        
        # Create screenshot HTML (with scrollable container)
        screenshot_html = f"""
        <div class="section">
            <h2>Page Screenshot</h2>
            <div class="scrollable-screenshot">
                <div class="screenshot-container">
                    <img src="{screenshot_rel_path}" alt="{page_type}" class="screenshot">
                    <div class="screenshot-caption">{page_type}</div>
                </div>
            </div>
        </div>
        """
        
        # Add error information if status is error
        error_section = ""
        if status == "error" and "error" in results:
            error_section = f"""
            <div class="section error">
                <h2>Error Information</h2>
                <p>{results.get("error", "Unknown error")}</p>
            </div>
            """
        
        # Define JavaScript for tab functionality as a separate string to avoid f-string issues
        tab_js = """
            document.addEventListener('DOMContentLoaded', function() {
                // Tab functionality
                const tabs = document.querySelectorAll('.tab');
                const tabContents = document.querySelectorAll('.tab-content');
                
                tabs.forEach(tab => {
                    tab.addEventListener('click', () => {
                        // Remove active class from all tabs and contents
                        tabs.forEach(t => t.classList.remove('active'));
                        tabContents.forEach(c => c.classList.remove('active'));
                        
                        // Add active class to clicked tab and corresponding content
                        tab.classList.add('active');
                        const tabId = tab.getAttribute('data-tab');
                        document.getElementById(tabId).classList.add('active');
                    });
                });
            });
        """
        
        # Create an enhanced HTML report with metrics
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{page_type} Analysis Report</title>
            <style>
                body {{
                    font-family: 'Segoe UI', Arial, sans-serif;
                    line-height: 1.6;
                    margin: 0;
                    padding: 0;
                    color: #333;
                    background-color: #f9f9f9;
                }}
                .container {{
                    display: grid;
                    grid-template-columns: 1fr;
                }}
                .sidebar {{
                    background-color: #fff;
                    padding: 30px;
                    position: sticky;
                    top: 0;
                    height: 100vh;
                    overflow-y: auto;
                    border-right: 1px solid #e2e8f0;
                }}
                .main-content {{
                    padding: 30px;
                    background-color: #fff;
                    max-width: 1200px;
                    margin: 0 auto;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                }}
                h1, h2, h3, h4, h5, h6 {{
                    color: #2c3e50;
                    margin-top: 1.5em;
                    margin-bottom: 0.5em;
                    font-weight: 600;
                }}
                h1 {{ 
                    font-size: 2.2em; 
                    padding-bottom: 10px;
                    border-bottom: 1px solid #eee;
                    margin-top: 0;
                }}
                h2 {{ 
                    font-size: 1.8em; 
                    color: #34495e;
                }}
                h3 {{ font-size: 1.5em; }}
                h4 {{ font-size: 1.25em; }}
                h5 {{ font-size: 1.1em; }}
                h6 {{ font-size: 1em; }}
                p {{
                    margin-bottom: 1em;
                }}
                .section {{
                    background-color: #fff;
                    border-radius: 8px;
                    padding: 25px;
                    margin-bottom: 30px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
                    border: 1px solid #f0f0f0;
                }}
                .error {{
                    background-color: #fff5f5;
                    border-left: 4px solid #e53e3e;
                }}
                .issues-section {{
                    background-color: #fff5f7;
                    border-left: 4px solid #e53e78;
                }}
                .recommendations-section {{
                    background-color: #f0fdf4;
                    border-left: 4px solid #10b981;
                }}
                pre {{
                    background-color: #f5f5f5;
                    padding: 15px;
                    border-radius: 6px;
                    overflow-x: auto;
                    white-space: pre-wrap;
                    font-size: 14px;
                    border: 1px solid #eee;
                }}
                .analysis-result {{
                    margin-top: 20px;
                }}
                li {{
                    margin-bottom: 0.7em;
                }}
                ul, ol {{
                    padding-left: 2em;
                }}
                .org-info {{
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 20px;
                }}
                .org-info-item {{
                    background-color: #f8fafc;
                    padding: 15px;
                    border-radius: 6px;
                    border: 1px solid #e2e8f0;
                }}
                .org-info-label {{
                    font-weight: bold;
                    margin-bottom: 5px;
                    color: #64748b;
                    font-size: 0.9em;
                    text-transform: uppercase;
                }}
                .org-info-value {{
                    font-size: 1.1em;
                    color: #334155;
                }}
                .score-container {{
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 15px;
                }}
                .score-item {{
                    display: grid;
                    grid-template-columns: 200px 1fr 50px;
                    align-items: center;
                    gap: 15px;
                }}
                .score-label {{
                    font-weight: 500;
                    color: #475569;
                }}
                .score-meter {{
                    height: 12px;
                    background-color: #e2e8f0;
                    border-radius: 6px;
                    overflow: hidden;
                }}
                .score-bar {{
                    height: 100%;
                    border-radius: 6px;
                }}
                .score-value {{
                    font-weight: bold;
                    text-align: right;
                }}
                .good {{ background-color: #10b981; color: #10b981; }}
                .average {{ background-color: #f59e0b; color: #f59e0b; }}
                .poor {{ background-color: #ef4444; color: #ef4444; }}
                
                .scrollable-screenshot {{
                    max-height: 600px;
                    overflow-y: auto;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    margin-top: 20px;
                    background-color: #f8fafc;
                }}
                .screenshot-container {{
                    padding: 20px;
                    text-align: center;
                }}
                .screenshot {{
                    max-width: 100%;
                    display: block;
                    margin: 0 auto;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
                }}
                .screenshot-caption {{
                    margin-top: 10px;
                    font-size: 0.9em;
                    color: #64748b;
                    padding: 10px;
                }}
                
                .navigation {{
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #eee;
                    display: flex;
                    justify-content: space-between;
                }}
                .navigation a {{
                    color: #3b82f6;
                    text-decoration: none;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-weight: 500;
                }}
                .navigation a:hover {{
                    text-decoration: underline;
                }}
                
                .summary-box {{
                    background-color: #f0f9ff;
                    border-left: 4px solid #3b82f6;
                    padding: 20px;
                    margin: 20px 0;
                    border-radius: 6px;
                }}
                
                .tabs {{
                    display: flex;
                    border-bottom: 1px solid #e2e8f0;
                    margin-bottom: 20px;
                }}
                .tab {{
                    padding: 10px 20px;
                    cursor: pointer;
                    border-bottom: 3px solid transparent;
                    font-weight: 500;
                }}
                .tab.active {{
                    border-bottom-color: #3b82f6;
                    color: #3b82f6;
                }}
                .tab-content {{
                    display: none;
                }}
                .tab-content.active {{
                    display: block;
                }}
                
                @media (max-width: 800px) {{
                    .org-info {{
                        grid-template-columns: 1fr;
                    }}
                    .score-item {{
                        grid-template-columns: 1fr;
                    }}
                    .score-value {{
                        text-align: left;
                    }}
                }}
            </style>
            <script>
                {tab_js}
            </script>
        </head>
        <body>
            <div class="container">
                <div class="main-content">
                    <h1>{page_type} Analysis</h1>
                    
                    <div class="section">
                        <h2>Organization Information</h2>
                        <div class="org-info">
                            <div class="org-info-item">
                                <div class="org-info-label">Organization</div>
                                <div class="org-info-value">{results.get('organization', 'Unknown')}</div>
                            </div>
                            <div class="org-info-item">
                                <div class="org-info-label">Type</div>
                                <div class="org-info-value">{results.get('org_type', 'Unknown')}</div>
                            </div>
                            <div class="org-info-item">
                                <div class="org-info-label">Purpose</div>
                                <div class="org-info-value">{results.get('org_purpose', 'Unknown')}</div>
                            </div>
                        </div>
                        <div style="margin-top: 20px;">
                            <div><strong>Analysis Date:</strong> {results.get('analysis_date', 'Unknown')}</div>
                        </div>
                    </div>
                    
                    {score_html}
                    
                    {error_section}
                    
                    <div class="tabs">
                        <div class="tab active" data-tab="tab-flaws">Critical Issues</div>
                        <div class="tab" data-tab="tab-recommendations">Recommendations</div>
                        <div class="tab" data-tab="tab-full">Full Analysis</div>
                    </div>
                    
                    <div id="tab-flaws" class="tab-content active">
                        {critical_flaws_html if critical_flaws_html else '<div class="section"><p>No critical issues were identified in the analysis.</p></div>'}
                    </div>
                    
                    <div id="tab-recommendations" class="tab-content">
                        {recommendations_html if recommendations_html else '<div class="section"><p>No specific recommendations were provided in the analysis.</p></div>'}
                    </div>
                    
                    <div id="tab-full" class="tab-content">
                        <div class="section">
                            <h2>Complete Analysis</h2>
                            <div class="analysis-result">
                                {analysis_html}
                            </div>
                        </div>
                    </div>
                    
                    {screenshot_html}
                    
                    <div class="navigation">
                        <a href="../index.html">← Back to All Pages</a>
                        <a href="../../desktop_screenshot_analysis.html">View Overall Analysis →</a>
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