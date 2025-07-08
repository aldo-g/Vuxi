// User and Authentication Types
export interface User {
  id: string;
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
  total_pages_analyzed: number;
  most_critical_issues: string[];
  top_recommendations: string[];
  key_strengths: string[];
  performance_summary: string;
  detailed_markdown_content: string;
}

export interface ReportMetadata {
  organization_name?: string;
  generated_at?: string;
  total_pages?: number;
}

export interface ReportData {
  organization?: string;
  analysis_date?: string;
  timestamp?: string;
  overall_summary: OverallSummary;
  page_analyses: PageAnalysisDetail[];
  metadata?: ReportMetadata;
  screenshots?: { [key: string]: string };
}

export interface ReportManifestItem {
  id: string;
  name: string;
  date: string;
  description?: string;
}

// Common UI Types
export interface WizardStep {
  id: number;
  title: string;
  icon: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Form Types
export interface AuthFormData {
  email: string;
  password: string;
  name?: string;
}

export interface ValidationResult {
  isValid: boolean;
  normalizedUrl?: string;
  error?: string;
  errors?: string[];
}