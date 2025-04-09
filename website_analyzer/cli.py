"""
Command-line interface for the website analyzer.

This module provides the command-line interface for running the website analyzer.
"""

import os
import argparse
import sys

from . import crawler
from . import screenshot
from . import lighthouse_auditor as lh_auditor
from . import report_generator


def main():
    """Main entry point for the command-line interface."""
    parser = argparse.ArgumentParser(description="Analyze websites with screenshots and Lighthouse audits")
    parser.add_argument("url", help="Starting URL to crawl")
    parser.add_argument("--output", "-o", default="website_analysis", help="Output directory for screenshots and reports")
    parser.add_argument("--max-pages", "-m", type=int, default=10, help="Maximum number of pages to crawl")
    parser.add_argument("--timeout", "-t", type=int, default=30000, help="Page load timeout in milliseconds")
    parser.add_argument("--wait", "-w", type=int, default=2, help="Additional wait time after page load (seconds)")
    parser.add_argument("--no-lighthouse", action="store_true", help="Skip Lighthouse audits")
    parser.add_argument("--no-screenshots", action="store_true", help="Skip screenshots")
    
    args = parser.parse_args()
    
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
        
    except Exception as e:
        print(f"Error during website analysis: {e}", file=sys.stderr)
        return 1
    
    return 0


if __name__ == "__main__":
    sys.exit(main())