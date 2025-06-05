# LLM Analysis Configuration Guide

The LLM Analysis Service is now fully configurable for different organization types and purposes. Here's how to customize it for your specific use case.

## Quick Start

### 1. Using Predefined Organization Types

Run the test with a predefined organization type:

```bash
# E-commerce website
npm run test:llm-analysis -- --org=ecommerce

# Non-profit organization  
npm run test:llm-analysis -- --org=nonprofit

# Corporate business website
npm run test:llm-analysis -- --org=corporate

# Personal portfolio
npm run test:llm-analysis -- --org=portfolio

# Blog or media site
npm run test:llm-analysis -- --org=blog

# SaaS platform
npm run test:llm-analysis -- --org=saas
```

### 2. Using Custom Organization Configuration

Set environment variables for a custom organization:

```bash
export TEST_ORG_NAME="Your Company Name"
export TEST_ORG_TYPE="technology startup"
export TEST_ORG_PURPOSE="to convert visitors into trial users and showcase our innovative AI solutions"

npm run test:llm-analysis -- --org=custom
```

### 3. Programmatic Configuration

When using the service directly in code:

```javascript
const { LLMAnalysisService } = require('./src/services/llm-analysis');

const service = new LLMAnalysisService({
  provider: 'anthropic',
  model: 'claude-3-7-sonnet-20250219',
  screenshotsDir: './data/screenshots',
  lighthouseDir: './data/lighthouse',
  outputDir: './data/analysis',
  // Organization configuration
  org_name: 'Your Organization Name',
  org_type: 'your organization type',
  org_purpose: 'your organization\'s main goals and objectives'
});

const result = await service.analyze();
```

## Configuration Options

### Organization Context

The analysis prompts are customized based on three key parameters:

- **`org_name`**: The name of your organization
- **`org_type`**: The type of organization (e.g., "e-commerce business", "non-profit", "SaaS company")
- **`org_purpose`**: The primary goals and objectives of the website

### Predefined Configurations

| Type | Description | Purpose |
|------|-------------|---------|
| `ecommerce` | E-commerce business | Convert visitors into customers, increase sales, provide excellent shopping experience |
| `nonprofit` | Non-profit organization | Encourage donations, volunteer sign-ups, spread awareness |
| `corporate` | Business corporation | Generate leads, showcase services, establish trust with clients |
| `portfolio` | Personal brand | Showcase skills and experience to attract opportunities |
| `blog` | Content publication | Engage readers, increase time on site, build audience |
| `saas` | Software-as-a-Service | Convert visitors into trial users and paying subscribers |
| `custom` | User-defined | Uses environment variables or programmatic configuration |

## Environment Variables

You can set default organization details in your `.env` file:

```bash
# Default organization configuration
ORG_NAME=Your Default Organization
ORG_TYPE=organization type
ORG_PURPOSE=main organizational purpose

# Test-specific configuration
TEST_ORG_NAME=Test Organization Name
TEST_ORG_TYPE=test organization type  
TEST_ORG_PURPOSE=test organizational purpose

# API Configuration
ANTHROPIC_API_KEY=your-api-key-here
```

## How It Works

1. **Analysis Prompts**: The organization context is injected into all analysis prompts, making the LLM tailor its feedback to your specific goals.

2. **Scoring Criteria**: The LLM evaluates pages based on how well they serve your organization's purpose.

3. **Recommendations**: All suggestions are prioritized based on your organization type and objectives.

4. **Output**: The analysis results include your organization context for reference.

## Example Outputs

The analysis will be customized based on your organization type:

### E-commerce Analysis
- Focuses on conversion optimization, checkout flow, product presentation
- Evaluates trust signals, payment security, mobile commerce experience
- Recommends improvements for cart abandonment, product discovery

### Non-profit Analysis  
- Emphasizes donation flows, volunteer engagement, mission clarity
- Assesses emotional connection, transparency, call-to-action effectiveness
- Suggests improvements for supporter retention, impact communication

### SaaS Analysis
- Concentrates on trial conversion, feature presentation, onboarding
- Reviews pricing clarity, benefit communication, user journey
- Recommends optimizations for free trial signups, feature adoption

## Best Practices

1. **Be Specific**: The more specific your `org_purpose`, the better the analysis will be tailored.

2. **Match Your Audience**: Choose the organization type that best matches your target audience and business model.

3. **Consistent Context**: Use the same organization configuration across related analyses for consistent results.

4. **Review Defaults**: Check the predefined configurations to see if they match your needs, or create a custom configuration.

## Troubleshooting

### Issue: Generic recommendations
**Solution**: Make sure your `org_purpose` is specific to your business goals rather than generic.

### Issue: Wrong organization type in analysis
**Solution**: Verify that your organization configuration is being passed correctly and check the analysis metadata.

### Issue: Environment variables not working
**Solution**: Ensure your `.env` file is in the correct location and variables are properly formatted.

## Migration from Previous Versions

If you were using the analysis service before this update:

1. The service will still work with default generic configuration
2. To get organization-specific analysis, add the configuration parameters
3. Update any automation scripts to include organization context
4. Review your analysis results to ensure they match your expectations