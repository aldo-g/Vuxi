"""
Utility functions for screenshot analysis.
"""
from .file_utils import collect_desktop_screenshots
from .html_generator import save_analysis_results, save_page_analysis_results
from .markdown_utils import markdown_to_html

__all__ = [
    'collect_desktop_screenshots',
    'save_analysis_results',
    'save_page_analysis_results',
    'markdown_to_html'
]