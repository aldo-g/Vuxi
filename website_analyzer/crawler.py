"""
Web crawler module for the website analyzer.

This module provides functionality for crawling websites and extracting links.
"""

import time
from datetime import datetime
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

from . import utils


class WebCrawler:
    """
    Handles crawling websites and extracting links.
    """
    
    def __init__(self, max_pages=50, timeout=30000, wait_time=2):
        """
        Initialize the WebCrawler with configuration options.
        
        Args:
            max_pages (int): Maximum number of pages to crawl
            timeout (int): Page load timeout in milliseconds
            wait_time (int): Time to wait after page load in seconds
        """
        self.max_pages = max_pages
        self.timeout = timeout
        self.wait_time = wait_time
        self.visited_urls = set()
        self.urls_to_visit = []
    
    def extract_links(self, page, base_url):
        """
        Extract all links from the current page that belong to the same domain.
        
        Args:
            page: Playwright page object
            base_url (str): Base URL for domain matching
            
        Returns:
            list: List of valid links to crawl
        """
        links = page.evaluate("""() => {
            const links = Array.from(document.querySelectorAll('a[href]'));
            return links.map(link => link.href);
        }""")
        
        valid_links = []
        for link in links:
            # Skip non-HTTP links, anchors, etc.
            if not link.startswith(('http://', 'https://')):
                continue
                
            # Skip external links
            if not utils.is_same_domain(base_url, link):
                continue
            
            # Skip downloadable files
            if utils.is_downloadable_file(link):
                continue
                
            # Normalize and add if not visited
            normalized_link = utils.normalize_url(link)
            if normalized_link not in self.visited_urls and normalized_link not in self.urls_to_visit:
                valid_links.append(normalized_link)
                
        return valid_links
    
    def crawl(self, start_url, screenshot_capturer=None, lighthouse_auditor=None):
        """
        Crawl the website starting from the given URL.
        
        Args:
            start_url (str): Starting URL to crawl
            screenshot_capturer: Screenshot capturer instance or None
            lighthouse_auditor: Lighthouse auditor instance or None
            
        Returns:
            dict: Statistics about the crawl
        """
        start_time = datetime.now()
        print(f"Starting crawl of {start_url} at {start_time}")
        
        # Normalize and add the start URL
        start_url = utils.normalize_url(start_url)
        self.urls_to_visit.append(start_url)
        
        crawl_stats = {
            'start_time': start_time,
            'start_url': start_url,
            'pages_crawled': 0,
            'pages': []
        }
        
        with sync_playwright() as playwright:
            # Launch the browser
            browser = playwright.chromium.launch(headless=True)
            
            page_count = 0
            while self.urls_to_visit and page_count < self.max_pages:
                # Get the next URL to visit
                current_url = self.urls_to_visit.pop(0)
                if current_url in self.visited_urls:
                    continue
                
                # Skip downloadable files
                if utils.is_downloadable_file(current_url):
                    print(f"Skipping downloadable file: {current_url}")
                    self.visited_urls.add(current_url)  # Mark as visited so we don't try again
                    continue
                
                print(f"\nProcessing page {page_count + 1}/{self.max_pages}: {current_url}")
                
                # Create a new page context
                context = browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36")
                page = context.new_page()
                
                page_info = {
                    'url': current_url,
                    'number': page_count,
                    'screenshots': [],
                    'lighthouse': None
                }
                
                try:
                    # Navigate to the page
                    response = page.goto(current_url, timeout=self.timeout, wait_until="networkidle")
                    
                    if not response or response.status >= 400:
                        print(f"Failed to load {current_url}: Status code {response.status if response else 'unknown'}")
                        context.close()
                        continue
                    
                    # Wait for additional time to ensure page is fully loaded
                    page.wait_for_timeout(self.wait_time * 1000)
                    
                    # Capture screenshots if a capturer is provided
                    if screenshot_capturer:
                        page_info['screenshots'] = screenshot_capturer.capture(page, current_url, page_count)
                    
                    # Run Lighthouse audit if an auditor is provided
                    if lighthouse_auditor:
                        page_info['lighthouse'] = lighthouse_auditor.audit(current_url, page_count)
                    
                    # Extract links for further crawling
                    new_links = self.extract_links(page, start_url)
                    self.urls_to_visit.extend(new_links)
                    print(f"Found {len(new_links)} new links on this page")
                    
                    # Mark as visited
                    self.visited_urls.add(current_url)
                    crawl_stats['pages'].append(page_info)
                    page_count += 1
                    
                except PlaywrightTimeoutError:
                    print(f"Timeout while loading {current_url}")
                except Exception as e:
                    print(f"Error processing {current_url}: {e}")
                finally:
                    context.close()
                    
            browser.close()
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        crawl_stats['end_time'] = end_time
        crawl_stats['duration'] = duration
        crawl_stats['pages_crawled'] = page_count
        
        print(f"\nCrawl completed at {end_time}")
        print(f"Duration: {duration:.2f} seconds")
        print(f"Pages crawled: {page_count}")
        
        return crawl_stats