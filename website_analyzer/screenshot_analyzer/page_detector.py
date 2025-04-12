"""
Page type detection functionality for screenshot analysis.
"""
import re


def determine_page_type(filename: str) -> str:
    """
    Determine the page type from the screenshot filename.
    
    Args:
        filename (str): Screenshot filename
        
    Returns:
        str: Page type
    """
    # Extract page name from filename
    # Pattern: 000_domain_page.png
    match = re.search(r'\d+_[^_]+_(.+)\.png', filename)
    
    if match:
        page_path = match.group(1)
        
        # Handle special cases
        if page_path.lower() == "homepage":
            return "Home Page"
        elif "cart" in page_path.lower():
            return "Shopping Cart Page"
        elif "contact" in page_path.lower():
            return "Contact Page"
        elif "about" in page_path.lower():
            return "About Page"
        elif "training" in page_path.lower():
            return "Training Page"
        elif "project" in page_path.lower():
            return "Projects Page"
        elif "research" in page_path.lower():
            return "Research Page"
        
        # Convert path to readable format
        page_type = page_path.replace("_", " ").title()
        return f"{page_type} Page"
    
    return "Unknown Page"