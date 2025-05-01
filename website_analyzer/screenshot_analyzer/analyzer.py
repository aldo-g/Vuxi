"""
Core analyzer module for screenshot analysis.
"""
import os
from datetime import datetime
import re
from typing import List, Dict, Any

from .api_clients import get_api_client
from .prompts import get_desktop_analysis_prompt, get_individual_page_analysis_prompt
from .page_detector import determine_page_type
from .utils.file_utils import collect_desktop_screenshots
from .utils.html_generator import (
    save_analysis_results,
    save_page_analysis_results
)

class ScreenshotAnalyzer:
    """
    Analyzes website screenshots for UX/UI design issues.
    """
    
    def __init__(self, output_dir: str):
        """
        Initialize the ScreenshotAnalyzer with configuration options.
        
        Args:
            output_dir (str): Directory where screenshots are saved
        """
        self.output_dir = output_dir
        self.screenshots_dir = os.path.join(output_dir, "screenshots")
        self.analysis_dir = os.path.join(output_dir, "analysis")
        self.page_analysis_dir = os.path.join(self.analysis_dir, "pages")
        os.makedirs(self.analysis_dir, exist_ok=True)
        os.makedirs(self.page_analysis_dir, exist_ok=True)
    
    def analyze_desktop_screenshots(
        self, 
        context: Dict[str, Any] = None,
        save_format: str = "html"
    ) -> str:
        """
        Analyze desktop screenshots for UX/UI design issues.
        
        Args:
            context (Dict[str, Any]): Context information about the organization
            save_format (str): Format to save results (json or html)
            
        Returns:
            str: Path to the analysis results file
        """
        # Default context if none provided
        if context is None:
            context = {
                "org_name": "Edinburgh Peace Institute",
                "org_type": "non-profit",
                "org_purpose": "To encourage donations and sign-ups for trainings"
            }
        
        # Collect desktop screenshots
        screenshots = collect_desktop_screenshots(self.screenshots_dir)
        if not screenshots:
            print("No desktop screenshots found")
            return ""
        
        print(f"Analyzing {len(screenshots)} desktop screenshots...")
        
        # Get prompt with context
        prompt = get_desktop_analysis_prompt(context)
        
        # Get the API client
        api_client = get_api_client()
        
        # Analyze screenshots with API
        results = api_client.analyze(screenshots, prompt)
        
        # Add analysis date and metadata
        results.update({
            "analysis_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "screenshots_analyzed": len(screenshots),
            "organization": context.get("org_name", "Unknown Organization"),
            "org_type": context.get("org_type", "Unknown Type"),
            "org_purpose": context.get("org_purpose", "Unknown Purpose")
        })
        
        # Save results
        output_path = save_analysis_results(
            results, 
            self.analysis_dir, 
            format=save_format
        )
        
        print(f"Screenshot analysis saved to: {output_path}")
        
        return output_path
    
    def analyze_individual_pages(
        self, 
        context: Dict[str, Any] = None,
        save_format: str = "html"
    ) -> List[str]:
        """
        Analyze individual page screenshots separately.
        
        Args:
            context (Dict[str, Any]): Context information about the organization
            save_format (str): Format to save results (json or html)
            
        Returns:
            List[str]: List of paths to the analysis results files
        """
        # Default context if none provided
        if context is None:
            context = {
                "org_name": "Edinburgh Peace Institute",
                "org_type": "non-profit",
                "org_purpose": "To encourage donations and sign-ups for trainings"
            }
        
        # Collect desktop screenshots
        screenshots = collect_desktop_screenshots(self.screenshots_dir)
        if not screenshots:
            print("No desktop screenshots found")
            return []
        
        print(f"Analyzing {len(screenshots)} individual pages...")
        
        # Get the API client
        api_client = get_api_client()
        
        # Check for Lighthouse data
        lighthouse_dir = os.path.join(self.output_dir, "lighthouse")
        lighthouse_reports = {}
        
        if os.path.exists(lighthouse_dir):
            print("Found Lighthouse reports directory, checking for reports...")
            from ..lighthouse.report_trimmer import trim_lighthouse_report
            
            # Load all JSON reports
            for filename in os.listdir(lighthouse_dir):
                if filename.endswith(".json"):
                    try:
                        report_path = os.path.join(lighthouse_dir, filename)
                        trimmed_report = trim_lighthouse_report(report_path)
                        # Use the URL as the key for matching with screenshots
                        url = trimmed_report.get("url", "")
                        if url:
                            lighthouse_reports[url] = trimmed_report
                            print(f"Loaded Lighthouse data for: {url}")
                    except Exception as e:
                        print(f"Error loading Lighthouse report {filename}: {e}")
        
        output_paths = []
        
        # Analyze each screenshot individually
        for i, screenshot in enumerate(screenshots):
            # Determine page type from filename
            filename = os.path.basename(screenshot)
            page_type = determine_page_type(filename)
            
            print(f"Analyzing page {i+1}/{len(screenshots)}: {page_type}")
            
            # Get prompt for individual page
            prompt = get_individual_page_analysis_prompt(page_type, context)
            
            # Analyze with API
            results = api_client.analyze([screenshot], prompt)
            
            # Add metadata
            results.update({
                "analysis_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "screenshot": screenshot,
                "page_type": page_type,
                "organization": context.get("org_name", "Unknown Organization"),
                "org_type": context.get("org_type", "Unknown Type"),
                "org_purpose": context.get("org_purpose", "Unknown Purpose")
            })
            
            # Try to find matching Lighthouse data
            lighthouse_data = None
            
            # Extract URL from filename
            url_match = re.search(r'\d+_([^_]+)_', filename)
            domain = url_match.group(1) if url_match else None
            
            # Try to match with Lighthouse data
            if domain:
                # Try different URL variations to match with Lighthouse data
                possible_urls = [
                    f"https://{domain}/",
                    f"https://www.{domain}/"
                ]
                
                # Additional path match attempt
                path_match = re.search(r'\d+_[^_]+_(.+)\.png', filename)
                if path_match:
                    path = path_match.group(1).replace('_', '/')
                    if path != "homepage":
                        # Add URLs with paths
                        possible_urls.extend([
                            f"https://{domain}/{path}",
                            f"https://www.{domain}/{path}"
                        ])
                
                # Try to find a matching URL in the Lighthouse data
                for url in possible_urls:
                    if url in lighthouse_reports:
                        lighthouse_data = lighthouse_reports[url]
                        print(f"Found matching Lighthouse data for {filename}")
                        break
            
            # Save results
            page_name = page_type.lower().replace(" ", "_")
            output_path = save_page_analysis_results(
                results, 
                page_name, 
                self.page_analysis_dir, 
                format=save_format,
                lighthouse_data=lighthouse_data
            )
            output_paths.append(output_path)
            
            print(f"Page analysis saved to: {output_path}")
        
        return output_paths

    def analyze_single_file(
        self, 
        file_path: str,
        context: Dict[str, Any] = None,
        save_format: str = "html"
    ) -> str:
        """
        Analyze a single screenshot file.
        
        Args:
            file_path (str): Path to the screenshot file
            context (Dict[str, Any]): Context information about the organization
            save_format (str): Format to save results (json or html)
            
        Returns:
            str: Path to the analysis results file
        """
        # Default context if none provided
        if context is None:
            context = {
                "org_name": "Edinburgh Peace Institute",
                "org_type": "non-profit",
                "org_purpose": "To encourage donations and sign-ups for trainings"
            }
        
        if not os.path.exists(file_path):
            print(f"File does not exist: {file_path}")
            return ""
        
        print(f"Analyzing single file: {os.path.basename(file_path)}")
        
        # Determine page type from filename
        filename = os.path.basename(file_path)
        page_type = determine_page_type(filename)
        
        print(f"Detected page type: {page_type}")
        
        # Get prompt for individual page
        prompt = get_individual_page_analysis_prompt(page_type, context)
        
        # Get the API client
        api_client = get_api_client()
        
        # Set debug directory
        debug_dir = os.path.join(self.analysis_dir, "debug")
        os.makedirs(debug_dir, exist_ok=True)
        api_client.debug_dir = debug_dir
        
        # Analyze with API
        results = api_client.analyze([file_path], prompt)
        
        # Add metadata
        results.update({
            "analysis_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "screenshot": file_path,
            "page_type": page_type,
            "organization": context.get("org_name", "Unknown Organization"),
            "org_type": context.get("org_type", "Unknown Type"),
            "org_purpose": context.get("org_purpose", "Unknown Purpose")
        })
        
        # Look for corresponding Lighthouse data
        lighthouse_data = None
        
        # Check for Lighthouse data
        lighthouse_dir = os.path.join(self.output_dir, "lighthouse")
        if os.path.exists(lighthouse_dir):
            # Import here to avoid circular imports
            from ..lighthouse.report_trimmer import trim_lighthouse_report
            
            # Extract domain and path from filename
            url_match = re.search(r'\d+_([^_]+)_', filename)
            domain = url_match.group(1) if url_match else None
            
            path_match = re.search(r'\d+_[^_]+_(.+)\.png', filename)
            path = path_match.group(1) if path_match else "homepage"
            
            if domain:
                # Try different URL variations
                possible_urls = [
                    f"https://{domain}/",
                    f"https://www.{domain}/",
                    f"http://{domain}/",
                    f"http://www.{domain}/"
                ]
                
                # Add path variations if not homepage
                if path != "homepage":
                    path_for_url = path.replace('_', '/')
                    possible_urls.extend([
                        f"https://{domain}/{path_for_url}",
                        f"https://www.{domain}/{path_for_url}",
                        f"http://{domain}/{path_for_url}",
                        f"http://www.{domain}/{path_for_url}"
                    ])
                
                # Look for matching Lighthouse reports
                for lighthouse_file in os.listdir(lighthouse_dir):
                    if lighthouse_file.endswith(".json"):
                        try:
                            report_path = os.path.join(lighthouse_dir, lighthouse_file)
                            trimmed_report = trim_lighthouse_report(report_path)
                            
                            # Check if the report URL matches any of our possible URLs
                            report_url = trimmed_report.get("url", "")
                            if report_url in possible_urls:
                                lighthouse_data = trimmed_report
                                print(f"Found matching Lighthouse data: {lighthouse_file}")
                                break
                        except Exception as e:
                            print(f"Error processing Lighthouse report {lighthouse_file}: {e}")
        
        page_name = page_type.lower().replace(" ", "_")
        
        output_path = save_page_analysis_results(
            results, 
            page_name, 
            self.page_analysis_dir, 
            format=save_format,
            lighthouse_data=lighthouse_data
        )
        
        print(f"Single file analysis saved to: {output_path}")
        
        return output_path