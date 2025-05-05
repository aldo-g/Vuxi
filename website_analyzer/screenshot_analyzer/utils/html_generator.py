"""
HTML generation utilities for screenshot analysis reports.
"""
import json
import os
import re
from typing import Dict, Any, List

from markdown_utils import markdown_to_html

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
    # Helper function for score classes
    def get_score_class(score):
        """Get CSS class based on score value."""
        if score >= 90:
            return "good"
        elif score >= 50:
            return "average"
        else:
            return "poor"
            
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
        
        # Add Lighthouse section
        lighthouse_reports_html = ""
        if "lighthouse_reports" in results and results["lighthouse_reports"]:
            print(f"Generating Lighthouse HTML for {len(results['lighthouse_reports'])} reports")
            lighthouse_reports_html = """
            <div class="section lighthouse-section">
                <h2>Lighthouse Audit Results</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Page</th>
                            <th>Performance</th>
                            <th>Accessibility</th>
                            <th>Best Practices</th>
                            <th>SEO</th>
                            <th>Report</th>
                        </tr>
                    </thead>
                    <tbody>
            """
            
            for report in results["lighthouse_reports"]:
                url = report.get("url", "Unknown URL")
                performance = report.get("performance", 0)
                accessibility = report.get("accessibility", 0)
                best_practices = report.get("best_practices", 0)
                seo = report.get("seo", 0)
                html_report = report.get("html_report", "")
                
                # Get score classes
                perf_class = get_score_class(performance)
                acc_class = get_score_class(accessibility)
                bp_class = get_score_class(best_practices)
                seo_class = get_score_class(seo)
                
                lighthouse_reports_html += f"""
                <tr>
                    <td>{url}</td>
                    <td class="score {perf_class}">{performance:.1f}%</td>
                    <td class="score {acc_class}">{accessibility:.1f}%</td>
                    <td class="score {bp_class}">{best_practices:.1f}%</td>
                    <td class="score {seo_class}">{seo:.1f}%</td>
                    <td><a href="lighthouse/{html_report}" target="_blank">View Report</a></td>
                </tr>
                """
            
            lighthouse_reports_html += """
                    </tbody>
                </table>
            </div>
            """
        
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
        
        # Check if we have structured data from two-stage analysis
        structured_data = results.get("structured_data", None)
        
        # Enhanced HTML generation if we have structured data
        if structured_data:
            # Extract scores
            scores_html = ""
            if "scores" in structured_data and structured_data["scores"]:
                scores_html = """
                <div class="section scores-section">
                    <h2>Analysis Scores</h2>
                    <div class="score-container">
                """
                
                for score in structured_data["scores"]:
                    category = score.get("category", "Unknown")
                    score_value = score.get("score", 0)
                    description = score.get("description", "")
                    
                    # Determine color based on score
                    if score_value >= 8:
                        color_class = "good"
                    elif score_value >= 6:
                        color_class = "average"
                    else:
                        color_class = "poor"
                    
                    scores_html += f"""
                    <div class="score-item">
                        <div class="score-label">{category}</div>
                        <div class="score-meter">
                            <div class="score-bar {color_class}" style="width: {score_value * 10}%"></div>
                        </div>
                        <div class="score-value {color_class}">{score_value}/10</div>
                        <div class="score-description">{description}</div>
                    </div>
                    """
                
                scores_html += """
                    </div>
                </div>
                """
            
            # Extract critical issues
            issues_html = ""
            if "critical_issues" in structured_data and structured_data["critical_issues"]:
                issues_html = """
                <div class="section issues-section">
                    <h2>Critical Issues</h2>
                    <div class="issues-content">
                        <ul class="issues-list">
                """
                
                for issue in structured_data["critical_issues"]:
                    title = issue.get("title", "Unknown Issue")
                    severity = issue.get("severity", "Medium")
                    description = issue.get("description", "")
                    area = issue.get("area", "")
                    
                    severity_class = f"{severity.lower()}-severity"
                    
                    issues_html += f"""
                    <li class="issue-item {severity_class}">
                        <div class="issue-header">
                            <span class="issue-title">{title}</span>
                            <span class="issue-severity">{severity} Severity</span>
                        </div>
                        <div class="issue-description">{description}</div>
                        {f'<div class="issue-area">Area: {area}</div>' if area else ''}
                    </li>
                    """
                
                issues_html += """
                        </ul>
                    </div>
                </div>
                """
            
            # Extract recommendations
            recommendations_html = ""
            if "recommendations" in structured_data and structured_data["recommendations"]:
                recommendations_html = """
                <div class="section recommendations-section">
                    <h2>Recommendations</h2>
                    <div class="recommendations-content">
                        <ul class="recommendations-list">
                """
                
                for rec in structured_data["recommendations"]:
                    title = rec.get("title", "Unknown Recommendation")
                    impact = rec.get("impact", "Medium")
                    description = rec.get("description", "")
                    area = rec.get("area", "")
                    
                    impact_class = f"{impact.lower()}-impact"
                    
                    recommendations_html += f"""
                    <li class="recommendation-item {impact_class}">
                        <div class="recommendation-header">
                            <span class="recommendation-title">{title}</span>
                            <span class="recommendation-impact">{impact} Impact</span>
                        </div>
                        <div class="recommendation-description">{description}</div>
                        {f'<div class="recommendation-area">Area: {area}</div>' if area else ''}
                    </li>
                    """
                
                recommendations_html += """
                        </ul>
                    </div>
                </div>
                """
            
            # Extract summary
            summary_html = ""
            if "summary" in structured_data:
                summary = structured_data["summary"]
                summary_text = summary.get("text", "")
                overall_score = summary.get("overall_score", None)
                priority_action = summary.get("priority_action", "")
                
                summary_html = """
                <div class="section summary-section">
                    <h2>Summary</h2>
                """
                
                if overall_score is not None:
                    # Determine color based on score
                    if overall_score >= 8:
                        color_class = "good"
                    elif overall_score >= 6:
                        color_class = "average"
                    else:
                        color_class = "poor"
                    
                    summary_html += f"""
                    <div class="overall-score-container">
                        <div class="overall-score-label">Overall Effectiveness Score</div>
                        <div class="overall-score-value {color_class}">{overall_score}/10</div>
                    </div>
                    """
                
                if summary_text:
                    summary_html += f"""
                    <div class="summary-text">{summary_text}</div>
                    """
                    
                if priority_action:
                    summary_html += f"""
                    <div class="priority-action">
                        <strong>Priority Action:</strong> {priority_action}
                    </div>
                    """
                
                summary_html += """
                </div>
                """
            
            # Combine all sections
            structured_html = f"""
            <div class="structured-analysis">
                {summary_html}
                {scores_html}
                {issues_html}
                {recommendations_html}
            </div>
            """
            
            # Add tabs for structured vs. full analysis
            tabs_html = f"""
            <div class="tabs">
                <div class="tab active" data-tab="tab-structured">Structured Analysis</div>
                <div class="tab" data-tab="tab-full">Full Analysis</div>
            </div>
            
            <div id="tab-structured" class="tab-content active">
                {structured_html}
            </div>
            
            <div id="tab-full" class="tab-content">
                <div class="section">
                    <h2>Complete Analysis</h2>
                    <div class="analysis-result">
                        {analysis_html}
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
            """
            
            # Note: Reordered to move lighthouse_reports_html to the bottom
            analysis_section = f"""
            {tabs_html}
            """
        else:
            # Use standard HTML for regular analysis
            analysis_section = f"""
            <div class="section">
                <h2>Analysis Results</h2>
                <div class="analysis-result">
                    {analysis_html}
                </div>
            </div>
            """
        
        # Add CSS for structured analysis and tabs
        structured_css = """
            .tabs {
                display: flex;
                border-bottom: 1px solid #e2e8f0;
                margin-bottom: 20px;
            }
            .tab {
                padding: 10px 20px;
                cursor: pointer;
                border-bottom: 3px solid transparent;
                font-weight: 500;
                transition: all 0.3s ease;
            }
            .tab:hover {
                background-color: #f8fafc;
            }
            .tab.active {
                border-bottom-color: #3b82f6;
                color: #3b82f6;
            }
            .tab-content {
                display: none;
            }
            .tab-content.active {
                display: block;
            }
            .score-container {
                display: grid;
                grid-template-columns: 1fr;
                gap: 15px;
                margin-top: 15px;
            }
            .score-item {
                display: grid;
                grid-template-columns: 200px 1fr 50px;
                gap: 15px;
                align-items: center;
                margin-bottom: 10px;
            }
            .score-label {
                font-weight: 500;
                color: #475569;
            }
            .score-meter {
                height: 12px;
                background-color: #e2e8f0;
                border-radius: 6px;
                overflow: hidden;
            }
            .score-bar {
                height: 100%;
                border-radius: 6px;
            }
            .score-value {
                font-weight: bold;
                text-align: right;
            }
            .score-description {
                grid-column: span 3;
                color: #64748b;
                font-size: 0.9em;
                margin-top: -5px;
            }
            .issues-list, .recommendations-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            .issue-item, .recommendation-item {
                margin-bottom: 20px;
                padding: 15px;
                border-radius: 6px;
            }
            .issue-item {
                background-color: #fff5f7;
                border-left: 4px solid #e53e78;
            }
            .recommendation-item {
                background-color: #f0fdf4;
                border-left: 4px solid #10b981;
            }
            .issue-header, .recommendation-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }
            .issue-title, .recommendation-title {
                font-weight: 600;
                font-size: 1.1em;
            }
            .issue-severity, .recommendation-impact {
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 0.8em;
                font-weight: 500;
            }
            .high-severity {
                background-color: #fee2e2;
                color: #b91c1c;
            }
            .medium-severity {
                background-color: #fef3c7;
                color: #d97706;
            }
            .low-severity {
                background-color: #e0f2fe;
                color: #0369a1;
            }
            .high-impact {
                background-color: #d1fae5;
                color: #047857;
            }
            .medium-impact {
                background-color: #e0f2fe;
                color: #0369a1;
            }
            .low-impact {
                background-color: #f3f4f6;
                color: #4b5563;
            }
            .issue-description, .recommendation-description {
                margin-bottom: 10px;
            }
            .issue-area, .recommendation-area {
                font-size: 0.9em;
                color: #64748b;
            }
            .overall-score-container {
                display: flex;
                align-items: center;
                gap: 15px;
                margin-bottom: 20px;
            }
            .overall-score-label {
                font-weight: 500;
            }
            .overall-score-value {
                font-size: 1.8em;
                font-weight: 700;
                padding: 10px 20px;
                border-radius: 6px;
                background-color: #f8fafc;
            }
            .summary-text {
                font-size: 1.1em;
                line-height: 1.7;
                color: #334155;
                padding: 15px;
                background-color: #f8fafc;
                border-radius: 6px;
                margin-bottom: 20px;
            }
            .priority-action {
                margin-top: 15px;
                padding: 15px;
                background-color: #f0f9ff;
                border-left: 4px solid #3b82f6;
                border-radius: 6px;
            }
            @media (max-width: 768px) {
                .score-item {
                    grid-template-columns: 1fr;
                }
                .score-value {
                    text-align: left;
                }
                .issue-header, .recommendation-header {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 8px;
                }
                .overall-score-container {
                    flex-direction: column;
                    align-items: flex-start;
                }
            }
            
            /* Lighthouse specific styles */
            .lighthouse-section table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }
            .lighthouse-section th, .lighthouse-section td {
                padding: 12px;
                text-align: left;
                border-bottom: 1px solid #e2e8f0;
            }
            .lighthouse-section th {
                background-color: #f8fafc;
                font-weight: 600;
            }
            .lighthouse-section td a {
                color: #3b82f6;
                text-decoration: none;
            }
            .lighthouse-section td a:hover {
                text-decoration: underline;
            }
            .lighthouse-section .score {
                font-weight: bold;
                text-align: center;
                border-radius: 4px;
                padding: 4px 8px;
            }
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
                    font-family: 'Segoe UI', Arial, sans-serif;
                    line-height: 1.6;
                    margin: 0;
                    padding: 20px;
                    color: #333;
                    background-color: #f9f9f9;
                }}
                .container {{
                    max-width: 1200px;
                    margin: 0 auto;
                    background-color: #fff;
                    padding: 30px;
                    border-radius: 8px;
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
                    margin-bottom: 0.7em;
                }}
                ul, ol {{
                    padding-left: 2em;
                }}
                .good {{ background-color: #10b981; color: #10b981; }}
                .average {{ background-color: #f59e0b; color: #f59e0b; }}
                .poor {{ background-color: #ef4444; color: #ef4444; }}
                
                {structured_css}
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
                
                {analysis_section}
                
                {lighthouse_reports_html}
                
                <div class="section">
                    <h2>Individual Page Analysis</h2>
                    <p>For detailed analysis of individual pages, use the following command:</p>
                    <pre>website-analyzer analyze-pages --two-stage</pre>
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
    # Helper function for score classes
    def get_score_class(score):
        """Get CSS class based on score value."""
        if score >= 90:
            return "good"
        elif score >= 50:
            return "average"
        else:
            return "poor"
    
    if format == "json":
        # Save to JSON file
        output_path = os.path.join(output_dir, f"{page_name}_analysis.json")
        with open(output_path, "w") as f:
            json.dump(results, f, indent=2)
        
        return output_path
    
    elif format == "html":
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Save to HTML file
        output_path = os.path.join(output_dir, f"{page_name}_analysis.html")
        
        # Get analysis results
        analysis_text = results.get("results", "No results available")
        status = results.get("status", "unknown")
        page_type = results.get("page_type", "Unknown Page")
        screenshot = results.get("screenshot", "")
        
        # Add Lighthouse section
        lighthouse_reports_html = ""
        if "lighthouse_reports" in results and results["lighthouse_reports"]:
            print(f"Generating Lighthouse HTML for {len(results['lighthouse_reports'])} reports")
            lighthouse_reports_html = """
            <div class="section lighthouse-section">
                <h2>Lighthouse Audit Results</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Page</th>
                            <th>Performance</th>
                            <th>Accessibility</th>
                            <th>Best Practices</th>
                            <th>SEO</th>
                            <th>Report</th>
                        </tr>
                    </thead>
                    <tbody>
            """
            
            for report in results["lighthouse_reports"]:
                url = report.get("url", "Unknown URL")
                performance = report.get("performance", 0)
                accessibility = report.get("accessibility", 0)
                best_practices = report.get("best_practices", 0)
                seo = report.get("seo", 0)
                html_report = report.get("html_report", "")
                
                # Get score classes
                perf_class = get_score_class(performance)
                acc_class = get_score_class(accessibility)
                bp_class = get_score_class(best_practices)
                seo_class = get_score_class(seo)
                
                lighthouse_reports_html += f"""
                <tr>
                    <td>{url}</td>
                    <td class="score {perf_class}">{performance:.1f}%</td>
                    <td class="score {acc_class}">{accessibility:.1f}%</td>
                    <td class="score {bp_class}">{best_practices:.1f}%</td>
                    <td class="score {seo_class}">{seo:.1f}%</td>
                    <td><a href="../../lighthouse/{html_report}" target="_blank">View Report</a></td>
                </tr>
                """
            
            lighthouse_reports_html += """
                    </tbody>
                </table>
            </div>
            """
        
        # Get just the filename
        screenshot_filename = os.path.basename(screenshot) if screenshot else ""
        
        # Create relative path to the screenshot
        screenshot_rel_path = f"../../screenshots/desktop/{screenshot_filename}" if screenshot else ""
        
        # Create screenshot HTML (with scrollable container)
        screenshot_html = ""
        if screenshot:
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
        
        # Check if we have structured data from two-stage analysis
        structured_data = results.get("structured_data", None)
        
        # Extract scores from analysis text or structured data
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
        
        if structured_data and "scores" in structured_data:
            # Use structured scores if available
            for score in structured_data["scores"]:
                category_name = score.get("category", "").lower()
                score_value = score.get("score", 0)
                
                # Map category to key
                if "first impression" in category_name:
                    scores["first_impression"] = score_value
                elif "goal alignment" in category_name:
                    scores["goal_alignment"] = score_value
                elif "visual design" in category_name:
                    scores["visual_design"] = score_value
                elif "content quality" in category_name:
                    scores["content_quality"] = score_value
                elif "usability" in category_name:
                    scores["usability"] = score_value
                elif "conversion" in category_name:
                    scores["conversion"] = score_value
                elif "technical" in category_name:
                    scores["technical"] = score_value
            
            # Get overall score from summary if available
            if "summary" in structured_data:
                scores["overall"] = structured_data["summary"].get("overall_score", 0)
        else:
            # Extract scores from analysis text
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
        
        # Enhanced HTML generation if we have structured data
        if structured_data:
            # Extract critical issues
            issues_html = ""
            if "critical_issues" in structured_data and structured_data["critical_issues"]:
                issues_html = """
                <div class="section issues-section">
                    <h2>Critical Issues</h2>
                    <div class="issues-content">
                        <ul class="issues-list">
                """
                
                for issue in structured_data["critical_issues"]:
                    title = issue.get("title", "Unknown Issue")
                    severity = issue.get("severity", "Medium")
                    description = issue.get("description", "")
                    area = issue.get("area", "")
                    
                    severity_class = f"{severity.lower()}-severity"
                    
                    issues_html += f"""
                    <li class="issue-item {severity_class}">
                        <div class="issue-header">
                            <span class="issue-title">{title}</span>
                            <span class="issue-severity">{severity} Severity</span>
                        </div>
                        <div class="issue-description">{description}</div>
                        {f'<div class="issue-area">Area: {area}</div>' if area else ''}
                    </li>
                    """
                
                issues_html += """
                        </ul>
                    </div>
                </div>
                """
            
            # Extract recommendations
            recommendations_html = ""
            if "recommendations" in structured_data and structured_data["recommendations"]:
                recommendations_html = """
                <div class="section recommendations-section">
                    <h2>Recommendations</h2>
                    <div class="recommendations-content">
                        <ul class="recommendations-list">
                """
                
                for rec in structured_data["recommendations"]:
                    title = rec.get("title", "Unknown Recommendation")
                    impact = rec.get("impact", "Medium")
                    description = rec.get("description", "")
                    area = rec.get("area", "")
                    
                    impact_class = f"{impact.lower()}-impact"
                    
                    recommendations_html += f"""
                    <li class="recommendation-item {impact_class}">
                        <div class="recommendation-header">
                            <span class="recommendation-title">{title}</span>
                            <span class="recommendation-impact">{impact} Impact</span>
                        </div>
                        <div class="recommendation-description">{description}</div>
                        {f'<div class="recommendation-area">Area: {area}</div>' if area else ''}
                    </li>
                    """
                
                recommendations_html += """
                        </ul>
                    </div>
                </div>
                """
            
            # Extract summary
            summary_html = ""
            if "summary" in structured_data:
                summary = structured_data["summary"]
                summary_text = summary.get("text", "")
                overall_score = summary.get("overall_score", None)
                priority_action = summary.get("priority_action", "")
                
                summary_html = """
                <div class="section summary-section">
                    <h2>Summary</h2>
                """
                
                if overall_score is not None:
                    # Determine color based on score
                    if overall_score >= 8:
                        color_class = "good"
                    elif overall_score >= 6:
                        color_class = "average"
                    else:
                        color_class = "poor"
                    
                    summary_html += f"""
                    <div class="overall-score-container">
                        <div class="overall-score-label">Overall Effectiveness Score</div>
                        <div class="overall-score-value {color_class}">{overall_score}/10</div>
                    </div>
                    """
                
                if summary_text:
                    summary_html += f"""
                    <div class="summary-text">{summary_text}</div>
                    """
                    
                if priority_action:
                    summary_html += f"""
                    <div class="priority-action">
                        <strong>Priority Action:</strong> {priority_action}
                    </div>
                    """
                
                summary_html += """
                </div>
                """
                
            # Combine all structured sections
            structured_html = f"""
            <div class="structured-analysis">
                {summary_html}
                {issues_html}
                {recommendations_html}
            </div>
            """
            
            # Add tabs for structured vs. full analysis
            tabs_html = f"""
            <div class="tabs">
                <div class="tab active" data-tab="tab-structured">Structured Analysis</div>
                <div class="tab" data-tab="tab-full">Full Analysis</div>
            </div>
            
            <div id="tab-structured" class="tab-content active">
                {structured_html}
            </div>
            
            <div id="tab-full" class="tab-content">
                <div class="section">
                    <h2>Complete Analysis</h2>
                    <div class="analysis-result">
                        {analysis_html}
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
            """
            
            # Create full HTML with all sections - moved Lighthouse to bottom
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
                        padding: 20px;
                        color: #333;
                        background-color: #f9f9f9;
                    }}
                    .container {{
                        max-width: 1200px;
                        margin: 0 auto;
                        background-color: #fff;
                        padding: 30px;
                        border-radius: 8px;
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
                        margin-bottom: 0.7em;
                    }}
                    ul, ol {{
                        padding-left: 2em;
                    }}
                    .score-container {{
                        display: grid;
                        grid-template-columns: 1fr;
                        gap: 15px;
                        margin-top: 15px;
                    }}
                    .score-item {{
                        display: grid;
                        grid-template-columns: 200px 1fr 50px;
                        gap: 15px;
                        align-items: center;
                        margin-bottom: 10px;
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
                    
                    .issues-list, .recommendations-list {{
                        list-style: none;
                        padding: 0;
                        margin: 0;
                    }}
                    .issue-item, .recommendation-item {{
                        margin-bottom: 20px;
                        padding: 15px;
                        border-radius: 6px;
                    }}
                    .issue-item {{
                        background-color: #fff5f7;
                        border-left: 4px solid #e53e78;
                    }}
                    .recommendation-item {{
                        background-color: #f0fdf4;
                        border-left: 4px solid #10b981;
                    }}
                    .issue-header, .recommendation-header {{
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 10px;
                    }}
                    .issue-title, .recommendation-title {{
                        font-weight: 600;
                        font-size: 1.1em;
                    }}
                    .issue-severity, .recommendation-impact {{
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-size: 0.8em;
                        font-weight: 500;
                    }}
                    .high-severity {{
                        background-color: #fee2e2;
                        color: #b91c1c;
                    }}
                    .medium-severity {{
                        background-color: #fef3c7;
                        color: #d97706;
                    }}
                    .low-severity {{
                        background-color: #e0f2fe;
                        color: #0369a1;
                    }}
                    .high-impact {{
                        background-color: #d1fae5;
                        color: #047857;
                    }}
                    .medium-impact {{
                        background-color: #e0f2fe;
                        color: #0369a1;
                    }}
                    .low-impact {{
                        background-color: #f3f4f6;
                        color: #4b5563;
                    }}
                    .issue-description, .recommendation-description {{
                        margin-bottom: 10px;
                    }}
                    .issue-area, .recommendation-area {{
                        font-size: 0.9em;
                        color: #64748b;
                    }}
                    .overall-score-container {{
                        display: flex;
                        align-items: center;
                        gap: 15px;
                        margin-bottom: 20px;
                    }}
                    .overall-score-label {{
                        font-weight: 500;
                    }}
                    .overall-score-value {{
                        font-size: 1.8em;
                        font-weight: 700;
                        padding: 10px 20px;
                        border-radius: 6px;
                        background-color: #f8fafc;
                    }}
                    .summary-text {{
                        font-size: 1.1em;
                        line-height: 1.7;
                        color: #334155;
                        padding: 15px;
                        background-color: #f8fafc;
                        border-radius: 6px;
                        margin-bottom: 20px;
                    }}
                    .priority-action {{
                        margin-top: 15px;
                        padding: 15px;
                        background-color: #f0f9ff;
                        border-left: 4px solid #3b82f6;
                        border-radius: 6px;
                    }}
                    
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
                        transition: all 0.3s ease;
                    }}
                    .tab:hover {{
                        background-color: #f8fafc;
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
                    
                    /* Lighthouse specific styles */
                    .lighthouse-section table {{
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                    }}
                    .lighthouse-section th, .lighthouse-section td {{
                        padding: 12px;
                        text-align: left;
                        border-bottom: 1px solid #e2e8f0;
                    }}
                    .lighthouse-section th {{
                        background-color: #f8fafc;
                        font-weight: 600;
                    }}
                    .lighthouse-section td a {{
                        color: #3b82f6;
                        text-decoration: none;
                    }}
                    .lighthouse-section td a:hover {{
                        text-decoration: underline;
                    }}
                    .lighthouse-section .score {{
                        font-weight: bold;
                        text-align: center;
                        border-radius: 4px;
                        padding: 4px 8px;
                    }}
                    
                    @media (max-width: 800px) {{
                        .score-item {{
                            grid-template-columns: 1fr;
                        }}
                        .score-value {{
                            text-align: left;
                        }}
                        .issue-header, .recommendation-header {{
                            flex-direction: column;
                            align-items: flex-start;
                            gap: 8px;
                        }}
                        .overall-score-container {{
                            flex-direction: column;
                            align-items: flex-start;
                        }}
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>{page_type} Analysis</h1>
                    
                    <div class="section">
                        <h2>Page Information</h2>
                        <p><strong>Organization:</strong> {results.get('organization', 'Unknown')}</p>
                        <p><strong>Page Type:</strong> {page_type}</p>
                        <p><strong>Analysis Date:</strong> {results.get('analysis_date', 'Unknown')}</p>
                        <p><strong>Status:</strong> {status}</p>
                    </div>
                    
                    {error_section}
                    
                    {score_html}
                    
                    {tabs_html}

                    {lighthouse_reports_html}
                    
                    {screenshot_html}
                                        
                    <div class="navigation">
                        <a href="index.html">← Back to All Pages</a>
                        <a href="../../desktop_screenshot_analysis.html">View Overall Analysis →</a>
                    </div>
                </div>
            </body>
            </html>
            """
        else:
            # Create more basic HTML for standard analysis
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
                        padding: 20px;
                        color: #333;
                        background-color: #f9f9f9;
                    }}
                    .container {{
                        max-width: 1200px;
                        margin: 0 auto;
                        background-color: #fff;
                        padding: 30px;
                        border-radius: 8px;
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
                        margin-bottom: 0.7em;
                    }}
                    ul, ol {{
                        padding-left: 2em;
                    }}
                    .score-container {{
                        display: grid;
                        grid-template-columns: 1fr;
                        gap: 15px;
                        margin-top: 15px;
                    }}
                    .score-item {{
                        display: grid;
                        grid-template-columns: 200px 1fr 50px;
                        gap: 15px;
                        align-items: center;
                        margin-bottom: 10px;
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
                    
                    /* Lighthouse specific styles */
                    .lighthouse-section table {{
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                    }}
                    .lighthouse-section th, .lighthouse-section td {{
                        padding: 12px;
                        text-align: left;
                        border-bottom: 1px solid #e2e8f0;
                    }}
                    .lighthouse-section th {{
                        background-color: #f8fafc;
                        font-weight: 600;
                    }}
                    .lighthouse-section td a {{
                        color: #3b82f6;
                        text-decoration: none;
                    }}
                    .lighthouse-section td a:hover {{
                        text-decoration: underline;
                    }}
                    .lighthouse-section .score {{
                        font-weight: bold;
                        text-align: center;
                        border-radius: 4px;
                        padding: 4px 8px;
                    }}
                    
                    @media (max-width: 800px) {{
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
                    <h1>{page_type} Analysis</h1>
                    
                    <div class="section">
                        <h2>Page Information</h2>
                        <p><strong>Organization:</strong> {results.get('organization', 'Unknown')}</p>
                        <p><strong>Page Type:</strong> {page_type}</p>
                        <p><strong>Analysis Date:</strong> {results.get('analysis_date', 'Unknown')}</p>
                        <p><strong>Status:</strong> {status}</p>
                    </div>
                    
                    {error_section}
                    
                    {score_html}
                    
                    <div class="section">
                        <h2>Analysis Results</h2>
                        <div class="analysis-result">
                            {analysis_html}
                        </div>
                    </div>

                    {lighthouse_reports_html}
                    
                    {screenshot_html}
                    
                    
                    
                    <div class="navigation">
                        <a href="index.html">← Back to All Pages</a>
                        <a href="../../desktop_screenshot_analysis.html">View Overall Analysis →</a>
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