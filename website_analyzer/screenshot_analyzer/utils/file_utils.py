"""
File utility functions for screenshot analysis.
"""
import os
from typing import List


def collect_desktop_screenshots(screenshots_dir: str) -> List[str]:
    """
    Collect all desktop screenshots from the output directory.
    
    Args:
        screenshots_dir (str): Directory containing screenshots
        
    Returns:
        List[str]: List of paths to desktop screenshots
    """
    desktop_dir = os.path.join(screenshots_dir, "desktop")
    if not os.path.exists(desktop_dir):
        return []
    
    return [os.path.join(desktop_dir, f) for f in os.listdir(desktop_dir) if f.endswith('.png')]