"""
Screenshot capture module for the website analyzer.

This module provides functionality for capturing screenshots at multiple viewport sizes.
"""

import os
from . import utils


class ScreenshotCapturer:
    """
    Captures screenshots at multiple viewport sizes.
    """
    
    def __init__(self, output_dir):
        """
        Initialize the ScreenshotCapturer with configuration options.
        
        Args:
            output_dir (str): Directory to save screenshots
        """
        self.output_dir = output_dir
        
        # Create viewports for different device types
        self.viewports = [
            {"name": "mobile", "width": 375, "height": 667},
            {"name": "tablet", "width": 768, "height": 1024},
            {"name": "desktop", "width": 1440, "height": 900}
        ]
        
        # Directory for screenshots
        self.screenshots_dir = os.path.join(self.output_dir, "screenshots")
        os.makedirs(self.screenshots_dir, exist_ok=True)
        for viewport in self.viewports:
            os.makedirs(os.path.join(self.screenshots_dir, viewport["name"]), exist_ok=True)
    
    def capture_screenshot(self, page, url, viewport, page_number):
        """
        Capture a screenshot for a specific viewport and save it.
        
        Args:
            page: Playwright page object
            url (str): URL being captured
            viewport (dict): Viewport configuration
            page_number (int): Page number for filename
            
        Returns:
            dict: Information about the screenshot or None if failed
        """
        # Set the viewport
        page.set_viewport_size({"width": viewport["width"], "height": viewport["height"]})
        
        filename = utils.create_filename_from_url(url, page_number)
        filepath = os.path.join(self.screenshots_dir, viewport["name"], f"{filename}.png")
        
        # Take full page screenshot
        try:
            page.screenshot(path=filepath, full_page=True)
            print(f"Captured {viewport['name']} screenshot: {filepath}")
            
            return {
                'viewport': viewport["name"],
                'file': os.path.join("screenshots", viewport["name"], f"{filename}.png"),
                'filename': f"{filename}.png"
            }
        except Exception as e:
            print(f"Error capturing screenshot for {url} ({viewport['name']}): {e}")
            return None
    
    def capture(self, page, url, page_number):
        """
        Capture screenshots for all viewports.
        
        Args:
            page: Playwright page object
            url (str): URL to capture
            page_number (int): Page number for ordering
            
        Returns:
            list: List of screenshot information dictionaries
        """
        screenshots = []
        
        for viewport in self.viewports:
            screenshot = self.capture_screenshot(page, url, viewport, page_number)
            if screenshot:
                screenshots.append(screenshot)
        
        return screenshots
    
    def get_screenshot_paths(self, device_type):
        """
        Get all screenshot paths for a specific device type.
        
        Args:
            device_type (str): Device type (mobile, tablet, desktop)
            
        Returns:
            list: List of screenshot paths
        """
        device_dir = os.path.join(self.screenshots_dir, device_type)
        if not os.path.exists(device_dir):
            return []
        
        return [os.path.join(device_dir, f) for f in os.listdir(device_dir) if f.endswith('.png')]