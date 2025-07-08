// Re-export common types that are used across features
export type {
  AnalysisData,
  Screenshot,
  ScreenshotData,
  CaptureJob,
  AnalysisJob,
  WizardStep
} from '@/types';

// Analysis-specific types
export interface WizardState {
  currentStep: number;
  analysisData: AnalysisData;
  captureJob: CaptureJob | null;
  analysisJob: AnalysisJob | null;
  isLoading: boolean;
  error: string | null;
  captureStarted: boolean;
  isAnalyzing: boolean;
}

export interface StepProps {
  onNext: () => void;
  onBack: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export interface UrlStepProps extends StepProps {
  websiteUrl: string;
  onUrlChange: (url: string) => void;
}

export interface OrganizationStepProps extends StepProps {
  organizationName: string;
  onOrgChange: (name: string) => void;
  captureJob: CaptureJob | null;
  captureStarted: boolean;
}

export interface PurposeStepProps extends StepProps {
  sitePurpose: string;
  onPurposeChange: (purpose: string) => void;
  captureJob: CaptureJob | null;
  captureStarted: boolean;
}

export interface ScreenshotReviewProps {
  screenshots: Screenshot[];
  captureJobId: string;
  onStartAnalysis: () => void;
  onBack: () => void;
  isAnalyzing: boolean;
}