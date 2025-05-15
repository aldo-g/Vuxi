# URL Discovery Service

## Overview

This microservice crawls a website and discovers all accessible URLs based on a starting URL. It systematically navigates through the site, following links while respecting constraints like maximum pages, timeouts, and exclusion patterns.

## Features

- Automated website crawling
- Configurable crawl depth and constraints
- URL deduplication and normalization
- Filtering out non-content URLs (media files, API endpoints, etc.)
- JSON output with detailed metadata

## Input

The service requires a starting URL and several optional parameters:

| Parameter | Description | Default |
|-----------|-------------|---------|
| `--url` | Starting URL to crawl (required) | N/A |
| `--max-pages` | Maximum number of pages to crawl | 50 |
| `--timeout` | Page load timeout in milliseconds | 30000 |
| `--wait-time` | Time to wait after page load (seconds) | 2 |
| `--exclude` | URL patterns to exclude (regex strings) | [] |
| `--output` | Output file for discovered URLs | /app/data/urls.json |

## Output

The service produces two JSON files:

1. **urls.json**: Complete data including timestamp, statistics, and metadata
2. **urls_simple.json**: A simple array of URLs for downstream processing

Output structure example:
```json
{
  "timestamp": "2025-05-14T12:00:00.000Z",
  "startUrl": "https://example.com",
  "totalUrls": 25,
  "crawlStats": {
    "pagesCrawled": 25,
    "pagesSkipped": 3,
    "errors": 0,
    "duration": 45.2,
    "totalUrlsDiscovered": 28,
    "duplicatesSkipped": 5
  },
  "urls": [
    "https://example.com",
    "https://example.com/about",
    "https://example.com/contact",
    ...
  ]
}

Running with Docker
Build the Image
bashdocker build -t url-discovery-service .
Run the Container
Basic usage:
bashdocker run -v $(pwd)/data:/app/data url-discovery-service npm start -- --url https://example.com --output /app/data/urls.json
With all options:
bash
docker run -v $(pwd)/data:/app/data url-discovery-service npm start -- \
  --url https://example.com \
  --output /app/data/urls.json \
  --max-pages 20 \
  --timeout 45000 \
  --wait-time 3 \
  --exclude "/blog/.*" "/login/.*"
Environment Variables
None required.

Notes

The crawl respects robots.txt by default
For large websites, consider using the --max-pages parameter to limit crawl depth
The entrypoint script automatically cleans up previous outputs before starting