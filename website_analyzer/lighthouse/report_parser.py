"""
Parser for Lighthouse audit reports.
"""
import json
import os
from typing import List, Dict, Any, Optional


def parse_lighthouse_report(report_path: str) -> Optional[Dict[str, Any]]:
    """
    Parse a Lighthouse JSON report file.
    
    Args:
        report_path (str): Path to the Lighthouse JSON report
        
    Returns:
        Dict[str, Any]: Parsed report data or None if error
    """
    try:
        with open(report_path, 'r') as f:
            data = json.load(f)
        
        # Extract key metrics
        url = data.get('requestedUrl', 'Unknown URL')
        performance = data['categories']['performance']['score'] * 100
        accessibility = data['categories']['accessibility']['score'] * 100
        best_practices = data['categories']['best-practices']['score'] * 100
        seo = data['categories']['seo']['score'] * 100
        
        # Get HTML report name
        html_report = os.path.basename(report_path).replace('.json', '.html')
        
        return {
            'url': url,
            'performance': performance,
            'accessibility': accessibility,
            'best_practices': best_practices,
            'seo': seo,
            'html_report': html_report,
            'json_report': os.path.basename(report_path)
        }
    except Exception as e:
        print(f"Error parsing Lighthouse report {report_path}: {e}")
        return None
