## 6. HTML Report Service README.md

```markdown
# HTML Report Service

## Overview

This microservice generates comprehensive HTML reports from the structured analysis data. It creates a full report with executive summary, technical details, and individual page analyses, all with a clean, professional design.

## Features

- Comprehensive HTML report generation
- Beautiful, responsive design with tailored styling
- Interactive elements using JavaScript
- Summary and individual page reports
- Performance visualizations
- Screenshot integration

## Input

The service requires the structured analysis JSON and access to screenshots:

| Parameter | Description | Default |
|-----------|-------------|---------|
| `--input` | Input JSON file with analysis data (required) | N/A |
| `--screenshots` | Directory containing screenshots (required) | N/A |
| `--output` | Output directory for HTML reports | /app/data/reports |

## Output

The service produces a complete HTML report structure:

1. **index.html**: Main overview page
2. **executive-summary.html**: Executive summary for stakeholders
3. **technical-summary.html**: Technical performance details
4. **pages/**: Directory with individual page analyses
   - **index.html**: Index of all page reports
   - **[page].html**: Individual page reports
5. **screenshots/**: Directory with copied screenshots for reference

## Running with Docker

### Build the Image

```bash
docker build -t html-report-service .

Run the Container
Basic usage:
bashdocker run -v $(pwd)/data:/app/data \
  html-report-service npm start -- \
  --input /app/data/analysis/structured-analysis.json \
  --screenshots /app/data/screenshots \
  --output /app/data/reports
With custom path:
bashdocker run -v $(pwd)/data:/app/data \
  html-report-service npm start -- \
  --input /app/data/analysis/structured-analysis.json \
  --screenshots /app/data/screenshots \
  --output /app/data/custom-reports
Environment Variables
None required.
Notes

The reports are designed to be viewed in a web browser
All reports are self-contained and don't require external resources
Screenshots are copied to the report directory for easy reference
Reports can be saved as PDFs directly from the browser
The entrypoint script automatically cleans up previous HTML reports before starting