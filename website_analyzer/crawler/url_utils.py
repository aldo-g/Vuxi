"""
URL utility functions for the website crawler.
"""

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