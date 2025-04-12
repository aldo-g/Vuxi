"""
Command-line argument parsers for the website analyzer.
"""

import argparse


def create_main_parser() -> argparse.ArgumentParser:
    """
    Create the main argument parser for the CLI.
    
    Returns:
        argparse.ArgumentParser: The configured argument parser
    """
    parser = argparse.ArgumentParser(description="Analyze websites with screenshots and Lighthouse audits")
    
    # Create subparsers for different commands
    subparsers = parser.add_subparsers(dest='command', help='Commands')
    
    # Crawl command
    crawl_parser = subparsers.add_parser('crawl', help='Crawl a website and capture screenshots')
    add_crawl_arguments(crawl_parser)
    
    # Analyze screenshots command (overall analysis)
    analyze_parser = subparsers.add_parser('analyze', help='Analyze website screenshots for overall design consistency')
    add_analyze_arguments(analyze_parser)
    
    # Analyze individual pages command
    analyze_pages_parser = subparsers.add_parser('analyze-pages', help='Analyze individual page screenshots separately')
    add_analyze_pages_arguments(analyze_pages_parser)
    
    # Analyze single file command
    analyze_file_parser = subparsers.add_parser('analyze-file', help='Analyze a single screenshot file')
    add_analyze_file_arguments(analyze_file_parser)
    
    return parser


def add_crawl_arguments(parser: argparse.ArgumentParser) -> None:
    """
    Add arguments for the crawl command.
    
    Args:
        parser (argparse.ArgumentParser): The parser to add arguments to
    """
    parser.add_argument("url", help="Starting URL to crawl")
    parser.add_argument("--output", "-o", default="website_analysis", help="Output directory for screenshots and reports")
    parser.add_argument("--max-pages", "-m", type=int, default=10, help="Maximum number of pages to crawl")
    parser.add_argument("--timeout", "-t", type=int, default=30000, help="Page load timeout in milliseconds")
    parser.add_argument("--wait", "-w", type=int, default=2, help="Additional wait time after page load (seconds)")
    parser.add_argument("--no-lighthouse", action="store_true", help="Skip Lighthouse audits")
    parser.add_argument("--no-screenshots", action="store_true", help="Skip screenshots")


def add_analyze_arguments(parser: argparse.ArgumentParser) -> None:
    """
    Add arguments for the analyze command.
    
    Args:
        parser (argparse.ArgumentParser): The parser to add arguments to
    """
    parser.add_argument("--input-dir", "-i", default="website_analysis", help="Directory containing screenshots to analyze")
    parser.add_argument("--output-format", "-f", choices=["json", "html"], default="html", help="Output format for analysis results")
    parser.add_argument("--org-name", default="Edinburgh Peace Institute", help="Organization name for context")
    parser.add_argument("--desktop-only", action="store_true", help="Only analyze desktop screenshots (default)")
    parser.add_argument("--all-devices", action="store_true", help="Analyze screenshots for all devices")


def add_analyze_pages_arguments(parser: argparse.ArgumentParser) -> None:
    """
    Add arguments for the analyze-pages command.
    
    Args:
        parser (argparse.ArgumentParser): The parser to add arguments to
    """
    parser.add_argument("--input-dir", "-i", default="website_analysis", help="Directory containing screenshots to analyze")
    parser.add_argument("--output-format", "-f", choices=["json", "html"], default="html", help="Output format for analysis results")
    parser.add_argument("--org-name", default="Edinburgh Peace Institute", help="Organization name for context")


def add_analyze_file_arguments(parser: argparse.ArgumentParser) -> None:
    """
    Add arguments for the analyze-file command.
    
    Args:
        parser (argparse.ArgumentParser): The parser to add arguments to
    """
    parser.add_argument("file_path", help="Path to the screenshot file to analyze")
    parser.add_argument("--output-format", "-f", choices=["json", "html"], default="html", help="Output format for analysis results")
    parser.add_argument("--org-name", default="Edinburgh Peace Institute", help="Organization name for context")