## 2. Screenshot Service README.md

```markdown
# Screenshot Service

## Overview

This microservice captures screenshots of multiple web pages at desktop resolution. It uses Playwright to render pages with proper JavaScript execution, handles cookie consent popups, and optimizes YouTube embeds for clean screenshots.

## Features

- Full-page screenshots at desktop resolution (1440x900 by default)
- Automated cookie consent popup handling
- YouTube embed optimization (replaces iframes with static thumbnails)
- Lazy loading triggering for complete page rendering
- Configurable timeout and concurrency

## Input

The service requires a JSON file containing an array of URLs to capture, typically the output from the URL Discovery Service:

| Parameter | Description | Default |
|-----------|-------------|---------|
| `--input` | Input JSON file with URLs (required) | N/A |
| `--output` | Output directory for screenshots | /app/data/screenshots |
| `--timeout` | Page load timeout in milliseconds | 30000 |
| `--viewport` | Viewport size (WIDTHxHEIGHT) | 1440x900 |
| `--concurrent` | Number of concurrent captures | 3 |

## Output

The service produces:

1. **desktop/**: Directory containing PNG screenshots named with the pattern: `000_domain_path.png`
2. **metadata.json**: File containing details about each captured screenshot

Output structure example:
```json
{
  "timestamp": "2025-05-14T12:30:00.000Z",
  "duration_seconds": 95.4,
  "total_urls": 25,
  "successful_captures": 23,
  "failed_captures": 2,
  "results": [
    {
      "url": "https://example.com",
      "success": true,
      "data": {
        "filename": "000_example.com_index.png",
        "path": "desktop/000_example.com_index.png",
        "timestamp": "2025-05-14T12:30:15.000Z",
        "duration_ms": 3521,
        "viewport": {"width": 1440, "height": 900}
      }
    },
    ...
  ],
  "configuration": {
    "viewport": {"width": 1440, "height": 900},
    "timeout": 30000,
    "concurrent": 3
  }
}

Running with Docker
Build the Image
bashdocker build -t screenshot-service .
Run the Container
Basic usage:
bashdocker run -v $(pwd)/data:/app/data screenshot-service npm start -- --input /app/data/urls_simple.json --output /app/data/screenshots
With all options:
bashdocker run -v $(pwd)/data:/app/data screenshot-service npm start -- \
  --input /app/data/urls_simple.json \
  --output /app/data/screenshots \
  --timeout 45000 \
  --viewport 1920x1080 \
  --concurrent 2
Environment Variables
None required.

Notes

For larger websites, adjust the --concurrent parameter to prevent overwhelming the server
The entrypoint script automatically cleans up previous screenshot files before starting
Screenshots are optimized to minimize file size while maintaining quality