"""
Utility functions for the website analyzer.

This module provides common utility functions used across the website analyzer,
including URL normalization, domain checking, and filename generation.
"""

import re
import urllib.parse


def is_same_domain(base_url, url_to_check):
    """
    Check if the URL belongs to the same domain as the base URL.
    
    Args:
        base_url (str): The base URL to compare against
        url_to_check (str): The URL to check
        
    Returns:
        bool: True if the URLs have the same domain, False otherwise
    """
    base_domain = urllib.parse.urlparse(base_url).netloc.lower()
    check_domain = urllib.parse.urlparse(url_to_check).netloc.lower()
    
    # Handle www vs non-www
    base_domain = base_domain.replace("www.", "")
    check_domain = check_domain.replace("www.", "")
    
    return base_domain == check_domain


def normalize_url(url):
    """
    Normalize URLs to avoid duplicates with trailing slashes, www, etc.
    
    Args:
        url (str): The URL to normalize
        
    Returns:
        str: The normalized URL
    """
    if not url:
        return ""
        
    # Parse the URL
    parsed = urllib.parse.urlparse(url)
    
    # Convert scheme and netloc to lowercase
    scheme = parsed.scheme.lower()
    netloc = parsed.netloc.lower()
    
    # Remove 'www.' from netloc if present
    if netloc.startswith("www."):
        netloc = netloc[4:]
    
    # Handle path
    path = parsed.path
    
    # Add trailing slash to empty path
    if not path:
        path = "/"
    
    # Remove trailing slash if not root path
    if path.endswith("/") and len(path) > 1:
        path = path[:-1]
    
    # Reconstruct URL without fragments and with all normalizations
    normalized = urllib.parse.urlunparse((
        scheme,
        netloc,
        path,
        parsed.params,
        parsed.query,
        ""  # Remove fragment
    ))
    
    # Special handling for the homepage - always consistent representation
    # If the URL is just domain (with or without trailing slash), make it consistent
    root_paths = ['/', '']
    if parsed.path in root_paths and not parsed.params and not parsed.query:
        normalized = f"{scheme}://{netloc}/"
    
    return normalized


def is_downloadable_file(url):
    """
    Check if the URL points to a file that should be skipped during crawling.
    
    Args:
        url (str): The URL to check
        
    Returns:
        bool: True if the URL points to a downloadable file, False otherwise
    """
    # Common file extensions to skip
    file_extensions = [
        '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', 
        '.zip', '.rar', '.tar', '.gz', '.mp4', '.mp3', '.avi', '.mov',
        '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'
    ]
    
    parsed_url = urllib.parse.urlparse(url)
    path = parsed_url.path.lower()
    
    # Check if the URL path ends with any of the file extensions
    return any(path.endswith(ext) for ext in file_extensions)


def create_filename_from_url(url, page_number):
    """
    Create a sanitized filename based directly on the URL.
    
    Args:
        url (str): The URL to create a filename from
        page_number (int): Page number for ordering
        
    Returns:
        str: A sanitized filename
    """
    parsed_url = urllib.parse.urlparse(url)
    
    # Get domain without www and TLD
    domain = parsed_url.netloc
    domain = domain.replace("www.", "")
    
    # Get path - replace slashes with underscores
    path = parsed_url.path.strip("/")
    if path:
        path = path.replace("/", "_")
    else:
        path = "homepage"
        
    # Handle query parameters
    query = ""
    if parsed_url.query:
        # Take just first few chars of query to avoid overly long filenames
        query = "_" + parsed_url.query.replace("&", "_").replace("=", "-")
        if len(query) > 30:
            query = query[:30] + "..."
    
    # Combine components with page number for uniqueness and sorting
    filename = f"{page_number:03d}_{domain}_{path}{query}"
    
    # Sanitize filename (remove any characters that might cause issues)
    filename = re.sub(r'[\\/*?:"<>|]', '', filename)
    
    # Ensure the filename isn't too long for the filesystem
    if len(filename) > 200:
        # Create a hash of the URL for a shorter but still unique name
        url_hash = hash(url) % 100000
        filename = f"{page_number:03d}_{domain}_{url_hash}"
        
    return filename


def get_score_class(score):
    """
    Get CSS class based on Lighthouse score value.
    
    Args:
        score (float): The score value (0-100)
        
    Returns:
        str: CSS class name representing the score quality
    """
    if score >= 90:
        return "good"
    elif score >= 50:
        return "average"
    else:
        return "poor"