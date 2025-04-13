"""
Screenshot analysis module for the website analyzer.

This module provides functionality for analyzing screenshots for UX/UI design issues.
"""

import os
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple

from .screenshot_analyzer.api_clients import get_api_client
from .screenshot_analyzer.prompts import (
    get_desktop_analysis_prompt,
    get_individual_page_analysis_prompt
)
from .screenshot_analyzer.page_detector import determine_page_type
from .screenshot_analyzer.utils.file_utils import collect_desktop_screenshots
from .screenshot_analyzer.utils.markdown_utils import markdown_to_html
from .reporting.template_system import render_template


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
        
        # Debug directory for API calls
        self.debug_dir = os.path.join(self.analysis_dir, "debug")
        os.makedirs(self.debug_dir, exist_ok=True)
    
    def analyze_desktop_screenshots(self, org_name: str = "the Edinburgh Peace Institute",
                                  save_format: str = "html") -> str:
        """
        Analyze desktop screenshots for UX/UI design issues.
        
        Args:
            org_name (str): Name of the organization for context
            save_format (str): Format to save results (json or html)
            
        Returns:
            str: Path to the analysis results file
        """
        # Collect desktop screenshots
        screenshots = collect_desktop_screenshots(self.screenshots_dir)
        if not screenshots:
            print("No desktop screenshots found")
            return ""
        
        print(f"Analyzing {len(screenshots)} desktop screenshots...")
        
        # Get prompt with context
        prompt = get_desktop_analysis_prompt({"org_name": org_name})
        
        # Get API client and set debug directory
        api_client = get_api_client()
        api_client.debug_dir = self.debug_dir
        
        # Analyze screenshots
        results = api_client.analyze(screenshots, prompt)
        
        # Add analysis date
        results["analysis_date"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        results["screenshots_analyzed"] = len(screenshots)
        results["organization"] = org_name
        
        # Save results
        if save_format == "json":
            output_path = self._save_json_analysis(results)
        else:
            output_path = self._save_html_analysis(results)
        
        print(f"Screenshot analysis saved to: {output_path}")
        
        return output_path
    
    def analyze_individual_pages(self, org_name: str = "the Edinburgh Peace Institute", 
                               save_format: str = "html") -> List[str]:
        """
        Analyze individual page screenshots separately.
        
        Args:
            org_name (str): Name of the organization for context
            save_format (str): Format to save results (json or html)
            
        Returns:
            List[str]: List of paths to the analysis results files
        """
        # Collect desktop screenshots
        screenshots = collect_desktop_screenshots(self.screenshots_dir)
        if not screenshots:
            print("No desktop screenshots found")
            return []
        
        print(f"Analyzing {len(screenshots)} individual pages...")
        
        output_paths = []
        
        # Get API client and set debug directory
        api_client = get_api_client()
        api_client.debug_dir = self.debug_dir
        
        # Analyze each screenshot individually
        for i, screenshot in enumerate(screenshots):
            # Determine page type from filename
            filename = os.path.basename(screenshot)
            page_type = determine_page_type(filename)
            
            print(f"Analyzing page {i+1}/{len(screenshots)}: {page_type}")
            
            # Get prompt for individual page
            prompt = get_individual_page_analysis_prompt(page_type, {"org_name": org_name})
            
            # Analyze the screenshot
            results = api_client.analyze([screenshot], prompt)
            
            # Add metadata
            results["analysis_date"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            results["screenshot"] = screenshot
            results["page_type"] = page_type
            results["organization"] = org_name
            
            # Save results
            page_name = page_type.lower().replace(" ", "_")
            
            if save_format == "json":
                output_path = self._save_json_page_analysis(results, page_name)
            else:
                output_path = self._save_html_page_analysis(results, page_name)
                
            output_paths.append(output_path)
            
            print(f"Page analysis saved to: {output_path}")
        
        return output_paths
    
    def analyze_single_file(self, file_path: str, org_name: str = "the Edinburgh Peace Institute", 
                          save_format: str = "html") -> str:
        """
        Analyze a single screenshot file.
        
        Args:
            file_path (str): Path to the screenshot file
            org_name (str): Name of the organization for context
            save_format (str): Format to save results (json or html)
            
        Returns:
            str: Path to the analysis results file
        """
        if not os.path.exists(file_path):
            print(f"File does not exist: {file_path}")
            return ""
            
        print(f"Analyzing single file: {os.path.basename(file_path)}")
        
        # Determine page type from filename
        filename = os.path.basename(file_path)
        page_type = determine_page_type(filename)
        
        # Get prompt for individual page
        prompt = get_individual_page_analysis_prompt(page_type, {"org_name": org_name})
        
        # Get API client and set debug directory
        api_client = get_api_client()
        api_client.debug_dir = self.debug_dir
        
        # Analyze the screenshot
        results = api_client.analyze([file_path], prompt)
        
        # Add metadata
        results["analysis_date"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        results["screenshot"] = file_path
        results["page_type"] = page_type
        results["organization"] = org_name
        
        # Save results
        page_name = page_type.lower().replace(" ", "_")
        
        if save_format == "json":
            output_path = self._save_json_page_analysis(results, page_name)
        else:
            output_path = self._save_html_page_analysis(results, page_name)
        
        print(f"Single file analysis saved to: {output_path}")
        
        return output_path
    
    def _save_json_analysis(self, results: Dict[str, Any]) -> str:
        """Save analysis results to a JSON file."""
        import json
        output_path = os.path.join(self.analysis_dir, "desktop_screenshot_analysis.json")
        with open(output_path, "w") as f:
            json.dump(results, f, indent=2)
        return output_path
    
    def _save_html_analysis(self, results: Dict[str, Any]) -> str:
        """Save analysis results to an HTML file."""
        output_path = os.path.join(self.analysis_dir, "desktop_screenshot_analysis.html")
        
        # Convert markdown to HTML
        analysis_text = results.get("results", "No results available")
        analysis_html = markdown_to_html(analysis_text)
        
        # Create context for template
        context = {
            "organization": results.get('organization', 'Unknown'),
            "screenshots_analyzed": results.get('screenshots_analyzed', 0),
            "screenshot_count": results.get('screenshot_count', 0),
            "analysis_date": results.get('analysis_date', 'Unknown'),
            "status": results.get('status', 'unknown'),
            "error": results.get('error', None),
            "analysis_html": analysis_html
        }
        
        # Render template
        html_content = render_template('desktop_analysis.html', context)
        
        with open(output_path, "w") as f:
            f.write(html_content)
        
        return output_path
    
    def _save_json_page_analysis(self, results: Dict[str, Any], page_name: str) -> str:
        """Save page analysis results to a JSON file."""
        import json
        output_path = os.path.join(self.page_analysis_dir, f"{page_name}_analysis.json")
        with open(output_path, "w") as f:
            json.dump(results, f, indent=2)
        return output_path
    
    def _save_html_page_analysis(self, results: Dict[str, Any], page_name: str) -> str:
        """Save page analysis results to an HTML file."""
        output_path = os.path.join(self.page_analysis_dir, f"{page_name}_analysis.html")
        
        # Convert markdown to HTML
        analysis_text = results.get("results", "No results available")
        analysis_html = markdown_to_html(analysis_text)
        
        # Get screenshot info
        screenshot = results.get("screenshot", "")
        screenshot_filename = os.path.basename(screenshot) if screenshot else ""
        screenshot_rel_path = f"../screenshots/desktop/{screenshot_filename}" if screenshot else ""
        
        # Create context for template
        context = {
            "organization": results.get('organization', 'Unknown'),
            "page_type": results.get('page_type', 'Unknown Page'),
            "analysis_date": results.get('analysis_date', 'Unknown'),
            "status": results.get('status', 'unknown'),
            "error": results.get('error', None),
            "analysis_html": analysis_html,
            "screenshot_rel_path": screenshot_rel_path
        }
        
        # Render template
        html_content = render_template('page_analysis.html', context)
        
        with open(output_path, "w") as f:
            f.write(html_content)
        
        return output_path