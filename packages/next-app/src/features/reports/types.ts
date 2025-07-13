// Re-export common types from global types
export type {
  ReportData,
  ReportManifestItem,
  PageAnalysisDetail,
  OverallSummary,
  PageIssue,
  PageRecommendation,
  PageSection
} from '@/types';

// Report-specific types
export interface ReportFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  scoreRange?: {
    min: number;
    max: number;
  };
  pageTypes?: string[];
}

export interface ReportSummaryStats {
  totalReports: number;
  avgScore: number;
  totalPagesAnalyzed: number;
  topIssues: string[];
  topRecommendations: string[];
}