# Formatting Service Configuration Guide

The Formatting Service has been updated to work with any organization type and remove hardcoded assumptions. It now uses organization context to create appropriately tailored structured data.

## Quick Start

### 1. Using Organization Context from Analysis Data (Recommended)

The formatting service will automatically extract organization context from your analysis data:

```bash
npm run test:formatting
```

### 2. Overriding Organization Context

You can override the organization context when testing:

```bash
# Using predefined organization types
npm run test:formatting -- --org=ecommerce
npm run test:formatting -- --org=nonprofit
npm run test:formatting -- --org=corporate
npm run test:formatting -- --org=saas

# Using custom configuration
export TEST_ORG_NAME="Your Company"
export TEST_ORG_TYPE="tech startup"
export TEST_ORG_PURPOSE="to convert visitors into trial users"
npm run test:formatting -- --org=custom
```

### 3. Programmatic Configuration

When using the service directly in code:

```javascript
const { FormattingService } = require('./src/services/formatting');

const service = new FormattingService({
  model: 'claude-3-7-sonnet-20250219',
  inputPath: './data/analysis/analysis.json',
  outputPath: './data/analysis/structured-analysis.json',
  // Optional: override organization context
  orgContext: {
    org_name: 'Your Organization',
    org_type: 'your organization type',
    org_purpose: 'your organization purpose'
  }
});

const result = await service.format();
```

## What Changed

### ✅ Removed Hardcoded Assumptions

**Before:**
- Assumed all organizations wanted donations/sign-ups
- Hardcoded page types like "training", "research", "project" 
- Non-profit specific language in prompts and fallbacks

**After:**
- Uses actual organization purpose from context
- Dynamic page type detection based on organization type
- Generic, flexible language throughout

### 🔧 Enhanced Page Type Detection

The service now intelligently detects page types based on organization type:

**All Organization Types:**
- Homepage, Contact Page, About Page, Blog/News Page
- Support Page, Team Page, Portfolio Page, etc.

**E-commerce Specific:**
- Product Page, Category Page, Cart/Checkout Page
- Wishlist Page, Account Page

**SaaS Specific:**
- Features Page, Trial/Demo Page, Dashboard Page
- API/Integration Page, Pricing Page

**Non-profit Specific:**
- Donation Page, Volunteer Page, Programs Page
- Impact Page

**Corporate Specific:**
- Client Page, Case Study Page, Investor Relations Page

### 📝 Context-Aware Prompts

All formatting prompts now:
- Reference the actual organization name, type, and purpose
- Tailor recommendations to the specific business goals
- Focus on metrics that matter for that organization type

## Configuration Options

### Organization Context Structure

```javascript
{
  org_name: "Your Organization Name",        // Name of the organization
  org_type: "e-commerce business",          // Type of organization  
  org_purpose: "to increase online sales"   // Primary business purpose
}
```

### Priority Order for Organization Context

1. **Explicit override** - provided via `orgContext` option
2. **Analysis data** - extracted from `rawAnalysisData.orgContext`
3. **Environment variables** - `TEST_ORG_*` variables
4. **Default fallback** - generic organization context

## Output Structure

The formatted output now includes:

```json
{
  "timestamp": "2025-01-01T12:00:00.000Z",
  "orgContext": {
    "org_name": "Your Organization",
    "org_type": "organization type", 
    "org_purpose": "organization purpose"
  },
  "overall_summary": {
    "executive_summary": "Tailored to your org purpose...",
    "overall_score": 7,
    "site_score_explanation": "Context-aware explanation...",
    "most_critical_issues": ["Issues relevant to your goals..."],
    "top_recommendations": ["Recommendations for your org type..."],
    "key_strengths": ["Strengths that support your purpose..."],
    "performance_summary": "Technical performance overview...",
    "detailed_markdown_content": "Full analysis content..."
  },
  "page_analyses": [
    {
      "page_type": "Smart page type detection",
      "title": "Context-appropriate title",
      "overall_score": 8,
      "overall_explanation": "Explanation focused on your goals",
      "key_issues": [
        {
          "issue": "Issue description",
          "how_to_fix": "Fix instructions"
        }
      ],
      "recommendations": [
        {
          "recommendation": "Recommendation description", 
          "benefit": "Benefit explanation"
        }
      ],
      "summary": "Page summary in context of your purpose"
    }
  ],
  "metadata": {
    "total_pages": 5,
    "analysis_provider": "anthropic",
    "analysis_model": "claude-3-7-sonnet-20250219"
  }
}
```

## Migration from Previous Versions

If you were using the formatting service before this update:

### ✅ Fully Backward Compatible
- Existing workflows will continue to work
- Default fallbacks ensure no breaking changes
- Previous output structure is preserved

### 🚀 To Get Enhanced Features
1. Ensure your LLM analysis includes organization context
2. No code changes needed - context is automatically used
3. Test with your organization type for optimal results

### 📋 Verification Checklist
- [ ] Run formatting test: `npm run test:formatting`
- [ ] Check that organization context appears in output
- [ ] Verify page types are appropriate for your org
- [ ] Confirm recommendations align with your business goals

## Examples by Organization Type

### E-commerce
```json
{
  "page_type": "Product Page",
  "recommendations": [
    {
      "recommendation": "Add product reviews section", 
      "benefit": "Increases purchase confidence and conversion rates"
    }
  ]
}
```

### SaaS
```json
{
  "page_type": "Features Page", 
  "recommendations": [
    {
      "recommendation": "Add trial signup CTA",
      "benefit": "Converts feature interest into trial users"
    }
  ]
}
```

### Non-profit
```json
{
  "page_type": "Programs Page",
  "recommendations": [
    {
      "recommendation": "Highlight impact metrics",
      "benefit": "Builds donor trust and encourages donations"
    }
  ]
}
```

## Best Practices

1. **Consistent Context**: Use the same organization context throughout your analysis pipeline
2. **Specific Purpose**: Make your `org_purpose` specific rather than generic
3. **Appropriate Type**: Choose the organization type that best matches your business model
4. **Review Output**: Check that page types and recommendations align with your expectations

## Troubleshooting

### Issue: Generic page types
**Solution**: Ensure your organization type is specific (e.g., "e-commerce business" vs "business")

### Issue: Irrelevant recommendations  
**Solution**: Check that your organization purpose accurately reflects your business goals

### Issue: Organization context not found
**Solution**: Verify your LLM analysis included organization context, or provide it explicitly