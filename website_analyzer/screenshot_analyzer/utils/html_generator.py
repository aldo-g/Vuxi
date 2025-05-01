"""
HTML generation utilities for screenshot analysis reports.
"""
import json
import os
from typing import Dict, Any, Optional

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
    import json
    import re
    
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
        
        # Extract scores from analysis text
        scores = {}
        score_patterns = [
            (r"BRAND IDENTITY \(Score: (\d+)/10\)", "brand_identity"),
            (r"INFORMATION ARCHITECTURE \(Score: (\d+)/10\)", "information_architecture"),
            (r"ACTION-ORIENTED DESIGN \(Score: (\d+)/10\)", "action_oriented"),
            (r"VISUAL STORYTELLING \(Score: (\d+)/10\)", "visual_storytelling"),
            (r"COMPONENT CONSISTENCY \(Score: (\d+)/10\)", "component_consistency"),
            (r"RESPONSIVE DESIGN APPROACH \(Score: (\d+)/10\)", "responsive_design"),
            (r"AUDIENCE ALIGNMENT \(Score: (\d+)/10\)", "audience_alignment"),
            (r"overall effectiveness score[:\s]+(\d+)/10", "overall_effectiveness")
        ]
        
        for pattern, key in score_patterns:
            match = re.search(pattern, analysis_text, re.IGNORECASE)
            if match:
                try:
                    scores[key] = int(match.group(1))
                except (ValueError, IndexError):
                    pass
        
        # Generate score visualization HTML
        score_html = ""
        if scores:
            score_html = """
            <div class="section">
                <h2>Evaluation Scores</h2>
                <div class="score-container">
            """
            
            score_labels = {
                "brand_identity": "Brand Identity",
                "information_architecture": "Information Architecture",
                "action_oriented": "Action-Oriented Design",
                "visual_storytelling": "Visual Storytelling",
                "component_consistency": "Component Consistency",
                "responsive_design": "Responsive Design Approach",
                "audience_alignment": "Audience Alignment",
                "overall_effectiveness": "Overall Effectiveness"
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
        
        # Extract Strategic Recommendations
        recommendations_html = ""
        recommendations_patterns = [
            r"STRATEGIC RECOMMENDATIONS:(.*?)(?:EFFECTIVENESS SUMMARY:|$)",
            r"Strategic Recommendations:(.*?)(?:Effectiveness Summary:|$)"
        ]
        
        for pattern in recommendations_patterns:
            match = re.search(pattern, analysis_text, re.DOTALL | re.IGNORECASE)
            if match and match.group(1).strip():
                recommendations_text = match.group(1).strip()
                recommendations_html = f"""
                <div class="section recommendations-section">
                    <h2>Strategic Recommendations</h2>
                    <div class="recommendations-content">
                        {markdown_to_html(recommendations_text)}
                    </div>
                </div>
                """
                break
        
        # Extract Theme Assessment (equivalent to critical issues)
        theme_assessment_html = ""
        theme_patterns = [
            r"OVERALL THEME ASSESSMENT:(.*?)(?:STRATEGIC RECOMMENDATIONS:|$)",
            r"Overall Theme Assessment:(.*?)(?:Strategic Recommendations:|$)"
        ]
        
        for pattern in theme_patterns:
            match = re.search(pattern, analysis_text, re.DOTALL | re.IGNORECASE)
            if match and match.group(1).strip():
                theme_text = match.group(1).strip()
                theme_assessment_html = f"""
                <div class="section issues-section">
                    <h2>Theme Assessment</h2>
                    <div class="issues-content">
                        {markdown_to_html(theme_text)}
                    </div>
                </div>
                """
                break
        
        # Convert full markdown to HTML
        analysis_html = markdown_to_html(analysis_text)
        
        # Create template context
        context = {
            "organization": results.get('organization', 'Unknown Organization'),
            "screenshots_analyzed": results.get('screenshots_analyzed', 0),
            "screenshot_count": results.get('screenshot_count', 0),
            "analysis_date": results.get('analysis_date', 'Unknown'),
            "status": status,
            "error": results.get("error") if status == "error" else None,
            "analysis_html": analysis_html,
            "score_html": score_html,
            "recommendations_html": recommendations_html,
            "theme_assessment_html": theme_assessment_html,
            "common_styles": ""  # We'll define styles in the template
        }
        
        # Use the template system
        from website_analyzer.reporting.template_system import render_template
        html_content = render_template('desktop_analysis.html', context)
        
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
    format: str = "html",
    lighthouse_data: Optional[Dict[str, Any]] = None
) -> str:
    """
    Save individual page analysis results to a file with enhanced metrics and visualization.
    
    Args:
        results (Dict[str, Any]): Analysis results
        page_name (str): Name of the page
        output_dir (str): Output directory
        format (str): Output format (json or html)
        lighthouse_data (Dict[str, Any], optional): Lighthouse data for this page
        
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
            (r"FUNCTIONAL EFFECTIVENESS \(Score: (\d+)/10\)", "functional_effectiveness"),
            (r"VISUAL DESIGN \(Score: (\d+)/10\)", "visual_design"),
            (r"CONTENT QUALITY \(Score: (\d+)/10\)", "content_quality"),
            (r"USABILITY & ACCESSIBILITY \(Score: (\d+)/10\)", "usability"),
            (r"USER TASK COMPLETION \(Score: (\d+)/10\)", "task_completion"),
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
                "functional_effectiveness": "Functional Effectiveness",
                "visual_design": "Visual Design",
                "content_quality": "Content Quality",
                "usability": "Usability & Accessibility",
                "task_completion": "User Task Completion",
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
            # Standard heading formats
            r"CRITICAL FLAWS:(.*?)(?:POSITIVE ELEMENTS:|ACTIONABLE RECOMMENDATIONS:|PAGE TYPE ANALYSIS:|SUMMARY:|$)", 
            r"Critical Flaws:(.*?)(?:Positive Elements:|Actionable Recommendations:|Page Type Analysis:|Summary:|$)",
            r"Critical Issues:(.*?)(?:Positive Elements:|Actionable Recommendations:|Page Type Analysis:|Summary:|$)",
            
            # Markdown heading formats (##, ### etc.)
            r"##\s*CRITICAL FLAWS\s*(.*?)(?:##\s*POSITIVE ELEMENTS|##\s*ACTIONABLE RECOMMENDATIONS|##\s*PAGE TYPE ANALYSIS|##\s*SUMMARY|$)",
            r"##\s*Critical Flaws\s*(.*?)(?:##\s*Positive Elements|##\s*Actionable Recommendations|##\s*Page Type Analysis|##\s*Summary|$)",
            r"##\s*Critical Issues\s*(.*?)(?:##\s*Positive Elements|##\s*Actionable Recommendations|##\s*Page Type Analysis|##\s*Summary|$)",
            
            # Alternative format where issues are numbered
            r"(\d+\.\s+.*?\(Severity:.*?\).*?)(?:\d+\.\s+.*?\(Severity:|POSITIVE ELEMENTS:|ACTIONABLE RECOMMENDATIONS:|PAGE TYPE ANALYSIS:|SUMMARY:|$)",
            
            # Look for "I've identified several critical issues" pattern
            r"I've identified several critical issues.*?(?:1\.|-).*?(.*?)(?:POSITIVE ELEMENTS|Positive Elements|ACTIONABLE RECOMMENDATIONS|Actionable Recommendations|PAGE TYPE ANALYSIS|Page Type Analysis|SUMMARY|Summary|DETAILED ANALYSIS|Detailed Analysis|$)",
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
            
        # More robust pattern matching for Recommendations section
        recommendations_html = ""
        recommendation_patterns = [
            r"ACTIONABLE RECOMMENDATIONS:(.*?)(?:PAGE TYPE ANALYSIS:|SUMMARY:|$)",
            r"Actionable Recommendations:(.*?)(?:Page Type Analysis:|Summary:|$)",
            r"Recommendations:(.*?)(?:Page Type Analysis:|Summary:|$)"
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
        
        # Add Lighthouse data section if available
        lighthouse_html = ""
        if lighthouse_data:
            try:
                # Create Lighthouse metrics section
                lighthouse_html = """
                <div id="tab-performance" class="tab-content">
                    <div class="section">
                        <h2>Performance Metrics</h2>
                        <div class="lighthouse-summary">
                """
                
                # Add overall scores
                if "scores" in lighthouse_data and lighthouse_data["scores"]:
                    lighthouse_html += """
                    <div class="lighthouse-scores">
                        <h3>Lighthouse Scores</h3>
                        <div class="score-container">
                    """
                    
                    for category, data in lighthouse_data["scores"].items():
                        # Handle potentially None data
                        if data is None:
                            continue
                            
                        score = data.get("score", 0)
                        title = data.get("title", category)
                        
                        # Ensure score is not None
                        if score is None:
                            score = 0
                        
                        # Determine color class
                        if score >= 90:
                            color_class = "good"
                        elif score >= 50:
                            color_class = "average"
                        else:
                            color_class = "poor"
                        
                        lighthouse_html += f"""
                        <div class="score-item">
                            <div class="score-label">{title}</div>
                            <div class="score-meter">
                                <div class="score-bar {color_class}" style="width: {score}%"></div>
                            </div>
                            <div class="score-value {color_class}">{score:.0f}</div>
                        </div>
                        """
                    
                    lighthouse_html += """
                        </div>
                    </div>
                    """
                
                # Add key metrics if available
                if "metrics" in lighthouse_data and lighthouse_data["metrics"]:
                    lighthouse_html += """
                    <div class="lighthouse-metrics">
                        <h3>Core Web Vitals</h3>
                        <div class="metrics-grid">
                    """
                    
                    metrics = lighthouse_data["metrics"]
                    
                    # Check for None values and provide defaults
                    fcp = metrics.get("firstContentfulPaint", 0)
                    lcp = metrics.get("largestContentfulPaint", 0)
                    cls = metrics.get("cumulativeLayoutShift", 0)
                    tbt = metrics.get("totalBlockingTime", 0)
                    si = metrics.get("speedIndex", 0)
                    tti = metrics.get("interactive", 0)
                    
                    # Safe conversion to seconds - handle None values
                    fcp = 0 if fcp is None else fcp / 1000
                    lcp = 0 if lcp is None else lcp / 1000
                    cls = 0 if cls is None else cls
                    tbt = 0 if tbt is None else tbt
                    si = 0 if si is None else si / 1000
                    tti = 0 if tti is None else tti / 1000
                    
                    # Determine performance classes
                    fcp_class = "good" if fcp < 1.8 else "average" if fcp < 3 else "poor"
                    lcp_class = "good" if lcp < 2.5 else "average" if lcp < 4 else "poor"
                    cls_class = "good" if cls < 0.1 else "average" if cls < 0.25 else "poor"
                    tbt_class = "good" if tbt < 200 else "average" if tbt < 600 else "poor"
                    si_class = "good" if si < 3.4 else "average" if si < 5.8 else "poor"
                    tti_class = "good" if tti < 3.8 else "average" if tti < 7.3 else "poor"
                    
                    lighthouse_html += f"""
                        <div class="metric-item">
                            <div class="metric-name">First Contentful Paint</div>
                            <div class="metric-value {fcp_class}">{fcp:.1f}s</div>
                        </div>
                        <div class="metric-item">
                            <div class="metric-name">Largest Contentful Paint</div>
                            <div class="metric-value {lcp_class}">{lcp:.1f}s</div>
                        </div>
                        <div class="metric-item">
                            <div class="metric-name">Cumulative Layout Shift</div>
                            <div class="metric-value {cls_class}">{cls:.3f}</div>
                        </div>
                        <div class="metric-item">
                            <div class="metric-name">Total Blocking Time</div>
                            <div class="metric-value {tbt_class}">{tbt:.0f}ms</div>
                        </div>
                        <div class="metric-item">
                            <div class="metric-name">Speed Index</div>
                            <div class="metric-value {si_class}">{si:.1f}s</div>
                        </div>
                        <div class="metric-item">
                            <div class="metric-name">Time to Interactive</div>
                            <div class="metric-value {tti_class}">{tti:.1f}s</div>
                        </div>
                    """
                    
                    lighthouse_html += """
                        </div>
                    </div>
                    """
                
                # Add key audits/issues if available
                if "audits" in lighthouse_data and lighthouse_data["audits"]:
                    lighthouse_html += """
                    <div class="lighthouse-audits">
                        <h3>Key Audit Results</h3>
                        <div class="audit-list">
                    """
                    
                    # Safely get failed audits
                    failed_audits = {}
                    try:
                        failed_audits = {
                            id: data for id, data in lighthouse_data["audits"].items() 
                            if data is not None and data.get("score", 1) < 1
                        }
                    except (TypeError, AttributeError):
                        pass
                    
                    if failed_audits:
                        for audit_id, data in failed_audits.items():
                            title = data.get("title", audit_id)
                            description = data.get("description", "")
                            display_value = data.get("displayValue", "")
                            
                            lighthouse_html += f"""
                            <div class="audit-item poor">
                                <div class="audit-title">{title}</div>
                                <div class="audit-value">{display_value}</div>
                                <div class="audit-description">{description}</div>
                            </div>
                            """
                    else:
                        lighthouse_html += """
                        <div class="audit-item good">
                            <div class="audit-title">All audits passed!</div>
                            <div class="audit-description">No significant issues were found.</div>
                        </div>
                        """
                    
                    lighthouse_html += """
                        </div>
                    </div>
                    """
                
                lighthouse_html += """
                        </div>
                    </div>
                </div>
                """
            except Exception as e:
                print(f"Error processing Lighthouse data: {e}")
                lighthouse_html = """
                <div id="tab-performance" class="tab-content">
                    <div class="section">
                        <h2>Performance Metrics</h2>
                        <p>Error processing Lighthouse data. Please check the report format.</p>
                    </div>
                </div>
                """
        
        # Create tabs - include performance tab if lighthouse data exists
        if lighthouse_data:
            tabs_html = """
            <div class="tabs">
                <div class="tab active" data-tab="tab-flaws">Critical Issues</div>
                <div class="tab" data-tab="tab-recommendations">Recommendations</div>
                <div class="tab" data-tab="tab-performance">Performance</div>
                <div class="tab" data-tab="tab-full">Full Analysis</div>
            </div>
            """
        else:
            tabs_html = """
            <div class="tabs">
                <div class="tab active" data-tab="tab-flaws">Critical Issues</div>
                <div class="tab" data-tab="tab-recommendations">Recommendations</div>
                <div class="tab" data-tab="tab-full">Full Analysis</div>
            </div>
            """
        
        # Convert full markdown to HTML
        analysis_html = markdown_to_html(analysis_text)
        
        # Additional CSS for Lighthouse metrics
        additional_css = """
        .lighthouse-summary {
            display: flex;
            flex-direction: column;
            gap: 30px;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }
        .metric-item {
            background-color: #f8fafc;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
        }
        .metric-name {
            font-weight: 500;
            color: #475569;
            margin-bottom: 10px;
        }
        .metric-value {
            font-size: 1.5em;
            font-weight: bold;
        }
        .audit-list {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        .audit-item {
            background-color: #f8fafc;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid;
        }
        .audit-title {
            font-weight: 600;
            margin-bottom: 5px;
        }
        .audit-value {
            font-weight: 500;
            margin-bottom: 10px;
        }
        .audit-description {
            color: #64748b;
            font-size: 0.9em;
        }
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
                
                {additional_css}
                
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
        </head>
        <body>
            <div class="container">
                <div class="main-content">
                    <h1>{page_type} Analysis</h1>
                    
                    <div class="section">
                        <h2>Page Information</h2>
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
                                <div class="org-info-label">Analysis Date</div>
                                <div class="org-info-value">{results.get('analysis_date', 'Unknown')}</div>
                            </div>
                        </div>
                    </div>
                    
                    {score_html}
                                        
                    {tabs_html}
                    
                    <div id="tab-flaws" class="tab-content active">
                        {critical_flaws_html if critical_flaws_html else '<div class="section"><p>No critical issues were identified in the analysis.</p></div>'}
                    </div>
                    
                    <div id="tab-recommendations" class="tab-content">
                        {recommendations_html if recommendations_html else '<div class="section"><p>No specific recommendations were provided in the analysis.</p></div>'}
                    </div>
                    
                    {lighthouse_html}
                    
                    <div id="tab-full" class="tab-content">
                        <div class="section">
                            <h2>Complete Analysis</h2>
                            <div class="analysis-result">
                                {analysis_html}
                            </div>
                        </div>
                    </div>
                    
                    <div class="section">
                        <h2>Page Screenshot</h2>
                        <div class="scrollable-screenshot">
                            <div class="screenshot-container">
                                <img src="{screenshot_rel_path}" alt="{page_type}" class="screenshot">
                                <div class="screenshot-caption">{page_type}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="navigation">
                        <a href="../index.html">← Back to All Pages</a>
                        <a href="../../desktop_screenshot_analysis.html">View Overall Analysis →</a>
                    </div>
                </div>
            </div>
            
            <script>
                document.addEventListener('DOMContentLoaded', function() {{
                    // Tab functionality
                    const tabs = document.querySelectorAll('.tab');
                    const tabContents = document.querySelectorAll('.tab-content');
                    
                    tabs.forEach(tab => {{
                        tab.addEventListener('click', () => {{
                            // Remove active class from all tabs and contents
                            tabs.forEach(t => t.classList.remove('active'));
                            tabContents.forEach(c => c.classList.remove('active'));
                            
                            // Add active class to clicked tab and corresponding content
                            tab.classList.add('active');
                            const tabId = tab.getAttribute('data-tab');
                            document.getElementById(tabId).classList.add('active');
                        }});
                    }});
                }});
            </script>
        </body>
        </html>
        """
        
        with open(output_path, "w") as f:
            f.write(html_content)
        
        return output_path
    
    else:
        print(f"Unsupported format: {format}")
        return ""