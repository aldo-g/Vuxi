"""
Report generation module for the website analyzer.
"""

import os
from datetime import datetime
from .template_system import render_template, COMMON_STYLES
from ..common.url_utils import get_score_class

class ReportGenerator:
    """
    Creates HTML reports from crawl data.
    """
    
    def __init__(self, output_dir, screenshot_capturer=None, lighthouse_auditor=None):
        """
        Initialize the ReportGenerator with configuration options.
        
        Args:
            output_dir (str): Directory to save reports
            screenshot_capturer: Screenshot capturer instance or None
            lighthouse_auditor: Lighthouse auditor instance or None
        """
        self.output_dir = output_dir
        self.screenshot_capturer = screenshot_capturer
        self.lighthouse_auditor = lighthouse_auditor
    
    def generate(self, crawl_stats):
        """
        Generate an HTML report from crawl statistics.
        
        Args:
            crawl_stats (dict): Statistics from the crawl
            
        Returns:
            str: Path to the generated report
        """
        summary_path = os.path.join(self.output_dir, "summary.html")
        
        # Get lighthouse data if available
        lighthouse_reports = []
        if self.lighthouse_auditor:
            lighthouse_reports = self.lighthouse_auditor.get_all_reports()
        
        # Get screenshot data for each device type
        devices = []
        if self.screenshot_capturer:
            for device_type in ["desktop", "tablet", "mobile"]:
                screenshots = self.screenshot_capturer.get_screenshot_paths(device_type)
                if screenshots:
                    # Format screenshots for template
                    formatted_screenshots = []
                    for screenshot in screenshots:
                        filename = os.path.basename(screenshot)
                        rel_path = os.path.join("screenshots", device_type, filename)
                        formatted_screenshots.append({
                            "path": rel_path,
                            "filename": filename
                        })
                    
                    devices.append({
                        "name": device_type,
                        "screenshots": formatted_screenshots
                    })
        
        # Create template context
        context = {
            "start_url": crawl_stats.get('start_url', 'Unknown'),
            "analysis_date": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            "pages_crawled": crawl_stats.get('pages_crawled', 0),
            "duration": crawl_stats.get('duration', 0),
            "lighthouse_reports": lighthouse_reports,
            "devices": devices,
            "get_score_class": get_score_class,
            "common_styles": COMMON_STYLES
        }
        
        # Render template
        html_content = render_template('summary.html', context)
        
        # Write to file
        with open(summary_path, 'w') as f:
            f.write(html_content)
            
        print(f"Summary report created: {summary_path}")
        return summary_path