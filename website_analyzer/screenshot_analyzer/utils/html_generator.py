"""
HTML generation utilities for screenshot analysis reports.
"""
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
    Save individual page analysis results to a file.
    
    Args:
        results (Dict[str, Any]): Analysis results
        page_name (str): Name of the page
        output_dir (str): Output directory
        format (str): Output format (json or html)
        
    Returns:
        str: Path to the saved file
    """
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
        screenshot_rel_path = f"../screenshots/desktop/{screenshot_filename}" if screenshot else ""
        
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
            <title>{page_type} Analysis Report</title>
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
                .screenshot-container {{
                    text-align: center;
                    margin: 20px 0;
                }}
                .screenshot {{
                    max-width: 100%;
                    border: 1px solid #ddd;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }}
                .navigation {{
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid #eee;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>{page_type} Analysis Report</h1>
                
                <div class="section">
                    <h2>Page Information</h2>
                    <p><strong>Organization:</strong> {results.get('organization', 'Unknown')}</p>
                    <p><strong>Page Type:</strong> {page_type}</p>
                    <p><strong>Analysis Date:</strong> {results.get('analysis_date', 'Unknown')}</p>
                    <p><strong>Status:</strong> {status}</p>
                </div>
                
                <div class="screenshot-container">
                    <h2>Screenshot</h2>
                    <img src="{screenshot_rel_path}" alt="{page_type}" class="screenshot">
                </div>
                
                {error_section}
                
                <div class="section">
                    <h2>Analysis Results</h2>
                    <div class="analysis-result">
                        {analysis_html}
                    </div>
                </div>
                
                <div class="navigation">
                    <p><a href="../desktop_screenshot_analysis.html">← Back to Overall Analysis</a></p>
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