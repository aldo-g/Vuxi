import os
import json
import argparse
import subprocess
import time
import re
import urllib.parse
from datetime import datetime
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError


class WebsiteScraper:
    def __init__(self, output_dir="website_analysis", max_pages=50, timeout=30000, wait_time=2, lighthouse=True):
        """
        Initialize the WebsiteScraper with configuration options.
        
        Args:
            output_dir (str): Directory to save screenshots and reports
            max_pages (int): Maximum number of pages to crawl
            timeout (int): Page load timeout in milliseconds
            wait_time (int): Time to wait after page load in seconds
            lighthouse (bool): Whether to run Lighthouse audits
        """
        self.output_dir = output_dir
        self.max_pages = max_pages
        self.timeout = timeout
        self.wait_time = wait_time
        self.run_lighthouse = lighthouse
        self.visited_urls = set()
        self.urls_to_visit = []
        
        # Create viewports for different device types
        self.viewports = [
            {"name": "mobile", "width": 375, "height": 667},
            {"name": "tablet", "width": 768, "height": 1024},
            {"name": "desktop", "width": 1440, "height": 900}
        ]
        
        # Create output directory structure
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Directory for screenshots
        self.screenshots_dir = os.path.join(self.output_dir, "screenshots")
        os.makedirs(self.screenshots_dir, exist_ok=True)
        for viewport in self.viewports:
            os.makedirs(os.path.join(self.screenshots_dir, viewport["name"]), exist_ok=True)
        
        # Directory for Lighthouse reports
        if self.run_lighthouse:
            self.lighthouse_dir = os.path.join(self.output_dir, "lighthouse")
            os.makedirs(self.lighthouse_dir, exist_ok=True)

    def is_same_domain(self, base_url, url_to_check):
        """Check if the URL belongs to the same domain as the base URL."""
        base_domain = urllib.parse.urlparse(base_url).netloc
        check_domain = urllib.parse.urlparse(url_to_check).netloc
        return base_domain == check_domain

    def normalize_url(self, url):
        """Normalize URLs to avoid duplicates with trailing slashes, etc."""
        parsed = urllib.parse.urlparse(url)
        # Remove trailing slash
        path = parsed.path
        if path.endswith("/") and len(path) > 1:
            path = path[:-1]
        
        # Reconstruct URL without fragments
        normalized = urllib.parse.urlunparse((
            parsed.scheme,
            parsed.netloc,
            path,
            parsed.params,
            parsed.query,
            ""  # Remove fragment
        ))
        return normalized

    def extract_links(self, page, base_url):
        """Extract all links from the current page that belong to the same domain."""
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
            if not self.is_same_domain(base_url, link):
                continue
                
            # Normalize and add if not visited
            normalized_link = self.normalize_url(link)
            if normalized_link not in self.visited_urls and normalized_link not in self.urls_to_visit:
                valid_links.append(normalized_link)
                
        return valid_links

    def create_filename_from_url(self, url, page_number):
        """Create a sanitized filename based directly on the URL."""
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

    def capture_screenshot(self, page, url, viewport, page_number):
        """Capture a screenshot for a specific viewport and save it."""
        # Set the viewport
        page.set_viewport_size({"width": viewport["width"], "height": viewport["height"]})
        
        filename = self.create_filename_from_url(url, page_number)
        filepath = os.path.join(self.screenshots_dir, viewport["name"], f"{filename}.png")
        
        # Take full page screenshot
        try:
            page.screenshot(path=filepath, full_page=True)
            print(f"Captured {viewport['name']} screenshot: {filepath}")
            return True
        except Exception as e:
            print(f"Error capturing screenshot for {url} ({viewport['name']}): {e}")
            return False

    def run_lighthouse_audit(self, url, page_number):
        """Run Lighthouse audit for the given URL."""
        try:
            filename = self.create_filename_from_url(url, page_number)
            html_report_path = os.path.join(self.lighthouse_dir, f"{filename}.html")
            json_report_path = os.path.join(self.lighthouse_dir, f"{filename}.json")
            
            print(f"Running Lighthouse audit for {url}...")
            
            # Run Lighthouse using Node.js CLI
            # Requires lighthouse to be installed globally: npm install -g lighthouse
            command = [
                "lighthouse", 
                url, 
                "--output=html,json", 
                f"--output-path={html_report_path}", 
                "--chrome-flags=\"--headless --no-sandbox --disable-gpu\"",
                "--quiet"
            ]
            
            # Also capture mobile metrics 
            if "mobile" in command:
                command.append("--emulated-form-factor=mobile")
            else:
                command.append("--emulated-form-factor=desktop")
                
            process = subprocess.run(
                " ".join(command),
                shell=True,
                capture_output=True,
                text=True
            )
            
            if process.returncode != 0:
                print(f"Error running Lighthouse: {process.stderr}")
                return False
            
            # Rename the JSON file to match our naming convention (Lighthouse adds .report.json)
            if os.path.exists(f"{html_report_path}.report.json"):
                os.rename(f"{html_report_path}.report.json", json_report_path)
            
            print(f"Lighthouse audit completed: {html_report_path}")
            
            # Extract and print key metrics
            if os.path.exists(json_report_path):
                try:
                    with open(json_report_path, 'r') as f:
                        lighthouse_data = json.load(f)
                    
                    # Extract key metrics
                    performance = lighthouse_data['categories']['performance']['score'] * 100
                    accessibility = lighthouse_data['categories']['accessibility']['score'] * 100
                    best_practices = lighthouse_data['categories']['best-practices']['score'] * 100
                    seo = lighthouse_data['categories']['seo']['score'] * 100
                    
                    print(f"Performance: {performance:.1f}%, Accessibility: {accessibility:.1f}%, Best Practices: {best_practices:.1f}%, SEO: {seo:.1f}%")
                except Exception as e:
                    print(f"Error parsing Lighthouse results: {e}")
            
            return True
        except Exception as e:
            print(f"Error running Lighthouse audit for {url}: {e}")
            return False

    def crawl(self, start_url):
        """Crawl the website starting from the given URL and capture screenshots."""
        start_time = datetime.now()
        print(f"Starting crawl of {start_url} at {start_time}")
        
        # Normalize and add the start URL
        start_url = self.normalize_url(start_url)
        self.urls_to_visit.append(start_url)
        
        with sync_playwright() as playwright:
            # Launch the browser
            browser = playwright.chromium.launch(headless=True)
            
            page_count = 0
            while self.urls_to_visit and page_count < self.max_pages:
                # Get the next URL to visit
                current_url = self.urls_to_visit.pop(0)
                if current_url in self.visited_urls:
                    continue
                
                print(f"\nProcessing page {page_count + 1}/{self.max_pages}: {current_url}")
                
                # Create a new page context
                context = browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36")
                page = context.new_page()
                
                try:
                    # Navigate to the page
                    response = page.goto(current_url, timeout=self.timeout, wait_until="networkidle")
                    
                    if not response or response.status >= 400:
                        print(f"Failed to load {current_url}: Status code {response.status if response else 'unknown'}")
                        context.close()
                        continue
                    
                    # Wait for additional time to ensure page is fully loaded
                    page.wait_for_timeout(self.wait_time * 1000)
                    
                    # Capture screenshots for each viewport
                    screenshots_successful = True
                    for viewport in self.viewports:
                        if not self.capture_screenshot(page, current_url, viewport, page_count):
                            screenshots_successful = False
                    
                    # Run Lighthouse audit if enabled
                    if self.run_lighthouse:
                        self.run_lighthouse_audit(current_url, page_count)
                    
                    if screenshots_successful:
                        # Extract links for further crawling
                        new_links = self.extract_links(page, start_url)
                        self.urls_to_visit.extend(new_links)
                        print(f"Found {len(new_links)} new links on this page")
                    
                    # Mark as visited
                    self.visited_urls.add(current_url)
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
        print(f"\nCrawl completed at {end_time}")
        print(f"Duration: {duration:.2f} seconds")
        print(f"Pages crawled: {page_count}")
        print(f"Analysis saved to: {os.path.abspath(self.output_dir)}")
        
        # Create a summary report
        self.create_summary_report(page_count, start_url, duration)

    def create_summary_report(self, page_count, start_url, duration):
        """Create a summary report of the crawl."""
        summary_path = os.path.join(self.output_dir, "summary.html")
        
        # Get lighthouse data if available
        lighthouse_reports = []
        if self.run_lighthouse and os.path.exists(self.lighthouse_dir):
            for filename in os.listdir(self.lighthouse_dir):
                if filename.endswith(".json"):
                    try:
                        with open(os.path.join(self.lighthouse_dir, filename), 'r') as f:
                            data = json.load(f)
                            
                            # Get URL from the report
                            url = data.get('requestedUrl', 'Unknown URL')
                            
                            # Extract scores
                            performance = data['categories']['performance']['score'] * 100
                            accessibility = data['categories']['accessibility']['score'] * 100
                            best_practices = data['categories']['best-practices']['score'] * 100
                            seo = data['categories']['seo']['score'] * 100
                            
                            # Get HTML report name
                            html_report = filename.replace('.json', '.html')
                            
                            lighthouse_reports.append({
                                'url': url,
                                'performance': performance,
                                'accessibility': accessibility,
                                'best_practices': best_practices,
                                'seo': seo,
                                'report': html_report
                            })
                    except Exception as e:
                        print(f"Error parsing lighthouse data from {filename}: {e}")
        
        # Create HTML report
        with open(summary_path, 'w') as f:
            f.write(f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Website Analysis Summary</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: #333;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
        }}
        h1, h2, h3 {{
            color: #2c3e50;
        }}
        .summary-box {{
            background-color: #f8f9fa;
            border-radius: 5px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }}
        th, td {{
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }}
        th {{
            background-color: #f2f2f2;
        }}
        tr:hover {{
            background-color: #f5f5f5;
        }}
        .score {{
            font-weight: bold;
        }}
        .good {{
            color: #27ae60;
        }}
        .average {{
            color: #f39c12;
        }}
        .poor {{
            color: #e74c3c;
        }}
        .screenshot-gallery {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }}
        .screenshot-item {{
            border: 1px solid #ddd;
            border-radius: 4px;
            overflow: hidden;
        }}
        .screenshot-item img {{
            width: 100%;
            height: auto;
            display: block;
        }}
        .screenshot-caption {{
            padding: 10px;
            background: #f8f9fa;
            font-size: 14px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>Website Analysis Summary</h1>
        
        <div class="summary-box">
            <h2>Crawl Information</h2>
            <p><strong>Website:</strong> {start_url}</p>
            <p><strong>Date:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            <p><strong>Pages Crawled:</strong> {page_count}</p>
            <p><strong>Duration:</strong> {duration:.2f} seconds</p>
        </div>
""")

            # Add Lighthouse results if available
            if lighthouse_reports:
                f.write(f"""
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
""")

                for report in lighthouse_reports:
                    f.write(f"""
                    <tr>
                        <td>{report['url']}</td>
                        <td class="score {self.get_score_class(report['performance'])}">{report['performance']:.1f}%</td>
                        <td class="score {self.get_score_class(report['accessibility'])}">{report['accessibility']:.1f}%</td>
                        <td class="score {self.get_score_class(report['best_practices'])}">{report['best_practices']:.1f}%</td>
                        <td class="score {self.get_score_class(report['seo'])}">{report['seo']:.1f}%</td>
                        <td><a href="lighthouse/{report['report']}" target="_blank">View Report</a></td>
                    </tr>
""")

                f.write("""
                </tbody>
            </table>
        </div>
""")

            # Add screenshot gallery previews
            f.write("""
        <h2>Screenshot Preview</h2>
        
        <h3>Desktop View</h3>
        <div class="screenshot-gallery">
""")

            # Add a few desktop screenshots as preview
            desktop_screenshots = self.get_screenshot_paths("desktop")
            for i, screenshot in enumerate(desktop_screenshots[:6]):  # Limit to first 6
                filename = os.path.basename(screenshot)
                relative_path = os.path.join("screenshots", "desktop", filename)
                f.write(f"""
            <div class="screenshot-item">
                <img src="{relative_path}" alt="Desktop screenshot {i+1}">
                <div class="screenshot-caption">{filename}</div>
            </div>
""")
                
            f.write("""
        </div>
        
        <h3>Tablet View</h3>
        <div class="screenshot-gallery">
""")

            # Add tablet screenshots
            tablet_screenshots = self.get_screenshot_paths("tablet")
            for i, screenshot in enumerate(tablet_screenshots[:6]):
                filename = os.path.basename(screenshot)
                relative_path = os.path.join("screenshots", "tablet", filename)
                f.write(f"""
            <div class="screenshot-item">
                <img src="{relative_path}" alt="Tablet screenshot {i+1}">
                <div class="screenshot-caption">{filename}</div>
            </div>
""")
                
            f.write("""
        </div>
        
        <h3>Mobile View</h3>
        <div class="screenshot-gallery">
""")

            # Add mobile screenshots
            mobile_screenshots = self.get_screenshot_paths("mobile")
            for i, screenshot in enumerate(mobile_screenshots[:6]):
                filename = os.path.basename(screenshot)
                relative_path = os.path.join("screenshots", "mobile", filename)
                f.write(f"""
            <div class="screenshot-item">
                <img src="{relative_path}" alt="Mobile screenshot {i+1}">
                <div class="screenshot-caption">{filename}</div>
            </div>
""")
                
            f.write("""
        </div>
    </div>
</body>
</html>
""")
            
        print(f"Summary report created: {summary_path}")

    def get_screenshot_paths(self, device_type):
        """Get all screenshot paths for a specific device type."""
        device_dir = os.path.join(self.screenshots_dir, device_type)
        if not os.path.exists(device_dir):
            return []
        
        return [os.path.join(device_dir, f) for f in os.listdir(device_dir) if f.endswith('.png')]

    def get_score_class(self, score):
        """Get CSS class based on score value."""
        if score >= 90:
            return "good"
        elif score >= 50:
            return "average"
        else:
            return "poor"


def main():
    parser = argparse.ArgumentParser(description="Capture screenshots and run Lighthouse audits for websites")
    parser.add_argument("url", help="Starting URL to crawl")
    parser.add_argument("--output", "-o", default="website_analysis", help="Output directory for screenshots and reports")
    parser.add_argument("--max-pages", "-m", type=int, default=10, help="Maximum number of pages to crawl")
    parser.add_argument("--timeout", "-t", type=int, default=30000, help="Page load timeout in milliseconds")
    parser.add_argument("--wait", "-w", type=int, default=2, help="Additional wait time after page load (seconds)")
    parser.add_argument("--no-lighthouse", action="store_true", help="Skip Lighthouse audits")
    
    args = parser.parse_args()
    
    scraper = WebsiteScraper(
        output_dir=args.output,
        max_pages=args.max_pages,
        timeout=args.timeout,
        wait_time=args.wait,
        lighthouse=not args.no_lighthouse
    )
    
    scraper.crawl(args.url)


if __name__ == "__main__":
    main()