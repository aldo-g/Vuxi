"""
Command-line interface for the website analyzer.

This module provides a unified approach to the CLI functionality, combining
argument parsing and command execution.
"""
import json
from website_analyzer.lighthouse.report_trimmer import (
    trim_lighthouse_report,
    format_trimmed_report_for_analysis,
    trim_all_lighthouse_reports
)

import os
import sys
import argparse
from typing import Dict, Any, Optional, List

from website_analyzer.crawler import WebCrawler
from website_analyzer.crawler.screenshot_capturer import ScreenshotCapturer
from website_analyzer.lighthouse import LighthouseAuditor
from website_analyzer.reporting import ReportGenerator
from website_analyzer.screenshot_analyzer import ScreenshotAnalyzer


class CLI:
    """Unified CLI implementation for website analyzer."""
    
    def __init__(self):
        """Initialize the CLI."""
        self.parser = self._create_parser()
    
    def _create_parser(self) -> argparse.ArgumentParser:
        """
        Create the argument parser for the CLI.
        
        Returns:
            argparse.ArgumentParser: The configured argument parser
        """
        parser = argparse.ArgumentParser(description="Analyze websites with screenshots and Lighthouse audits")
        
        # Create subparsers for different commands
        subparsers = parser.add_subparsers(dest='command', help='Commands')
        
        # Crawl command
        crawl_parser = subparsers.add_parser('crawl', help='Crawl a website and capture screenshots')
        self._add_crawl_arguments(crawl_parser)
        crawl_parser.set_defaults(func=self.crawl_command)
        
        # Analyze screenshots command (overall analysis)
        analyze_parser = subparsers.add_parser('analyze', help='Analyze website screenshots for overall design consistency')
        self._add_analyze_arguments(analyze_parser)
        analyze_parser.set_defaults(func=self.analyze_command)
        
        # Analyze individual pages command
        analyze_pages_parser = subparsers.add_parser('analyze-pages', help='Analyze individual page screenshots separately')
        self._add_analyze_pages_arguments(analyze_pages_parser)
        analyze_pages_parser.set_defaults(func=self.analyze_pages_command)
        
        # Analyze single file command
        analyze_file_parser = subparsers.add_parser('analyze-file', help='Analyze a single screenshot file')
        self._add_analyze_file_arguments(analyze_file_parser)
        analyze_file_parser.set_defaults(func=self.analyze_file_command)

        # Trim Lighthouse report command
        trim_lighthouse_parser = subparsers.add_parser('trim-lighthouse', help='Trim Lighthouse reports for API analysis')
        self._add_trim_lighthouse_arguments(trim_lighthouse_parser)
        trim_lighthouse_parser.set_defaults(func=self.trim_lighthouse_command)
        
        # Generate PDF report command
        generate_pdf_parser = subparsers.add_parser('generate-pdf', help='Generate a comprehensive PDF report')
        self._add_generate_pdf_arguments(generate_pdf_parser)
        generate_pdf_parser.set_defaults(func=self.generate_pdf_command)
        
        return parser
    
    def _add_crawl_arguments(self, parser: argparse.ArgumentParser) -> None:
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
    
    def _add_analyze_arguments(self, parser: argparse.ArgumentParser) -> None:
        """
        Add arguments for the analyze command.
        
        Args:
            parser (argparse.ArgumentParser): The parser to add arguments to
        """
        parser.add_argument("--input-dir", "-i", default="website_analysis", help="Directory containing screenshots to analyze")
        parser.add_argument("--output-format", "-f", choices=["json", "html"], default="html", help="Output format for analysis results")
        
        parser.add_argument("--org-name", default="Edinburgh Peace Institute", help="Organization name for context")
        parser.add_argument("--org-type", default="non-profit", help="Organization type (non-profit, business, educational, etc.)")
        parser.add_argument("--org-purpose", default="To encourage donations and sign-ups for trainings", 
                        help="Main purpose of the website (e.g., drive donations, generate leads, educate visitors)")
        
        parser.add_argument("--desktop-only", action="store_true", help="Only analyze desktop screenshots (default)")
        parser.add_argument("--all-devices", action="store_true", help="Analyze screenshots for all devices")
        
        # Add argument for two-stage analysis
        parser.add_argument("--two-stage", action="store_true", help="Use two-stage analysis (separate analysis and formatting)")
        parser.add_argument("--single-stage", action="store_true", help="Use single-stage analysis (default)")
            
    def _add_analyze_pages_arguments(self, parser: argparse.ArgumentParser) -> None:
        """
        Add arguments for the analyze-pages command.
        
        Args:
            parser (argparse.ArgumentParser): The parser to add arguments to
        """
        parser.add_argument("--input-dir", "-i", default="website_analysis", help="Directory containing screenshots to analyze")
        parser.add_argument("--output-format", "-f", choices=["json", "html"], default="html", help="Output format for analysis results")
        
        # Organization information
        parser.add_argument("--org-name", default="Edinburgh Peace Institute", help="Organization name for context")
        parser.add_argument("--org-type", default="non-profit", help="Organization type (non-profit, business, educational, etc.)")
        parser.add_argument("--org-purpose", default="To encourage donations and sign-ups for trainings", 
                        help="Main purpose of the website (e.g., drive donations, generate leads, educate visitors)")
        
        # Add argument for two-stage analysis
        parser.add_argument("--two-stage", action="store_true", help="Use two-stage analysis (separate analysis and formatting)")
        parser.add_argument("--single-stage", action="store_true", help="Use single-stage analysis (default)")

        
    def _add_analyze_file_arguments(self, parser: argparse.ArgumentParser) -> None:
        """
        Add arguments for the analyze-file command.
        
        Args:
            parser (argparse.ArgumentParser): The parser to add arguments to
        """
        parser.add_argument("file_path", help="Path to the screenshot file to analyze")
        parser.add_argument("--output-format", "-f", choices=["json", "html"], default="html", help="Output format for analysis results")
        parser.add_argument("--output-dir", "-d", help="Output directory for analysis (defaults to parent directory of screenshot)")
        
        # Organization information
        parser.add_argument("--org-name", default="Edinburgh Peace Institute", help="Organization name for context")
        parser.add_argument("--org-type", default="non-profit", help="Organization type (non-profit, business, educational, etc.)")
        parser.add_argument("--org-purpose", default="To encourage donations and sign-ups for trainings", 
                        help="Main purpose of the website (e.g., drive donations, generate leads, educate visitors)")
        
    def run(self) -> int:
        """
        Run the CLI.
        
        Returns:
            int: Exit code (0 for success, non-zero for failure)
        """
        # Parse arguments
        args = self.parser.parse_args()
        
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
                return self.crawl_command(args)
            else:
                self.parser.print_help(sys.stderr)
                return 1
    
    def crawl_command(self, args: argparse.Namespace) -> int:
        """
        Run the website crawler.
        
        Args:
            args (argparse.Namespace): Command line arguments
            
        Returns:
            int: Exit code (0 for success, non-zero for failure)
        """
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
    
    def analyze_command(self, args: argparse.Namespace) -> int:
        """
        Run the screenshot analyzer for overall design consistency.
        
        Args:
            args (argparse.Namespace): Command line arguments
            
        Returns:
            int: Exit code (0 for success, non-zero for failure)
        """
        try:
            # Check if the input directory exists
            if not os.path.exists(args.input_dir):
                print(f"Input directory does not exist: {args.input_dir}")
                return 1
            
            # Initialize screenshot analyzer
            analyzer = ScreenshotAnalyzer(args.input_dir)
            
            # Create the context dictionary with all org-related parameters
            context = {
                "org_name": args.org_name,
                "org_type": args.org_type,
                "org_purpose": args.org_purpose
            }
            
            # Set two-stage analysis based on command line arguments
            if args.two_stage:
                from ..common.constants import USE_TWO_STAGE_ANALYSIS
                import builtins
                builtins.USE_TWO_STAGE_ANALYSIS = True
                print("Using two-stage analysis (separate analysis and formatting).")
            elif args.single_stage:
                from ..common.constants import USE_TWO_STAGE_ANALYSIS
                import builtins
                builtins.USE_TWO_STAGE_ANALYSIS = False
                print("Using single-stage analysis.")
            
            if not args.all_devices:  # Desktop is the default
                # Analyze desktop screenshots
                output_path = analyzer.analyze_desktop_screenshots(
                    context=context,
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
    
    def analyze_pages_command(self, args: argparse.Namespace) -> int:
        """
        Run the screenshot analyzer for individual pages.
        
        Args:
            args (argparse.Namespace): Command line arguments
            
        Returns:
            int: Exit code (0 for success, non-zero for failure)
        """
        try:
            # Check if the input directory exists
            if not os.path.exists(args.input_dir):
                print(f"Input directory does not exist: {args.input_dir}")
                return 1
            
            # Initialize screenshot analyzer
            analyzer = ScreenshotAnalyzer(args.input_dir)
            
            # Create the context dictionary with all org-related parameters
            context = {
                "org_name": args.org_name,
                "org_type": args.org_type,
                "org_purpose": args.org_purpose
            }
            
            # Set two-stage analysis based on command line arguments
            if hasattr(args, 'two_stage') and args.two_stage:
                from ..common.constants import USE_TWO_STAGE_ANALYSIS
                import sys
                try:
                    sys.modules['website_analyzer.common.constants'].USE_TWO_STAGE_ANALYSIS = True
                except (KeyError, AttributeError):
                    # Fallback if module structure is different
                    import builtins
                    builtins.USE_TWO_STAGE_ANALYSIS = True
                print("Using two-stage analysis (separate analysis and formatting).")
            elif hasattr(args, 'single_stage') and args.single_stage:
                from ..common.constants import USE_TWO_STAGE_ANALYSIS
                import sys
                try:
                    sys.modules['website_analyzer.common.constants'].USE_TWO_STAGE_ANALYSIS = False
                except (KeyError, AttributeError):
                    # Fallback if module structure is different
                    import builtins
                    builtins.USE_TWO_STAGE_ANALYSIS = False
                print("Using single-stage analysis.")
            
            # Analyze individual pages
            output_paths = analyzer.analyze_individual_pages(
                context=context,
                save_format=args.output_format
            )
            
            if output_paths:
                print(f"\nIndividual page analyses completed successfully!")
                print(f"Analysis reports saved to: {os.path.abspath(os.path.dirname(output_paths[0]))}")
                
                # Create an index file for all page analyses
                index_path = self.create_pages_index(args.input_dir, output_paths)
                if index_path:
                    print(f"Index page: {os.path.abspath(index_path)}")
                
                return 0
            else:
                print("Individual page analysis failed")
                return 1
            
        except Exception as e:
            print(f"Error during individual page analysis: {e}", file=sys.stderr)
            import traceback
            traceback.print_exc()
            return 1
    
    def analyze_file_command(self, args: argparse.Namespace) -> int:
        """
        Run the screenshot analyzer for a single file.
        
        Args:
            args (argparse.Namespace): Command line arguments
            
        Returns:
            int: Exit code (0 for success, non-zero for failure)
        """
        try:
            # Check if the file exists
            if not os.path.exists(args.file_path):
                print(f"File does not exist: {args.file_path}")
                return 1
            
            # Determine output directory
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
            
            # Add org-type and org-purpose arguments
            parser = self.parser._subparsers._group_actions[0].choices['analyze-file']
            if not hasattr(args, 'org_type'):
                parser.add_argument("--org-type", default="non-profit")
                args = parser.parse_args([], namespace=args)
                args.org_type = "non-profit"
                
            if not hasattr(args, 'org_purpose'):
                parser.add_argument("--org-purpose", default="To encourage donations and sign-ups for trainings")
                args = parser.parse_args([], namespace=args)
                args.org_purpose = "To encourage donations and sign-ups for trainings"
            
            # Create context dictionary
            context = {
                "org_name": args.org_name,
                "org_type": args.org_type,
                "org_purpose": args.org_purpose
            }
            
            # Initialize screenshot analyzer
            analyzer = ScreenshotAnalyzer(output_dir)
            
            # Analyze single file
            output_path = analyzer.analyze_single_file(
                args.file_path,
                context=context,
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
    
    def create_pages_index(self, input_dir: str, output_paths: List[str]) -> str:
        """
        Create an enhanced index HTML file for all individual page analyses.
        
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
        pages = []
        for path in output_paths:
            # Get the filename and page name
            filename = os.path.basename(path)
            page_name = filename.replace("_analysis.html", "").replace("_", " ").title()
            
            # Add to pages list
            pages.append({
                'filename': filename,
                'name': page_name
            })
        
        # Use the template system
        from website_analyzer.reporting.template_system import render_template
        
        html_content = render_template('pages_index.html', {
            'pages': pages,
            'common_styles': """
                body {
                    font-family: 'Segoe UI', Arial, sans-serif;
                    line-height: 1.6;
                    margin: 0;
                    padding: 20px;
                    color: #333;
                    background-color: #f9f9f9;
                }
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    background-color: #fff;
                    padding: 30px;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                }
                h1, h2, h3, h4, h5, h6 {
                    color: #2c3e50;
                    margin-top: 1.5em;
                    margin-bottom: 0.5em;
                    font-weight: 600;
                }
                h1 { 
                    font-size: 2.2em; 
                    padding-bottom: 10px;
                    border-bottom: 1px solid #eee;
                }
                h2 { 
                    font-size: 1.8em; 
                    color: #34495e;
                }
                .section {
                    background-color: #fff;
                    border-radius: 8px;
                    padding: 25px;
                    margin-bottom: 30px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
                    border: 1px solid #f0f0f0;
                }
            """
        })
        
        # Write the HTML content to the file
        with open(index_path, "w") as f:
            f.write(html_content)
        
        return index_path
    
    def _add_trim_lighthouse_arguments(self, parser: argparse.ArgumentParser) -> None:
        """
        Add arguments for the trim-lighthouse command.
        
        Args:
            parser (argparse.ArgumentParser): The parser to add arguments to
        """
        parser.add_argument("--input-dir", "-i", default="website_analysis/lighthouse", 
                            help="Directory containing Lighthouse reports")
        parser.add_argument("--output-dir", "-o", default="website_analysis/lighthouse/trimmed", 
                            help="Directory to save trimmed reports")
        parser.add_argument("--file", help="Specific Lighthouse JSON file to trim (if not provided, trims all)")
        
    def trim_lighthouse_command(self, args: argparse.Namespace) -> int:
        """
        Run the Lighthouse report trimming command.
        
        Args:
            args (argparse.Namespace): Command line arguments
            
        Returns:
            int: Exit code (0 for success, non-zero for failure)
        """
        try:
            # Ensure output directory exists
            os.makedirs(args.output_dir, exist_ok=True)
            
            # If a specific file is specified, trim just that one
            if args.file:
                if not os.path.exists(args.file):
                    print(f"File not found: {args.file}")
                    return 1
                
                print(f"Trimming Lighthouse report: {args.file}")
                trimmed_report = trim_lighthouse_report(args.file)
                
                output_base = os.path.splitext(os.path.basename(args.file))[0]
                
                # Save as JSON in the output directory
                json_output = os.path.join(args.output_dir, f"{output_base}_trimmed.json")
                with open(json_output, 'w') as f:
                    json.dump(trimmed_report, f, indent=2)
                print(f"Trimmed JSON saved to: {json_output}")
                
            else:
                # Trim all reports in the directory
                if not os.path.exists(args.input_dir):
                    print(f"Directory not found: {args.input_dir}")
                    return 1
                
                print(f"Trimming all Lighthouse reports in: {args.input_dir}")
                print(f"Saving trimmed reports to: {args.output_dir}")
                
                trimmed_reports = trim_all_lighthouse_reports(args.input_dir)
                
                if not trimmed_reports:
                    print("No Lighthouse JSON reports found")
                    return 1
                
                # Save trimmed reports
                for i, trimmed_report in enumerate(trimmed_reports):
                    if "error" in trimmed_report:
                        print(f"Error processing report {i+1}: {trimmed_report['error']}")
                        continue
                    
                    # Use original filename if available
                    url = trimmed_report.get('url', '')
                    if url:
                        from ..common.url_utils import create_filename_from_url
                        base_name = create_filename_from_url(url, i)
                    else:
                        base_name = f"trimmed_report_{i+1}"
                    
                    # Save as JSON in the output directory
                    json_output = os.path.join(args.output_dir, f"{base_name}_trimmed.json")
                    with open(json_output, 'w') as f:
                        json.dump(trimmed_report, f, indent=2)
                    print(f"Saved trimmed JSON: {json_output}")
                
                print(f"\nTrimmed {len(trimmed_reports)} Lighthouse reports successfully")
                print(f"Trimmed reports saved to: {args.output_dir}")
            
            return 0
            
        except Exception as e:
            print(f"Error during Lighthouse report trimming: {e}", file=sys.stderr)
            return 1
    
    # Add this method to define the arguments
    def _add_generate_pdf_arguments(self, parser: argparse.ArgumentParser) -> None:
        """
        Add arguments for the generate-pdf command.
        
        Args:
            parser (argparse.ArgumentParser): The parser to add arguments to
        """
        parser.add_argument("--input-dir", "-i", default="website_analysis", 
                            help="Directory containing analysis data")
        parser.add_argument("--output", "-o", default=None, 
                            help="Output path for the PDF report (defaults to <input_dir>/website_analysis_report.pdf)")

    def generate_pdf_command(self, args: argparse.Namespace) -> int:
        """
        Generate an executive summary report using an LLM.
        
        Args:
            args (argparse.Namespace): Command line arguments
            
        Returns:
            int: Exit code (0 for success, non-zero for failure)
        """
        try:
            # Check if the input directory exists
            if not os.path.exists(args.input_dir):
                print(f"Input directory does not exist: {args.input_dir}")
                return 1
                
            # Import executive summary generator
            from ..reporting.executive_summary import ExecutiveSummaryGenerator
            
            # Initialize report generator
            report_generator = ExecutiveSummaryGenerator(args.input_dir)
            
            # Generate executive summary
            output_path = report_generator.generate(args.output)
            
            print(f"\nExecutive summary generated: {os.path.abspath(output_path)}")
            print("\nTo create a PDF:")
            print("1. Open this HTML file in your browser")
            print("2. Use the Print function (Cmd+P or Ctrl+P)")
            print("3. Select 'Save as PDF' as the destination in the print dialog")
            print("4. Click 'Save' or 'Print' to create the PDF file")
            return 0
            
        except Exception as e:
            print(f"Error generating executive summary: {e}", file=sys.stderr)
            import traceback
            traceback.print_exc()
            return 1


def main():
    """Main entry point for the CLI."""
    cli = CLI()
    return cli.run()


if __name__ == "__main__":
    sys.exit(main())