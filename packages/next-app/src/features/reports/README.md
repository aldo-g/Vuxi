# Reports Feature

## Overview
The Reports feature handles the display, navigation, and interaction with UX analysis reports. It provides comprehensive views of analysis results including executive summaries, detailed page analyses, and interactive data visualizations.

## Purpose
- **Report Display**: Present analysis results in an accessible, professional format
- **Data Visualization**: Transform complex analysis data into digestible insights
- **Navigation**: Enable easy browsing between reports and individual page analyses
- **Executive Summaries**: Provide high-level insights for stakeholders
- **Detailed Analysis**: Offer in-depth page-by-page breakdowns for implementers

## Key Capabilities
- **Report Listing**: Browse all available analysis reports
- **Report Overview**: Display executive summary and overall scores
- **Page Analysis**: Detailed view of individual page analysis results
- **Score Visualization**: Color-coded scoring with progress indicators
- **Issue Tracking**: Clear presentation of identified issues and recommendations
- **Screenshot Integration**: Visual evidence linked to analysis insights
- **Export/Sharing**: Formatted reports suitable for stakeholder review

## Directory Structure
```
reports/
├── components/
│   ├── executive-summary.tsx     # Report overview component
│   ├── page-analysis-card.tsx    # Individual page summary card
│   ├── score-badge.tsx           # Score visualization component
│   ├── issue-list.tsx            # Issues and recommendations display
│   └── screenshot-viewer.tsx     # Image display with fallbacks
├── hooks/
│   ├── use-report-data.ts        # Report data fetching and caching
│   ├── use-report-navigation.ts  # Navigation between reports/pages
│   └── use-score-calculations.ts # Score aggregation and formatting
├── types/
│   └── index.ts                  # Report-specific TypeScript types
└── index.ts                      # Feature exports
```

## Core Components

### Executive Summary
- Overall site score and assessment
- Key findings and critical issues
- Top recommendations for improvement
- Performance summary and strengths
- Metadata (organization, analysis date)

### Page Analysis Views
- Individual page scoring breakdown
- Section-by-section analysis results
- Identified issues with fix recommendations
- Page role and purpose analysis
- Screenshot evidence display

### Score Visualization
- Color-coded score badges (red, yellow, green scale)
- Progress bars and percentage indicators
- Status text (Excellent, Good, Needs Improvement)
- Consistent scoring UI across all views

## Report Data Structure
```typescript
interface ReportData {
  organization: string;
  analysis_date: string;
  overall_summary: OverallSummary;
  page_analyses: PageAnalysisDetail[];
  metadata?: ReportMetadata;
  screenshots?: { [key: string]: string };
}

interface PageAnalysisDetail {
  id: string;
  title: string;
  overall_score: number;
  url: string;
  section_scores: { [key: string]: number };
  key_issues: PageIssue[];
  recommendations: PageRecommendation[];
  summary: string;
  screenshot_path?: string;
}
```

## Page Types & Routes
- **Report List**: `/reports` - Browse all available reports
- **Report Overview**: `/report/[reportId]` - Executive summary and page list
- **Page Analysis**: `/report/[reportId]/page/[pageId]` - Detailed page insights

## Data Sources
- **Report Manifest**: `/all_analysis_runs_manifest.json` - List of available reports
- **Report Data**: `/reports/[reportId]/data.json` - Complete analysis results
- **Screenshots**: `/screenshots/[path]` - Visual evidence images

## Score Interpretation
- **9-10**: Excellent (Green) - Exceeds best practices
- **7-8**: Good (Light Green) - Meets standards with minor improvements
- **5-6**: Adequate (Yellow) - Basic requirements met, room for improvement
- **3-4**: Poor (Orange) - Significant issues requiring attention
- **0-2**: Critical (Red) - Major problems affecting user experience

## Usage Example
```tsx
import { ExecutiveSummary, ReportOverview } from '@/features/reports';

// Report overview page
function ReportPage({ reportId }: { reportId: string }) {
  return (
    <div>
      <ExecutiveSummary reportId={reportId} />
      <ReportOverview reportId={reportId} />
    </div>
  );
}
```

## Key Features

### Interactive Elements
- **Tabbed Navigation**: Switch between summary, issues, and recommendations
- **Accordion Sections**: Expandable content areas for detailed analysis
- **Screenshot Modal**: Full-size image viewing
- **Score Tooltips**: Hover details for score explanations

### Responsive Design
- **Mobile-first**: Optimized for all screen sizes
- **Print-friendly**: Clean layouts suitable for PDF export
- **High-contrast**: Accessible color schemes for score indicators
- **Loading States**: Skeleton screens during data fetching

### Data Processing
- **Markdown Rendering**: Rich text content with proper formatting
- **Image Optimization**: Lazy loading and fallback handling
- **Score Calculations**: Weighted averages and trend analysis
- **Content Parsing**: Structured extraction from analysis results

## Error Handling
- **Missing Reports**: Clear error messages with navigation options
- **Failed Data Loads**: Retry mechanisms and fallback content
- **Image Loading**: Placeholder images for failed screenshots
- **Invalid Data**: Graceful degradation with partial content display

## Performance Considerations
- **Data Caching**: React Query for efficient data fetching
- **Image Optimization**: WebP support with JPEG fallbacks
- **Code Splitting**: Lazy loading of report components
- **Virtual Scrolling**: Efficient rendering of large report lists

## Development Notes
- Reports are generated by external analysis service
- Data format is standardized JSON with flexible content sections
- Screenshot paths are relative to job-specific directories
- Score calculations support weighted averaging for section scores
- All text content supports Markdown rendering for rich formatting
- Error boundaries protect against malformed report data
