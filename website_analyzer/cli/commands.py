#!/usr/bin/env python
"""
Command-line interface for the website analyzer.

This module provides the command-line interface for running the website analyzer.
"""

import os
import argparse
import sys

from website_analyzer.crawler import WebCrawler
from website_analyzer.crawler.screenshot_capturer import ScreenshotCapturer
from website_analyzer.lighthouse import LighthouseAuditor
from website_analyzer.reporting import ReportGenerator
from website_analyzer.screenshot_analyzer import ScreenshotAnalyzer

def main():
    """Main entry point for the command-line interface."""
    parser = argparse.ArgumentParser(description="Analyze websites with screenshots and Lighthouse audits")
    
    # Create subparsers for different commands
    subparsers = parser.add_subparsers(dest='command', help='Commands')
    
    # Crawl command - the default command
    crawl_parser = subparsers.add_parser('crawl', help='Crawl a website and capture screenshots')
    add_crawl_arguments(crawl_parser)
    crawl_parser.set_defaults(func=crawl_command)
    
    # Analyze screenshots command (overall analysis)
    analyze_parser = subparsers.add_parser('analyze', help='Analyze website screenshots for overall design consistency')
    add_analyze_arguments(analyze_parser)
    analyze_parser.set_defaults(func=analyze_command)
    
    # Analyze individual pages command
    analyze_pages_parser = subparsers.add_parser('analyze-pages', help='Analyze individual page screenshots separately')
    add_analyze_pages_arguments(analyze_pages_parser)
    analyze_pages_parser.set_defaults(func=analyze_pages_command)
    
    # Analyze single file command
    analyze_file_parser = subparsers.add_parser('analyze-file', help='Analyze a single screenshot file')
    add_analyze_file_arguments(analyze_file_parser)
    analyze_file_parser.set_defaults(func=analyze_file_command)
    
    # Parse arguments
    args = parser.parse_args()
    
    # If a command is specified, call its function
    if hasattr(args, 'func'):
        return args.func(args)
    else:
        # For backward compatibility - if no command is specified,
        # assume 'crawl' if a URL is provided
        if len(sys.argv) > 1 and not sys.argv[1].startswith('-'):
            args.url = sys.argv[1]
            args.output = "website_analysis"
            args.max_pages = 10
            args.timeout = 30000
            args.wait = 2
            args.no_lighthouse = False
            args.no_screenshots = False
            return crawl_command(args)
        else:
            parser.print_help(sys.stderr)
            return 1
        
def add_crawl_arguments(parser):
    """Add arguments for the crawl command."""
    parser.add_argument("url", help="Starting URL to crawl")
    parser.add_argument("--output", "-o", default="website_analysis", help="Output directory for screenshots and reports")
    parser.add_argument("--max-pages", "-m", type=int, default=10, help="Maximum number of pages to crawl")
    parser.add_argument("--timeout", "-t", type=int, default=30000, help="Page load timeout in milliseconds")
    parser.add_argument("--wait", "-w", type=int, default=2, help="Additional wait time after page load (seconds)")
    parser.add_argument("--no-lighthouse", action="store_true", help="Skip Lighthouse audits")
    parser.add_argument("--no-screenshots", action="store_true", help="Skip screenshots")


def add_analyze_arguments(parser):
    """Add arguments for the analyze command."""
    parser.add_argument("--input-dir", "-i", default="website_analysis", help="Directory containing screenshots to analyze")
    parser.add_argument("--output-format", "-f", choices=["json", "html"], default="html", help="Output format for analysis results")
    parser.add_argument("--org-name", default="Edinburgh Peace Institute", help="Organization name for context")
    parser.add_argument("--desktop-only", action="store_true", help="Only analyze desktop screenshots (default)")
    parser.add_argument("--all-devices", action="store_true", help="Analyze screenshots for all devices")


def add_analyze_pages_arguments(parser):
    """Add arguments for the analyze-pages command."""
    parser.add_argument("--input-dir", "-i", default="website_analysis", help="Directory containing screenshots to analyze")
    parser.add_argument("--output-format", "-f", choices=["json", "html"], default="html", help="Output format for analysis results")
    parser.add_argument("--org-name", default="Edinburgh Peace Institute", help="Organization name for context")


def crawl_command(args):
    """Run the website crawler."""
    # Create output directory
    os.makedirs(args.output, exist_ok=True)
    
    # Initialize components
    web_crawler = WebCrawler(
        max_pages=args.max_pages,
        timeout=args.timeout,
        wait_time=args.wait
    )
    
    # Initialize screenshot capturer if needed
    screenshot_capturer = None
    if not args.no_screenshots:
        screenshot_capturer = ScreenshotCapturer(args.output)
    
    # Initialize lighthouse auditor if needed
    lighthouse_auditor = None
    if not args.no_lighthouse:
        lighthouse_auditor = LighthouseAuditor(args.output)
    
    # Initialize report generator
    report_gen = ReportGenerator(
        args.output,
        screenshot_capturer=screenshot_capturer,
        lighthouse_auditor=lighthouse_auditor
    )
    
    try:
        # Crawl the website
        crawl_stats = web_crawler.crawl(
            args.url,
            screenshot_capturer=screenshot_capturer,
            lighthouse_auditor=lighthouse_auditor
        )
        
        # Generate the report
        report_path = report_gen.generate(crawl_stats)
        
        print(f"Analysis saved to: {os.path.abspath(args.output)}")
        print(f"Summary report: {os.path.abspath(report_path)}")
        
        return 0
        
    except Exception as e:
        print(f"Error during website analysis: {e}", file=sys.stderr)
        return 1


def analyze_command(args):
    """Run the screenshot analyzer for overall design consistency."""
    try:
        # Check if the input directory exists
        if not os.path.exists(args.input_dir):
            print(f"Input directory does not exist: {args.input_dir}")
            return 1
        
        # Initialize screenshot analyzer
        analyzer = ScreenshotAnalyzer(args.input_dir)
        
        if not args.all_devices:  # Desktop is the default
            # Analyze desktop screenshots
            output_path = analyzer.analyze_desktop_screenshots(
                org_name=args.org_name,
                save_format=args.output_format
            )
            
            if output_path:
                print(f"Desktop screenshot analysis saved to: {os.path.abspath(output_path)}")
                print(f"To analyze individual pages, run: python -m website_analyzer.cli analyze-pages")
                return 0
            else:
                print("Desktop screenshot analysis failed")
                return 1
        else:
            # Analyze all device screenshots - not implemented yet
            print("Analysis for all devices not implemented yet")
            return 1
        
    except Exception as e:
        print(f"Error during screenshot analysis: {e}", file=sys.stderr)
        return 1


def analyze_pages_command(args):
    """Run the screenshot analyzer for individual pages."""
    try:
        # Check if the input directory exists
        if not os.path.exists(args.input_dir):
            print(f"Input directory does not exist: {args.input_dir}")
            return 1
        
        # Initialize screenshot analyzer
        analyzer = ScreenshotAnalyzer(args.input_dir)
        
        # Analyze individual pages
        output_paths = analyzer.analyze_individual_pages(
            org_name=args.org_name,
            save_format=args.output_format
        )
        
        if output_paths:
            print(f"\nIndividual page analyses completed successfully!")
            print(f"Analysis reports saved to: {os.path.abspath(os.path.dirname(output_paths[0]))}")
            
            # Create an index file for all page analyses
            index_path = create_pages_index(args.input_dir, output_paths)
            if index_path:
                print(f"Index page: {os.path.abspath(index_path)}")
            
            return 0
        else:
            print("Individual page analysis failed")
            return 1
        
    except Exception as e:
        print(f"Error during individual page analysis: {e}", file=sys.stderr)
        return 1


def create_pages_index(input_dir, output_paths):
    """
    Create an index HTML file for all individual page analyses.
    
    Args:
        input_dir (str): Input directory
        output_paths (List[str]): List of output paths
        
    Returns:
        str: Path to the index file
    """
    # If no output paths, return empty string
    if not output_paths:
        return ""
    
    # Create the index file path
    analysis_dir = os.path.join(input_dir, "analysis")
    pages_dir = os.path.join(analysis_dir, "pages")
    index_path = os.path.join(pages_dir, "index.html")
    
    # Create list items for each page analysis
    page_links = ""
    for path in output_paths:
        # Get the filename and page name
        filename = os.path.basename(path)
        page_name = filename.replace("_analysis.html", "").replace("_", " ").title()
        
        # Add link to the list
        page_links += f"""
        <li>
            <a href="{filename}">{page_name}</a>
        </li>
        """
    
    # Create the HTML content
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Individual Page Analyses</title>
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
            h1, h2, h3 {{
                color: #2c3e50;
            }}
            .section {{
                background-color: #f8f9fa;
                border-radius: 5px;
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }}
            ul {{
                list-style-type: none;
                padding: 0;
            }}
            li {{
                margin-bottom: 10px;
                padding: 10px;
                background-color: #f5f5f5;
                border-radius: 3px;
            }}
            a {{
                color: #3498db;
                text-decoration: none;
            }}
            a:hover {{
                text-decoration: underline;
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
            <h1>Individual Page Analyses</h1>
            
            <div class="section">
                <h2>Available Page Analyses</h2>
                <ul>
                    {page_links}
                </ul>
            </div>
            
            <div class="navigation">
                <p><a href="../desktop_screenshot_analysis.html">← Back to Overall Analysis</a></p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Write the HTML content to the file
    with open(index_path, "w") as f:
        f.write(html_content)
    
    return index_path

def add_analyze_file_arguments(parser):
    """Add arguments for the analyze-file command."""
    parser.add_argument("file_path", help="Path to the screenshot file to analyze")
    parser.add_argument("--output-format", "-f", choices=["json", "html"], default="html", help="Output format for analysis results")
    parser.add_argument("--output-dir", "-d", help="Output directory for analysis (defaults to parent directory of screenshot)")
    parser.add_argument("--org-name", default="Edinburgh Peace Institute", help="Organization name for context")

def analyze_file_command(args):
    try:
        # Check if the file exists
        if not os.path.exists(args.file_path):
            print(f"File does not exist: {args.file_path}")
            return 1
        
        # Initialize screenshot analyzer
        # If --output-dir is provided, use it; otherwise extract from file path
        if hasattr(args, 'output_dir') and args.output_dir:
            output_dir = args.output_dir
        else:
            # Default to the root directory of the analysis, not under screenshots
            file_dir = os.path.dirname(args.file_path)
            if "screenshots" in file_dir:
                # Navigate up to the main analysis folder by removing "screenshots" and anything after
                output_dir = file_dir.split("screenshots")[0].rstrip("/")
            else:
                output_dir = os.path.dirname(file_dir) if os.path.dirname(file_dir) else "website_analysis"
        
        analyzer = ScreenshotAnalyzer(output_dir)
        
        # Analyze single file
        output_path = analyzer.analyze_single_file(
            args.file_path,
            org_name=args.org_name,
            save_format=args.output_format
        )
        
        if output_path:
            print(f"Single file analysis saved to: {os.path.abspath(output_path)}")
            return 0
        else:
            print("Single file analysis failed")
            return 1
        
    except Exception as e:
        print(f"Error during single file analysis: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())