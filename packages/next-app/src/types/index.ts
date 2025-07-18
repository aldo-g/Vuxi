/**
 * Type Definitions - Application-Wide TypeScript Types
 * 
 * Centralized TypeScript type definitions for the entire
 * application including API responses, component props,
 * data models, and interface contracts.
 * 
 * @responsibilities
 * - Defines data models for reports, analyses, and jobs
 * - Specifies API response and request types
 * - Provides component prop type definitions
 * - Ensures type safety across the application
 * - Documents data structure contracts
 */

export interface User {
  id: number;
  Name: string;
  email: string;
}

export interface Project {
  id: number;
  name: string;
  baseUrl: string;
  createdAt: string;
}

// Analysis Types
export interface AnalysisData {
  websiteUrl: string;
  organizationName: string;
  sitePurpose: string;
  captureJobId?: string;
  screenshots?: Screenshot[];
  userId?: number; // Added userId field
}

export interface Screenshot {
  url: string;
  success: boolean;
  data?: ScreenshotData;
  error?: string | null;
}

export interface ScreenshotData {
  url?: string;
  filename?: string;
  path?: string;
  timestamp?: string;
  duration_ms?: number;
  viewport?: {
    width: number;
    height: number;
  };
  isCustom?: boolean;
  dataUrl?: string;
  customPageName?: string;
}

// Job Types
export interface CaptureJob {
  id: string;
  status: 'pending' | 'running' | 'url_discovery' | 'screenshot_capture' | 'completed' | 'failed';
  progress: {
    stage: string;
    percentage: number;
    message: string;
  };
  results?: {
    screenshots: Screenshot[];
    urls: string[];
    stats?: {
      screenshots?: {
        duration: number;
        successful: number;
        failed: number;
      };
    };
  };
  error?: string;
}

export interface AnalysisJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: {
    stage: string;
    percentage: number;
    message: string;
  };
  results?: {
    reportPath?: string;
    lighthouse?: any;
    llmAnalysis?: any;
    formatting?: any;
    htmlReport?: any;
    reportData?: any;
  };
  error?: string;
}

// New types for saving capture data
export interface SaveCaptureRequest {
  analysisData: AnalysisData;
  captureJobId: string;
  userId: number;
}

export interface SaveCaptureResponse {
  success: boolean;
  projectId: number;
  analysisRunId: number;
  error?: string;
}

// Report Types
export interface PageIssue {
  issue: string;
  how_to_fix?: string;
}

export interface PageRecommendation {
  recommendation: string;
  benefit?: string;
}

export interface PageSection {
  name: string;
  title: string;
  score: number;
  summary: string;
  points: string[];
  evidence: string;
  score_explanation: string;
  rawContent?: string;
}

export interface PageAnalysisDetail {
  id: string;
  page_type: string;
  title: string;
  overall_score: number;
  url: string;
  section_scores: { [key: string]: number };
  key_issues: PageIssue[];
  recommendations: PageRecommendation[];
  summary: string;
  overall_explanation?: string;
  sections?: PageSection[];
  detailed_analysis?: string;
  raw_analysis?: string;
  screenshot_path?: string;
}

export interface OverallSummary {
  executive_summary: string;
  overall_score: number;
  site_score_explanation?: string;
  key_strengths: string[];
  priority_improvements: string[];
  recommendations: PageRecommendation[];
}

export interface ReportData {
  overall_summary: OverallSummary;
  page_analyses: PageAnalysisDetail[];
  metadata: ReportMetadata;
  screenshots?: { [key: string]: string };
}

export interface ReportMetadata {
  analysis_timestamp: string;
  website_url: string;
  organization_name: string;
  site_purpose: string;
  total_pages_analyzed: number;
  analysis_version: string;
}