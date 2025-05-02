# Website Analyzer

A comprehensive tool for website UX/UI analysis with screenshots, AI-powered feedback, and Lighthouse audits.

## Overview

Website Analyzer is a Python tool designed to help UX/UI professionals and web developers evaluate websites by:

- Crawling web pages and capturing screenshots at multiple device sizes
- Analyzing screenshots with Claude 3.7 Sonnet AI to provide detailed UX/UI feedback
- Running Lighthouse audits to evaluate performance, accessibility, and SEO
- Generating comprehensive HTML reports with actionable recommendations

Perfect for UX audits, competitive analysis, and identifying issues that impact user experience.

## Features

- **Website Crawling**: Automatically navigate websites and collect screenshots
- **Multi-Device Capture**: Take screenshots at mobile, tablet, and desktop sizes
- **AI-Powered Analysis**: Get detailed UX/UI feedback from Claude 3.7 Sonnet
- **Lighthouse Integration**: Performance, accessibility, SEO, and best practices metrics
- **Comprehensive Reports**: Clean, structured HTML reports with:
  - Overall design analysis
  - Individual page assessments
  - Severity-rated issues
  - Prioritized recommendations
  - Performance metrics

## Installation

### Prerequisites

- Python 3.7 or higher
- Node.js and npm (for Lighthouse)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/website-analyzer.git
   cd website-analyzer
   ```

2. Install the package in development mode:
   ```bash
   pip install -e .
   ```

3. Install Playwright browsers:
   ```bash
   playwright install
   ```

4. Install Lighthouse globally:
   ```bash
   npm install -g lighthouse
   ```

5. Create a `constants.py` file in `website_analyzer/common/`:
   ```python
   """
   Constants for the website analyzer.
   """
   # API Provider Configuration
   API_PROVIDER = "anthropic"  # Options: "openai", "anthropic"

   # Anthropic API Configuration
   ANTHROPIC_API_KEY = "your_anthropic_api_key_here"
   ANTHROPIC_API_ENDPOINT = "https://api.anthropic.com/v1/messages"
   ANTHROPIC_MODEL = "claude-3-7-sonnet-20250219"  # Claude 3.7 Sonnet
   ANTHROPIC_MAX_TOKENS = 4096

   # OpenAI API Configuration (backup)
   OPENAI_API_KEY = "your_openai_api_key_here"
   OPENAI_API_ENDPOINT = "https://api.openai.com/v1/chat/completions"
   OPENAI_MODEL = "gpt-4o"
   ```

## Usage

### Basic Workflow

1. **Crawl a website**:
   ```bash
   website-analyzer crawl https://www.example.com
   ```

2. **Analyze the overall design**:
   ```bash
   website-analyzer analyze
   ```

3. **Analyze individual pages**:
   ```bash
   website-analyzer analyze-pages
   ```

4. **Analyze a specific screenshot**:
   ```bash
   website-analyzer analyze-file website_analysis/screenshots/desktop/000_example.com_homepage.png
   ```

### Advanced Options

#### Crawling options
```bash
website-analyzer crawl https://www.example.com --output my_analysis --max-pages 20 --timeout 45000 --wait 3 --no-lighthouse
```

#### Analysis with custom organization details
```bash
website-analyzer analyze --org-name "Company Name" --org-type "business" --org-purpose "To sell products"
```

#### Format options
```bash
website-analyzer analyze-pages --output-format json
```

## Output

The tool generates a structured output in the specified directory (default: `website_analysis/`):

```
website_analysis/
├── screenshots/           # Screenshots organized by device type
│   ├── desktop/           # Desktop-sized screenshots
│   ├── tablet/            # Tablet-sized screenshots
│   └── mobile/            # Mobile-sized screenshots
├── lighthouse/            # Lighthouse audit reports
├── analysis/              # Analysis results
│   ├── desktop_screenshot_analysis.html  # Overall design analysis
│   └── pages/             # Individual page analyses
│       ├── index.html     # Page listing
│       ├── home_page_analysis.html
│       └── ...
└── logs/                  # API request/response logs
```

## Example Reports

- **Overall Analysis**: Evaluates brand identity, information architecture, visual storytelling, and more across the entire site
- **Individual Page Analysis**: Assesses clarity, functionality, design, content quality, and usability of each page
- **Performance Metrics**: Core Web Vitals and other Lighthouse metrics

## Project Structure

```
website_analyzer/
├── cli/                  # Command-line interface
├── common/               # Shared utilities
├── crawler/              # Website crawling functionality
├── lighthouse/           # Lighthouse integration
├── reporting/            # Report generation
├── screenshot_analyzer/  # Screenshot analysis
│   ├── api_clients/      # API clients (Anthropic, OpenAI)
│   ├── utils/            # Analysis utilities
│   └── ...
└── ...
```

## Customization

### Analysis Prompts

The tool uses carefully crafted prompts to guide the AI's analysis. You can customize these in `website_analyzer/screenshot_analyzer/prompts.py`.

### Report Templates

HTML report templates are located in `website_analyzer/reporting/templates/`.

## Troubleshooting

### API Issues
- Ensure your API key is correctly set in `constants.py`
- Check network connectivity to the API endpoints
- Verify your API account has sufficient credits/quota

### Lighthouse Issues
- Make sure Lighthouse is installed globally: `npm list -g lighthouse`
- Chrome must be installed for Lighthouse to function properly

## License

This project is licensed under the [MIT License](LICENSE).

## Credits

- [Playwright](https://playwright.dev/) for browser automation
- [Jinja2](https://jinja.palletsprojects.com/) for HTML templating
- [Anthropic Claude](https://www.anthropic.com/claude) for AI-powered analysis
- [Google Lighthouse](https://developers.google.com/web/tools/lighthouse) for performance auditing