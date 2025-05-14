## 5. Formatting Service README.md

```markdown
# Formatting Service

## Overview

This microservice processes the raw LLM analysis output and converts it into a structured, consistent JSON format that's easier to use in downstream processes like report generation. It validates the structure, fills in missing data, and ensures numerical scores are properly formatted.

## Features

- Structured JSON formatting of LLM analysis
- Data validation and cleanup
- Schema enforcement
- Error handling and recovery
- Default values for missing information

## Input

The service requires the raw analysis.json output from the LLM Analysis Service:

| Parameter | Description | Default |
|-----------|-------------|---------|
| `--input` | Input JSON file with raw analysis data (required) | N/A |
| `--output` | Output file for structured data | /app/data/analysis/structured-analysis.json |
| `--model` | Model to use for formatting | claude-3-7-sonnet-20250219 |

## Output

The service produces a single JSON file:

1. **structured-analysis.json**: Validated and formatted analysis data

Output structure example:
```json
{
  "overview": {
    "executive_summary": "Comprehensive summary...",
    "overall_score": 7
  },
  "scores": [
    {
      "category": "Design",
      "score": 8,
      "description": "The design effectively communicates..."
    }
  ],
  "critical_issues": [
    "Navigation is inconsistent between pages...",
    "Load times exceed 3 seconds on mobile..."
  ],
  "recommendations": [
    "Implement consistent navigation across all pages...",
    "Optimize images and implement lazy loading..."
  ],
  "strengths": [
    "Clear brand identity across all pages...",
    "Effective use of white space..."
  ],
  "technical_summary": "Technical analysis of performance...",
  "page_analyses": [
    {
      "page_type": "Homepage",
      "url": "https://example.com",
      "critical_flaws": [
        "Hero image takes too long to load...",
        "Call-to-action button lacks contrast..."
      ],
      "recommendations": [
        "Optimize hero image...",
        "Increase contrast of CTA button..."
      ],
      "summary": "Homepage analysis summary..."
    }
  ]
}

Running with Docker
Build the Image
bashdocker build -t formatting-service .
Run the Container
Basic usage:
bashdocker run -v $(pwd)/data:/app/data \
  -e ANTHROPIC_API_KEY=your_api_key_here \
  formatting-service npm start -- \
  --input /app/data/analysis/analysis.json \
  --output /app/data/analysis/structured-analysis.json
With all options:
bashdocker run -v $(pwd)/data:/app/data \
  -e ANTHROPIC_API_KEY=your_api_key_here \
  formatting-service npm start -- \
  --input /app/data/analysis/analysis.json \
  --output /app/data/analysis/structured-analysis.json \
  --model claude-3-7-sonnet-20250219
Environment Variables

ANTHROPIC_API_KEY: API key for Anthropic Claude (required)

Notes

The formatting service ensures consistent structure for the HTML report generation
It validates all scores are on a 1-10 scale
It provides default values for any missing fields
The entrypoint script automatically cleans up any previous structured-analysis.json file before starting