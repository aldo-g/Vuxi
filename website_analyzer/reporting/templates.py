"""
HTML templates for report generation.
"""

def report_header() -> str:
    """
    Create the HTML header section.
    
    Returns:
        str: HTML header
    """
    return """<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Website Analysis Summary</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        h1, h2, h3 {
            color: #2c3e50;
        }
        .summary-box {
            background-color: #f8f9fa;
            border-radius: 5px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th, td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #f2f2f2;
        }
        tr:hover {
            background-color: #f5f5f5;
        }
        .score {
            font-weight: bold;
        }
        .good {
            color: #27ae60;
        }
        .average {
            color: #f39c12;
        }
        .poor {
            color: #e74c3c;
        }
        .screenshot-gallery {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .screenshot-item {
            border: 1px solid #ddd;
            border-radius: 4px;
            overflow: hidden;
        }
        .screenshot-item img {
            width: 100%;
            height: auto;
            display: block;
        }
        .screenshot-caption {
            padding: 10px;
            background: #f8f9fa;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Website Analysis Summary</h1>
"""

def report_footer() -> str:
    """
    Create the HTML footer section.
    
    Returns:
        str: HTML footer
    """
    return """
    </div>
</body>
</html>
"""

def page_analysis_template(
    page_type: str,
    screenshot_rel_path: str,
    results: dict,
    analysis_html: str,
    error_section: str = ""
) -> str:
    """
    Create HTML for individual page analysis.
    
    Args:
        page_type (str): Type of page
        screenshot_rel_path (str): Path to screenshot
        results (dict): Analysis results
        analysis_html (str): HTML-formatted analysis
        error_section (str): Error information HTML
        
    Returns:
        str: Complete HTML page
    """
    return f"""
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
                <p><strong>Status:</strong> {results.get('status', 'unknown')}</p>
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