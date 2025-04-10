#!/usr/bin/env python
"""
Command-line interface for the website analyzer.

This module provides the command-line interface for running the website analyzer.
"""

import os
import argparse
import sys

from . import crawler
from . import screenshot
from . import lighthouse_auditor as lh_auditor  # Renamed to avoid conflict
from . import report_generator
from . import screenshot_analyzer


def main():
    """Main entry point for the command-line interface."""
    parser = argparse.ArgumentParser(description="Analyze websites with screenshots and Lighthouse audits")
    
    # Create subparsers for different commands
    subparsers = parser.add_subparsers(dest='command', help='Commands')
    
    # Crawl command - the default command
    crawl_parser = subparsers.add_parser('crawl', help='Crawl a website and capture screenshots')
    add_crawl_arguments(crawl_parser)
    crawl_parser.set_defaults(func=crawl_command)
    
    # Analyze screenshots command
    analyze_parser = subparsers.add_parser('analyze', help='Analyze website screenshots')
    add_analyze_arguments(analyze_parser)
    analyze_parser.set_defaults(func=analyze_command)
    
    # Process arguments
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


def crawl_command(args):
    """Run the website crawler."""
    # Create output directory
    os.makedirs(args.output, exist_ok=True)
    
    # Initialize components
    web_crawler = crawler.WebCrawler(
        max_pages=args.max_pages,
        timeout=args.timeout,
        wait_time=args.wait
    )
    
    # Initialize screenshot capturer if needed
    screenshot_capturer = None
    if not args.no_screenshots:
        screenshot_capturer = screenshot.ScreenshotCapturer(args.output)
    
    # Initialize lighthouse auditor if needed
    lighthouse_auditor = None
    if not args.no_lighthouse:
        lighthouse_auditor = lh_auditor.LighthouseAuditor(args.output)
    
    # Initialize report generator
    report_gen = report_generator.ReportGenerator(
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
    """Run the screenshot analyzer."""
    try:
        # Check if the input directory exists
        if not os.path.exists(args.input_dir):
            print(f"Input directory does not exist: {args.input_dir}")
            return 1
        
        # Initialize screenshot analyzer
        analyzer = screenshot_analyzer.ScreenshotAnalyzer(args.input_dir)
        
        if not args.all_devices:  # Desktop is the default
            # Analyze desktop screenshots
            output_path = analyzer.analyze_desktop_screenshots(
                org_name=args.org_name,
                save_format=args.output_format
            )
            
            if output_path:
                print(f"Desktop screenshot analysis saved to: {os.path.abspath(output_path)}")
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


if __name__ == "__main__":
    sys.exit(main())