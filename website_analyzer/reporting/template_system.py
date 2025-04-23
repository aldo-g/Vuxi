"""
Unified template system for website analyzer reports.
"""

import os
import jinja2


# Set up templates directory
template_dir = os.path.join(os.path.dirname(__file__), 'templates')
os.makedirs(template_dir, exist_ok=True)

# Initialize Jinja environment
env = jinja2.Environment(
    loader=jinja2.FileSystemLoader(template_dir),
    autoescape=jinja2.select_autoescape(['html', 'xml']),
    trim_blocks=True,
    lstrip_blocks=True
)

def render_template(template_name, context):
    """
    Render a template with the given context.
    
    Args:
        template_name (str): Name of the template file
        context (dict): Context variables for the template
        
    Returns:
        str: Rendered template as a string
    """
    template = env.get_template(template_name)
    return template.render(**context)

# Common CSS styles
COMMON_STYLES = """
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
    h1, h2, h3, h4, h5, h6 {
        color: #2c3e50;
        margin-top: 1.5em;
        margin-bottom: 0.5em;
    }
    h1 { font-size: 2em; }
    h2 { font-size: 1.75em; }
    h3 { font-size: 1.5em; }
    h4 { font-size: 1.25em; }
    h5 { font-size: 1.1em; }
    h6 { font-size: 1em; }
    p { margin-bottom: 1em; }
    .section {
        background-color: #f8f9fa;
        border-radius: 5px;
        padding: 20px;
        margin-bottom: 20px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .error {
        background-color: #fee;
        border-left: 4px solid #c00;
    }
    pre {
        background-color: #f5f5f5;
        padding: 10px;
        border-radius: 5px;
        overflow-x: auto;
        white-space: pre-wrap;
    }
    .analysis-result { margin-top: 20px; }
    li { margin-bottom: 0.5em; }
    ul, ol { padding-left: 2em; }
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
    th { background-color: #f2f2f2; }
    tr:hover { background-color: #f5f5f5; }
    .score { font-weight: bold; }
    .good { color: #27ae60; }
    .average { color: #f39c12; }
    .poor { color: #e74c3c; }
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
    .screenshot-container {
        text-align: center;
        margin: 20px 0;
    }
    .screenshot {
        max-width: 100%;
        border: 1px solid #ddd;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .navigation {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #eee;
    }
"""