"""
Core analyzer module for screenshot analysis.
"""
import os
import json
from datetime import datetime
from typing import List, Dict, Any, Optional

from .api_clients import get_api_client
from .prompts import (
    get_desktop_analysis_prompt,
    get_individual_page_analysis_prompt,
    get_formatting_prompt,
    get_html_generation_prompt
)
from .page_detector import determine_page_type
from .utils.file_utils import collect_desktop_screenshots
from .utils.html_generator import (
    save_analysis_results,
    save_page_analysis_results
)
from ..common.constants import USE_TWO_STAGE_ANALYSIS

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
        
        if USE_TWO_STAGE_ANALYSIS:
            # Use two-stage analysis
            return self._two_stage_analysis(screenshots, prompt, context, save_format)
        else:
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
    
    def _two_stage_analysis(
        self, 
        screenshots: List[str], 
        prompt: str, 
        context: Dict[str, Any], 
        save_format: str
    ) -> str:
        """
        Perform two-stage analysis: first analyze, then format.
        
        Args:
            screenshots (List[str]): List of screenshot paths
            prompt (str): Analysis prompt
            context (Dict[str, Any]): Context information about the organization
            save_format (str): Format to save results
            
        Returns:
            str: Path to the analysis results file
        """
        # Get API clients
        analysis_client = get_api_client(tier="high")
        formatting_client = get_api_client(tier="standard")
        
        # Stage 1: In-depth analysis
        print("Stage 1: Performing in-depth analysis...")
        raw_results = analysis_client.analyze(screenshots, prompt)
        
        if raw_results["status"] != "success":
            print(f"Analysis failed: {raw_results.get('error', 'Unknown error')}")
            return ""
        
        # Stage 2: Formatting for structured data
        print("Stage 2: Formatting analysis results...")
        formatting_prompt = get_formatting_prompt()
        formatted_results = formatting_client.format(raw_results["results"], formatting_prompt)
        
        # If formatting was successful and returned JSON data
        if formatted_results["status"] == "success" and "data" in formatted_results:
            # Combine results
            final_results = {
                **raw_results,
                "structured_data": formatted_results["data"],
                "analysis_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "screenshots_analyzed": len(screenshots),
                "organization": context.get("org_name", "Unknown Organization"),
                "org_type": context.get("org_type", "Unknown Type"),
                "org_purpose": context.get("org_purpose", "Unknown Purpose")
            }
            
            # Save raw data for debugging
            debug_dir = os.path.join(self.analysis_dir, "debug")
            os.makedirs(debug_dir, exist_ok=True)
            
            with open(os.path.join(debug_dir, "raw_analysis.json"), "w") as f:
                json.dump(raw_results, f, indent=2)
            
            with open(os.path.join(debug_dir, "formatted_analysis.json"), "w") as f:
                json.dump(formatted_results, f, indent=2)
            
            # Save results
            output_path = save_analysis_results(
                final_results, 
                self.analysis_dir, 
                format=save_format
            )
            
            print(f"Two-stage analysis completed and saved to: {output_path}")
            return output_path
        else:
            # Formatting failed, use raw results
            print("Formatting failed, using raw analysis results.")
            
            raw_results.update({
                "analysis_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "screenshots_analyzed": len(screenshots),
                "organization": context.get("org_name", "Unknown Organization"),
                "org_type": context.get("org_type", "Unknown Type"),
                "org_purpose": context.get("org_purpose", "Unknown Purpose")
            })
            
            # Save results
            output_path = save_analysis_results(
                raw_results, 
                self.analysis_dir, 
                format=save_format
            )
            
            print(f"Raw analysis saved to: {output_path}")
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
        
        output_paths = []
        
        # Analyze each screenshot individually
        for i, screenshot in enumerate(screenshots):
            # Determine page type from filename
            filename = os.path.basename(screenshot)
            page_type = determine_page_type(filename)
            
            print(f"Analyzing page {i+1}/{len(screenshots)}: {page_type}")
            
            # Get prompt for individual page
            prompt = get_individual_page_analysis_prompt(page_type, context)
            
            if USE_TWO_STAGE_ANALYSIS:
                # Use two-stage analysis for individual page
                output_path = self._two_stage_page_analysis(
                    screenshot, 
                    prompt, 
                    page_type, 
                    context, 
                    save_format
                )
            else:
                # Get the API client
                api_client = get_api_client()
                
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
    
    def _two_stage_page_analysis(
        self, 
        screenshot: str, 
        prompt: str, 
        page_type: str, 
        context: Dict[str, Any], 
        save_format: str
    ) -> str:
        """
        Perform two-stage analysis for an individual page.
        
        Args:
            screenshot (str): Path to the screenshot
            prompt (str): Analysis prompt
            page_type (str): Type of page being analyzed
            context (Dict[str, Any]): Context information
            save_format (str): Format to save results
            
        Returns:
            str: Path to the analysis results file
        """
        # Get API clients
        analysis_client = get_api_client(tier="high")
        formatting_client = get_api_client(tier="standard")
        
        # Stage 1: In-depth analysis
        print("Stage 1: Performing in-depth page analysis...")
        raw_results = analysis_client.analyze([screenshot], prompt)
        
        if raw_results["status"] != "success":
            print(f"Page analysis failed: {raw_results.get('error', 'Unknown error')}")
            
            # Return basic error results
            error_results = {
                "status": "error",
                "error": raw_results.get("error", "Analysis failed"),
                "results": "Analysis failed. Please check the logs for details.",
                "analysis_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "screenshot": screenshot,
                "page_type": page_type,
                "organization": context.get("org_name", "Unknown Organization"),
                "org_type": context.get("org_type", "Unknown Type"),
                "org_purpose": context.get("org_purpose", "Unknown Purpose")
            }
            
            page_name = page_type.lower().replace(" ", "_")
            return save_page_analysis_results(
                error_results, 
                page_name, 
                self.page_analysis_dir, 
                format=save_format
            )
        
        # Stage 2: Formatting for structured data
        print("Stage 2: Formatting page analysis results...")
        formatting_prompt = get_formatting_prompt()
        formatted_results = formatting_client.format(raw_results["results"], formatting_prompt)
        
        # If formatting was successful and returned JSON data
        if formatted_results["status"] == "success" and "data" in formatted_results:
            # Combine results
            final_results = {
                **raw_results,
                "structured_data": formatted_results["data"],
                "analysis_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "screenshot": screenshot,
                "page_type": page_type,
                "organization": context.get("org_name", "Unknown Organization"),
                "org_type": context.get("org_type", "Unknown Type"),
                "org_purpose": context.get("org_purpose", "Unknown Purpose")
            }
            
            # Save raw data for debugging
            debug_dir = os.path.join(self.page_analysis_dir, "debug")
            os.makedirs(debug_dir, exist_ok=True)
            
            page_name = page_type.lower().replace(" ", "_")
            
            with open(os.path.join(debug_dir, f"{page_name}_raw_analysis.json"), "w") as f:
                json.dump(raw_results, f, indent=2)
            
            with open(os.path.join(debug_dir, f"{page_name}_formatted_analysis.json"), "w") as f:
                json.dump(formatted_results, f, indent=2)
            
            # Save results
            output_path = save_page_analysis_results(
                final_results, 
                page_name, 
                self.page_analysis_dir, 
                format=save_format
            )
            
            print(f"Two-stage page analysis completed and saved to: {output_path}")
            return output_path
        else:
            # Formatting failed, use raw results
            print("Formatting failed, using raw page analysis results.")
            
            raw_results.update({
                "analysis_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "screenshot": screenshot,
                "page_type": page_type,
                "organization": context.get("org_name", "Unknown Organization"),
                "org_type": context.get("org_type", "Unknown Type"),
                "org_purpose": context.get("org_purpose", "Unknown Purpose")
            })
            
            # Save results
            page_name = page_type.lower().replace(" ", "_")
            output_path = save_page_analysis_results(
                raw_results, 
                page_name, 
                self.page_analysis_dir, 
                format=save_format
            )
            
            print(f"Raw page analysis saved to: {output_path}")
            return output_path

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
        
        if USE_TWO_STAGE_ANALYSIS:
            # Use two-stage analysis for single file
            return self._two_stage_page_analysis(
                file_path, 
                prompt, 
                page_type, 
                context, 
                save_format
            )
        else:
            # Get the API client
            api_client = get_api_client()
            
            # Set debug directory
            debug_dir = os.path.join(self.analysis_dir, "debug")
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
            
            page_name = page_type.lower().replace(" ", "_")
            
            output_path = save_page_analysis_results(
                results, 
                page_name, 
                self.page_analysis_dir, 
                format=save_format
            )
            
            print(f"Single file analysis saved to: {output_path}")
            
            return output_path