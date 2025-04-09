"""
Lighthouse audit module for the website analyzer.

This module provides functionality for running Google Lighthouse audits on web pages.
"""

import os
import json
import subprocess
from . import utils


class LighthouseAuditor:
    """
    Runs Lighthouse audits on web pages.
    """
    
    def __init__(self, output_dir):
        """
        Initialize the LighthouseAuditor with configuration options.
        
        Args:
            output_dir (str): Directory to save Lighthouse reports
        """
        self.output_dir = output_dir
        
        # Directory for Lighthouse reports
        self.lighthouse_dir = os.path.join(self.output_dir, "lighthouse")
        os.makedirs(self.lighthouse_dir, exist_ok=True)
    
    def audit(self, url, page_number):
        """
        Run a Lighthouse audit for the given URL.
        
        Args:
            url (str): URL to audit
            page_number (int): Page number for ordering
            
        Returns:
            dict: Audit results or None if failed
        """
        try:
            filename = utils.create_filename_from_url(url, page_number)
            html_report_path = os.path.join(self.lighthouse_dir, f"{filename}.html")
            json_report_path = os.path.join(self.lighthouse_dir, f"{filename}.json")
            
            print(f"Running Lighthouse audit for {url}...")
            
            # Run Lighthouse using Node.js CLI
            # Requires lighthouse to be installed globally: npm install -g lighthouse
            command = [
                "lighthouse", 
                url, 
                "--output=html,json", 
                f"--output-path={html_report_path}", 
                "--chrome-flags=\"--headless --no-sandbox --disable-gpu\"",
                "--quiet"
            ]
            
            # Also capture mobile metrics 
            command.append("--emulated-form-factor=mobile")
                
            process = subprocess.run(
                " ".join(command),
                shell=True,
                capture_output=True,
                text=True
            )
            
            if process.returncode != 0:
                print(f"Error running Lighthouse: {process.stderr}")
                return None
            
            # Rename the JSON file to match our naming convention (Lighthouse adds .report.json)
            if os.path.exists(f"{html_report_path}.report.json"):
                os.rename(f"{html_report_path}.report.json", json_report_path)
            
            print(f"Lighthouse audit completed: {html_report_path}")
            
            # Extract and return metrics
            if os.path.exists(json_report_path):
                try:
                    with open(json_report_path, 'r') as f:
                        lighthouse_data = json.load(f)
                    
                    # Extract key metrics
                    performance = lighthouse_data['categories']['performance']['score'] * 100
                    accessibility = lighthouse_data['categories']['accessibility']['score'] * 100
                    best_practices = lighthouse_data['categories']['best-practices']['score'] * 100
                    seo = lighthouse_data['categories']['seo']['score'] * 100
                    
                    print(f"Performance: {performance:.1f}%, Accessibility: {accessibility:.1f}%, Best Practices: {best_practices:.1f}%, SEO: {seo:.1f}%")
                    
                    return {
                        'url': url,
                        'performance': performance,
                        'accessibility': accessibility,
                        'best_practices': best_practices,
                        'seo': seo,
                        'html_report': f"{filename}.html",
                        'json_report': f"{filename}.json"
                    }
                except Exception as e:
                    print(f"Error parsing Lighthouse results: {e}")
                    return None
            
            return None
        except Exception as e:
            print(f"Error running Lighthouse audit for {url}: {e}")
            return None
    
    def get_all_reports(self):
        """
        Get all Lighthouse reports.
        
        Returns:
            list: List of Lighthouse report data
        """
        reports = []
        
        if not os.path.exists(self.lighthouse_dir):
            return reports
            
        for filename in os.listdir(self.lighthouse_dir):
            if filename.endswith(".json"):
                try:
                    with open(os.path.join(self.lighthouse_dir, filename), 'r') as f:
                        data = json.load(f)
                        
                        # Get URL from the report
                        url = data.get('requestedUrl', 'Unknown URL')
                        
                        # Extract scores
                        performance = data['categories']['performance']['score'] * 100
                        accessibility = data['categories']['accessibility']['score'] * 100
                        best_practices = data['categories']['best-practices']['score'] * 100
                        seo = data['categories']['seo']['score'] * 100
                        
                        # Get HTML report name
                        html_report = filename.replace('.json', '.html')
                        
                        reports.append({
                            'url': url,
                            'performance': performance,
                            'accessibility': accessibility,
                            'best_practices': best_practices,
                            'seo': seo,
                            'html_report': html_report,
                            'json_report': filename
                        })
                except Exception as e:
                    print(f"Error parsing lighthouse data from {filename}: {e}")
        
        return reports