"""
Report generation module for the website analyzer.

This module provides functionality for creating HTML reports from crawl data.
"""

import os
from datetime import datetime
from . import utils


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
        
        # Create HTML report
        with open(summary_path, 'w') as f:
            f.write(self._create_report_header())
            f.write(self._create_crawl_info_section(crawl_stats))
            
            # Add Lighthouse results if available
            if lighthouse_reports:
                f.write(self._create_lighthouse_section(lighthouse_reports))
            
            # Add screenshot sections
            if self.screenshot_capturer:
                f.write(self._create_screenshots_section("desktop", "Desktop View"))
                f.write(self._create_screenshots_section("tablet", "Tablet View"))
                f.write(self._create_screenshots_section("mobile", "Mobile View"))
            
            f.write(self._create_report_footer())
            
        print(f"Summary report created: {summary_path}")
        return summary_path
    
    def _create_report_header(self):
        """Create the HTML header section."""
        return """<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Website Analysis Summary</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        h1, h2, h3 {
            color: #2c3e50;
        }
        .summary-box {
            background-color: #f8f9fa;
            border-radius: 5px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th, td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #f2f2f2;
        }
        tr:hover {
            background-color: #f5f5f5;
        }
        .score {
            font-weight: bold;
        }
        .good {
            color: #27ae60;
        }
        .average {
            color: #f39c12;
        }
        .poor {
            color: #e74c3c;
        }
        .screenshot-gallery {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .screenshot-item {
            border: 1px solid #ddd;
            border-radius: 4px;
            overflow: hidden;
        }
        .screenshot-item img {
            width: 100%;
            height: auto;
            display: block;
        }
        .screenshot-caption {
            padding: 10px;
            background: #f8f9fa;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Website Analysis Summary</h1>
"""
    
    def _create_crawl_info_section(self, crawl_stats):
        """Create the crawl information section."""
        start_url = crawl_stats.get('start_url', 'Unknown')
        duration = crawl_stats.get('duration', 0)
        pages_crawled = crawl_stats.get('pages_crawled', 0)
        
        return f"""
        <div class="summary-box">
            <h2>Crawl Information</h2>
            <p><strong>Website:</strong> {start_url}</p>
            <p><strong>Date:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            <p><strong>Pages Crawled:</strong> {pages_crawled}</p>
            <p><strong>Duration:</strong> {duration:.2f} seconds</p>
        </div>
"""
    
    def _create_lighthouse_section(self, lighthouse_reports):
        """Create the Lighthouse results section."""
        result = """
        <div class="summary-box">
            <h2>Lighthouse Audit Results</h2>
            <table>
                <thead>
                    <tr>
                        <th>Page</th>
                        <th>Performance</th>
                        <th>Accessibility</th>
                        <th>Best Practices</th>
                        <th>SEO</th>
                        <th>Report</th>
                    </tr>
                </thead>
                <tbody>
"""
        
        for report in lighthouse_reports:
            performance_class = utils.get_score_class(report['performance'])
            accessibility_class = utils.get_score_class(report['accessibility'])
            best_practices_class = utils.get_score_class(report['best_practices'])
            seo_class = utils.get_score_class(report['seo'])
            
            result += f"""
                    <tr>
                        <td>{report['url']}</td>
                        <td class="score {performance_class}">{report['performance']:.1f}%</td>
                        <td class="score {accessibility_class}">{report['accessibility']:.1f}%</td>
                        <td class="score {best_practices_class}">{report['best_practices']:.1f}%</td>
                        <td class="score {seo_class}">{report['seo']:.1f}%</td>
                        <td><a href="lighthouse/{report['html_report']}" target="_blank">View Report</a></td>
                    </tr>
"""
        
        result += """
                </tbody>
            </table>
        </div>
"""
        return result
    
    def _create_screenshots_section(self, device_type, section_title):
        """Create a screenshots section for a specific device type."""
        if not self.screenshot_capturer:
            return ""
            
        screenshots = self.screenshot_capturer.get_screenshot_paths(device_type)
        if not screenshots:
            return ""
            
        result = f"""
        <h2>Screenshot Preview</h2>
        
        <h3>{section_title}</h3>
        <div class="screenshot-gallery">
"""
        
        # Add screenshots (limit to 6)
        for i, screenshot in enumerate(screenshots[:6]):
            filename = os.path.basename(screenshot)
            relative_path = os.path.join("screenshots", device_type, filename)
            
            result += f"""
            <div class="screenshot-item">
                <img src="{relative_path}" alt="{device_type.capitalize()} screenshot {i+1}">
                <div class="screenshot-caption">{filename}</div>
            </div>
"""
        
        result += """
        </div>
"""
        return result
    
    def _create_report_footer(self):
        """Create the HTML footer section."""
        return """
    </div>
</body>
</html>
"""