# Analysis Feature

## Overview
The Analysis feature orchestrates the complete website UX analysis workflow, from initial URL input through AI-powered analysis and report generation. This feature manages the complex multi-step process of capturing website screenshots and generating comprehensive UX insights.

## Purpose
- **Primary Goal**: Enable users to analyze websites for UX/UI issues and improvements
- **Workflow Management**: Handle the multi-step analysis wizard with proper state management
- **Job Orchestration**: Coordinate website capture and AI analysis jobs across microservices
- **Progress Tracking**: Provide real-time feedback during long-running analysis operations

## Key Capabilities
- **Multi-Step Wizard**: Guide users through URL input, organization details, and site purpose
- **Website Capture**: Initiate and monitor screenshot capture jobs via external service
- **AI Analysis**: Trigger and track AI-powered UX analysis of captured content
- **Polling Management**: Handle real-time status updates for async operations
- **Error Handling**: Provide robust error recovery and user feedback

## Directory Structure
```
analysis/
├── components/
│   └── wizard/           # Multi-step analysis wizard UI
│       ├── steps/        # Individual wizard steps
│       ├── analysis-wizard.tsx
│       ├── screenshot-review.tsx
│       ├── analysis-progress.tsx
│       └── analysis-complete.tsx
├── hooks/
│   ├── use-wizard-state.ts      # Main wizard state management
│   ├── use-capture-polling.ts   # Website capture job polling
│   ├── use-analysis-polling.ts  # AI analysis job polling
│   └── use-analysis-data.ts     # Analysis data management
├── types/
│   └── index.ts          # Analysis-specific TypeScript types
└── index.ts              # Feature exports
```

## Core Components

### Wizard Steps
1. **URL Input**: Website URL validation and normalization
2. **Organization**: Company/project name collection
3. **Site Purpose**: Understanding site goals for context
4. **Processing**: Website capture progress monitoring
5. **Screenshot Review**: Review captured content before analysis
6. **Analysis Progress**: AI analysis progress tracking
7. **Results**: Display completed analysis results

### State Management
- **Wizard State**: Central state for entire analysis workflow
- **Job Polling**: Real-time status updates for capture and analysis jobs
- **Error Handling**: Comprehensive error states and recovery

## API Integration
- **Capture Service**: `localhost:3001/api/capture` - Website screenshot service
- **Analysis Service**: `localhost:3002/api/analysis` - AI analysis service
- **Internal APIs**: `/api/start-analysis` - Analysis job coordination

## Key Hooks
- `useWizardState()`: Main state management for the entire workflow
- `useCapturePolling()`: Monitors website capture job progress
- `useAnalysisPolling()`: Tracks AI analysis job completion
- `useAnalysisData()`: Manages analysis input and results data

## Usage Example
```tsx
import { AnalysisWizard } from '@/features/analysis';

function AnalysisPage() {
  return <AnalysisWizard />;
}
```

## Dependencies
- External capture service for website screenshots
- External analysis service for AI-powered UX insights
- Real-time polling for job status updates
- Form validation and URL normalization utilities

## Development Notes
- Polling intervals are configurable via `POLLING_INTERVALS` constant
- All async operations include proper error handling and loading states
- State is managed through reducers for complex workflow coordination
- Job IDs are tracked for resume capability across page refreshes
