"""
Core analyzer module for screenshot analysis.
"""
import os
from datetime import datetime
from typing import List, Dict, Any, Optional

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
        org_name: str = "the Edinburgh Peace Institute",
        save_format: str = "html"
    ) -> str:
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
        
        # Get the API client
        api_client = get_api_client()
        
        # Analyze screenshots with API
        results = api_client.analyze(screenshots, prompt)
        
        # Add analysis date and metadata
        results.update({
            "analysis_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "screenshots_analyzed": len(screenshots),
            "organization": org_name
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
        org_name: str = "the Edinburgh Peace Institute", 
        save_format: str = "html"
    ) -> List[str]:
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
        
        # Get the API client
        api_client = get_api_client()
        
        output_paths = []
        
        # Analyze each screenshot individually
        for i, screenshot in enumerate(screenshots):
            # Determine page type from filename
            filename = os.path.basename(screenshot)
            page_type = determine_page_type(filename)
            
            print(f"Analyzing page {i+1}/{len(screenshots)}: {page_type}")
            
            # Get prompt for individual page
            prompt = get_individual_page_analysis_prompt(page_type, {"org_name": org_name})
            
            # Analyze with API
            results = api_client.analyze([screenshot], prompt)
            
            # Add metadata
            results.update({
                "analysis_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "screenshot": screenshot,
                "page_type": page_type,
                "organization": org_name
            })
            
            # Save results
            page_name = page_type.lower().replace(" ", "_")
            output_path = save_page_analysis_results(
                results, 
                page_name, 
                self.page_analysis_dir, 
                format=save_format
            )
            output_paths.append(output_path)
            
            print(f"Page analysis saved to: {output_path}")
        
        return output_paths
    
    def analyze_single_file(
        self, 
        file_path: str,
        org_name: str = "the Edinburgh Peace Institute", 
        save_format: str = "html"
    ) -> str:
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
        
        print(f"Detected page type: {page_type}")
        
        # Get prompt for individual page
        prompt = get_individual_page_analysis_prompt(page_type, {"org_name": org_name})
        
        # Get the API client
        api_client = get_api_client()
        
        # Set debug directory
        debug_dir = os.path.join(self.analysis_dir, "debug")
        api_client.debug_dir = debug_dir
        
        # Analyze with API
        results = api_client.analyze([file_path], prompt)
        
        # Add metadata
        from datetime import datetime
        results.update({
            "analysis_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "screenshot": file_path,
            "page_type": page_type,
            "organization": org_name
        })
        
        # Save results
        # CHANGE THIS LINE:
        # page_name = f"single_{os.path.splitext(os.path.basename(file_path))[0]}"
        # TO THIS:
        page_name = page_type.lower().replace(" ", "_")
        
        output_path = save_page_analysis_results(
            results, 
            page_name, 
            self.page_analysis_dir, 
            format=save_format
        )
        
        print(f"Single file analysis saved to: {output_path}")
        
        return output_path