## 3. Lighthouse Service README.md

```markdown
# Lighthouse Service

## Overview

This microservice runs Google Lighthouse audits on a set of URLs to analyze performance, accessibility, SEO, and best practices. It uses Puppeteer and Lighthouse to execute audits and generate comprehensive reports.

## Features

- Performance metrics (Core Web Vitals, Speed Index, etc.)
- Accessibility evaluation
- SEO analysis
- Best practices assessment
- Detailed and trimmed JSON reports
- Configurable retries for reliable results

## Input

The service requires a JSON file containing an array of URLs to audit, typically the output from the URL Discovery Service:

| Parameter | Description | Default |
|-----------|-------------|---------|
| `--input` | Input JSON file with URLs (required) | N/A |
| `--output` | Output directory for Lighthouse reports | /app/data/lighthouse |
| `--concurrent` | Number of concurrent audits | 1 |
| `--retries` | Number of retries for failed audits | 2 |

## Output

The service produces three types of output:

1. **reports/**: Directory containing full JSON Lighthouse reports for each URL
2. **trimmed/**: Directory containing optimized, smaller JSON reports with essential metrics
3. **lighthouse-summary.json**: Summary of all audits with key metrics for each URL

Output structure example:
```json
{
  "timestamp": "2025-05-14T13:00:00.000Z",
  "duration_seconds": 180.5,
  "total_urls": 25,
  "successful_audits": 24,
  "failed_audits": 1,
  "results": [
    {
      "url": "https://example.com",
      "success": true,
      "error": null,
      "reportPath": "reports/000_example.com_index.json",
      "trimmedPath": "trimmed/000_example.com_index_trimmed.json"
    },
    ...
  ]
}

Running with Docker
Build the Image
bashdocker build -t lighthouse-service .
Run the Container
Basic usage:
bashdocker run -v $(pwd)/data:/app/data lighthouse-service npm start -- --input /app/data/urls_simple.json --output /app/data/lighthouse
With all options:
bashdocker run -v $(pwd)/data:/app/data lighthouse-service npm start -- \
  --input /app/data/urls_simple.json \
  --output /app/data/lighthouse \
  --concurrent 1 \
  --retries 3
Environment Variables
None required.

Notes

For reliable results, --concurrent should remain at 1
Lighthouse audits are resource-intensive and may take several minutes to complete
The entrypoint script automatically cleans up previous Lighthouse files before starting
Results are deterministic but may vary slightly between runs