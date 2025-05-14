## 4. LLM Analysis Service README.md

```markdown
# LLM Analysis Service

## Overview

This microservice analyzes website screenshots and performance data using Claude 3.7 Sonnet LLM to provide UX/UI feedback, identify issues, and generate recommendations for website improvement. It processes both visual and technical data to create a comprehensive analysis.

## Features

- AI-powered screenshot analysis
- UX/UI expert assessment
- Technical performance evaluation
- Issue identification and prioritization
- Actionable recommendations
- Integration of visual and performance data

## Input

The service requires screenshots and Lighthouse data:

| Parameter | Description | Default |
|-----------|-------------|---------|
| `--screenshots` | Directory containing screenshots (required) | N/A |
| `--lighthouse` | Directory containing lighthouse reports (required) | N/A |
| `--output` | Output directory for analysis results | /app/data/analysis |
| `--provider` | LLM provider to use | anthropic |
| `--model` | Model to use for analysis | claude-3-7-sonnet-20250219 |

## Output

The service produces two JSON files:

1. **analysis.json**: Complete analysis with page-specific and overall assessments
2. **analysis-metadata.json**: Metadata about the analysis process

Output structure example:
```json
{
  "timestamp": "2025-05-14T14:00:00.000Z",
  "provider": "anthropic",
  "model": "claude-3-7-sonnet-20250219",
  "pageAnalyses": [
    {
      "url": "https://example.com",
      "analysis": "Detailed page-specific analysis..."
    },
    ...
  ],
  "technicalSummary": "Technical performance analysis...",
  "overview": "Comprehensive site-wide assessment..."
}

Running with Docker
Build the Image
bashdocker build -t llm-analysis-service .
Run the Container
Basic usage:
bashdocker run -v $(pwd)/data:/app/data \
  -e ANTHROPIC_API_KEY=your_api_key_here \
  llm-analysis-service npm start -- \
  --screenshots /app/data/screenshots \
  --lighthouse /app/data/lighthouse \
  --output /app/data/analysis
With all options:
bashdocker run -v $(pwd)/data:/app/data \
  -e ANTHROPIC_API_KEY=your_api_key_here \
  llm-analysis-service npm start -- \
  --screenshots /app/data/screenshots \
  --lighthouse /app/data/lighthouse \
  --output /app/data/analysis \
  --provider anthropic \
  --model claude-3-7-sonnet-20250219
Environment Variables

ANTHROPIC_API_KEY: API key for Anthropic Claude (required)

Notes

An Anthropic API key is required to use this service
Analysis may take several minutes depending on the number of pages
Screenshots should be in the desktop/ subdirectory
Lighthouse data should include the trimmed/ directory with trimmed reports
The entrypoint script automatically cleans up previous analysis files before starting