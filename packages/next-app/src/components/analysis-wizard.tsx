"use client";

import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Globe, 
  Building2, 
  Target, 
  Camera, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  Clock
} from 'lucide-react';

// Types
interface CaptureJob {
  id: string;
  status: 'pending' | 'running' | 'url_discovery' | 'screenshot_capture' | 'completed' | 'failed';
  progress: {
    stage: string;
    percentage: number;
    message: string;
  };
  results?: {
    screenshots: Array<{
      url: string;
      filename: string;
      path: string;
    }>;
    urls: string[];
  };
  error?: string;
}

interface AnalysisData {
  websiteUrl: string;
  organizationName: string;
  sitePurpose: string;
  captureJobId?: string;
  screenshots?: Array<{
    url: string;
    filename: string;
    path: string;
  }>;
}

const WIZARD_STEPS = [
  { id: 1, title: 'Website URL', icon: Globe },
  { id: 2, title: 'Organization', icon: Building2 },
  { id: 3, title: 'Site Purpose', icon: Target },
  { id: 4, title: 'Processing', icon: Camera },
  { id: 5, title: 'Review Captures', icon: CheckCircle2 }
];

// Separate component for capture status to isolate re-renders
const CaptureStatus = memo(({ captureJob, captureStarted }: { captureJob: CaptureJob | null, captureStarted: boolean }) => {
  if (!captureStarted || !captureJob) return null;

  if (captureJob.status === 'completed') {
    return (
      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2 text-green-700 text-sm">
          <CheckCircle2 className="w-4 h-4" />
          <span>Website analysis completed!</span>
        </div>
      </div>
    );
  }

  if (captureJob.status !== 'completed') {
    return (
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 text-blue-700 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Website analysis running in background...</span>
          <Badge variant="secondary" className="text-xs">
            {captureJob.progress.percentage}%
          </Badge>
        </div>
      </div>
    );
  }

  return null;
});

CaptureStatus.displayName = 'CaptureStatus';

// Memoized form components that won't re-render unless their specific props change
const URLInputStep = memo(({ 
  websiteUrl, 
  onUrlChange, 
  onNext, 
  isLoading, 
  error 
}: {
  websiteUrl: string;
  onUrlChange: (url: string) => void;
  onNext: () => void;
  isLoading: boolean;
  error: string | null;
}) => (
  <Card className="border-slate-200 bg-white shadow-lg">
    <CardHeader className="text-center pb-6">
      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Globe className="w-8 h-8 text-white" />
      </div>
      <CardTitle className="text-2xl font-semibold">Enter Website URL</CardTitle>
      <p className="text-slate-600 mt-2">
        Which website would you like to analyze? We'll start capturing data while you provide additional details.
      </p>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="website-url" className="text-sm font-medium">
          Website URL
        </Label>
        <Input
          id="website-url"
          type="url"
          placeholder="https://example.com"
          value={websiteUrl}
          onChange={(e) => onUrlChange(e.target.value)}
          className="text-lg py-3"
        />
        <p className="text-xs text-slate-500">
          Enter the full URL including https://
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <Button 
        onClick={onNext}
        disabled={!websiteUrl || isLoading}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Starting Analysis...
          </>
        ) : (
          <>
            Continue
            <ArrowRight className="w-5 h-5 ml-2" />
          </>
        )}
      </Button>
    </CardContent>
  </Card>
));

URLInputStep.displayName = 'URLInputStep';

const OrganizationStep = memo(({ 
  organizationName, 
  onOrgChange, 
  onNext, 
  onBack, 
  captureJob, 
  captureStarted 
}: {
  organizationName: string;
  onOrgChange: (name: string) => void;
  onNext: () => void;
  onBack: () => void;
  captureJob: CaptureJob | null;
  captureStarted: boolean;
}) => (
  <Card className="border-slate-200 bg-white shadow-lg">
    <CardHeader className="text-center pb-6">
      <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Building2 className="w-8 h-8 text-white" />
      </div>
      <CardTitle className="text-2xl font-semibold">Organization Details</CardTitle>
      <p className="text-slate-600 mt-2">
        Tell us about the organization whose website we're analyzing.
      </p>
      
      <CaptureStatus captureJob={captureJob} captureStarted={captureStarted} />
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="org-name" className="text-sm font-medium">
          Organization Name
        </Label>
        <Input
          id="org-name"
          type="text"
          placeholder="e.g., Acme Corporation"
          value={organizationName}
          onChange={(e) => onOrgChange(e.target.value)}
          className="text-lg py-3"
        />
      </div>

      <div className="flex gap-3">
        <Button 
          onClick={onBack}
          variant="outline"
          className="flex-1"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button 
          onClick={onNext}
          disabled={!organizationName.trim()}
          className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </CardContent>
  </Card>
));

OrganizationStep.displayName = 'OrganizationStep';

const PurposeStep = memo(({ 
  sitePurpose, 
  onPurposeChange, 
  onNext, 
  onBack, 
  captureJob, 
  captureStarted 
}: {
  sitePurpose: string;
  onPurposeChange: (purpose: string) => void;
  onNext: () => void;
  onBack: () => void;
  captureJob: CaptureJob | null;
  captureStarted: boolean;
}) => (
  <Card className="border-slate-200 bg-white shadow-lg">
    <CardHeader className="text-center pb-6">
      <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Target className="w-8 h-8 text-white" />
      </div>
      <CardTitle className="text-2xl font-semibold">Website Purpose</CardTitle>
      <p className="text-slate-600 mt-2">
        What is the main purpose or goal of this website?
      </p>
      
      <CaptureStatus captureJob={captureJob} captureStarted={captureStarted} />
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="site-purpose" className="text-sm font-medium">
          Site Purpose & Goals
        </Label>
        <Textarea
          id="site-purpose"
          placeholder="e.g., E-commerce store selling sustainable products, Portfolio website for a design agency, Educational platform for online courses..."
          value={sitePurpose}
          onChange={(e) => onPurposeChange(e.target.value)}
          className="min-h-[120px] resize-none"
        />
        <p className="text-xs text-slate-500">
          Describe the website's main objectives, target audience, and key functions
        </p>
      </div>

      <div className="flex gap-3">
        <Button 
          onClick={onBack}
          variant="outline"
          className="flex-1"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button 
          onClick={onNext}
          disabled={!sitePurpose.trim()}
          className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </CardContent>
  </Card>
));

PurposeStep.displayName = 'PurposeStep';

export function AnalysisWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [analysisData, setAnalysisData] = useState<AnalysisData>({
    websiteUrl: '',
    organizationName: '',
    sitePurpose: ''
  });
  const [captureJob, setCaptureJob] = useState<CaptureJob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captureStarted, setCaptureStarted] = useState(false);
  
  // Use refs to avoid re-renders
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  // Separate polling logic that doesn't affect form rendering
  useEffect(() => {
    const startPolling = async () => {
      if (!captureJob?.id || ['completed', 'failed'].includes(captureJob.status) || isPollingRef.current) {
        return;
      }

      isPollingRef.current = true;

      const poll = async () => {
        try {
          const response = await fetch(`http://localhost:3001/api/capture/${captureJob.id}`);
          if (response.ok) {
            const updatedJob = await response.json();
            
            // Only update if status actually changed
            setCaptureJob(prevJob => {
              if (!prevJob || 
                  prevJob.status !== updatedJob.status || 
                  Math.abs(prevJob.progress.percentage - updatedJob.progress.percentage) >= 5) { // Only update on significant progress changes
                return updatedJob;
              }
              return prevJob;
            });
            
            if (updatedJob.status === 'completed') {
              setAnalysisData(prev => ({ 
                ...prev, 
                screenshots: updatedJob.results?.screenshots || [] 
              }));
              
              // Clear polling
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
              isPollingRef.current = false;
              
              // Auto-advance if on processing step
              if (currentStep === 4) {
                setTimeout(() => setCurrentStep(5), 1000);
              }
            } else if (updatedJob.status === 'failed') {
              setError(updatedJob.error || 'Capture process failed');
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
              isPollingRef.current = false;
            }
          }
        } catch (err) {
          console.error('Error polling job status:', err);
        }
      };

      // Start polling
      pollingIntervalRef.current = setInterval(poll, 5000); // Even less frequent polling
      poll(); // Initial poll
    };

    if (captureJob?.id && !['completed', 'failed'].includes(captureJob.status)) {
      startPolling();
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      isPollingRef.current = false;
    };
  }, [captureJob?.id, captureJob?.status, currentStep]);

  // Memoized handlers to prevent re-renders
  const handleUrlChange = useCallback((url: string) => {
    setAnalysisData(prev => ({ ...prev, websiteUrl: url }));
  }, []);

  const handleOrgChange = useCallback((name: string) => {
    setAnalysisData(prev => ({ ...prev, organizationName: name }));
  }, []);

  const handlePurposeChange = useCallback((purpose: string) => {
    setAnalysisData(prev => ({ ...prev, sitePurpose: purpose }));
  }, []);

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const startCapture = async (url: string) => {
    if (!validateUrl(url)) {
      setError('Please enter a valid website URL');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl: url,
          options: {
            maxPages: 10,
            timeout: 15000,
            concurrency: 3,
            fastMode: true
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start capture process');
      }

      const result = await response.json();
      setAnalysisData(prev => ({ ...prev, captureJobId: result.jobId }));
      setCaptureJob({ 
        id: result.jobId, 
        status: result.status,
        progress: { stage: 'starting', percentage: 0, message: 'Starting capture...' }
      });
      setCaptureStarted(true);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start capture');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextFromURL = async () => {
    const success = await startCapture(analysisData.websiteUrl);
    if (success) {
      setCurrentStep(2);
    }
  };

  const handleNextFromOrg = () => {
    if (analysisData.organizationName.trim()) {
      setCurrentStep(3);
    }
  };

  const handleNextFromPurpose = () => {
    if (analysisData.sitePurpose.trim()) {
      if (captureJob?.status === 'completed') {
        setCurrentStep(5);
      } else if (captureJob?.status === 'failed') {
        setError(captureJob.error || 'Capture process failed');
      } else {
        setCurrentStep(4);
      }
    }
  };

  const getScreenshotUrl = (screenshot: any, jobId: string) => {
    const baseUrl = `http://localhost:3001/data/job_${jobId}`;
    
    if (screenshot.path.startsWith('screenshots/')) {
      return `${baseUrl}/${screenshot.path}`;
    } else if (screenshot.filename) {
      return `${baseUrl}/screenshots/desktop/${screenshot.filename}`;
    } else {
      return `${baseUrl}/screenshots/desktop/${screenshot.path}`;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <URLInputStep
            websiteUrl={analysisData.websiteUrl}
            onUrlChange={handleUrlChange}
            onNext={handleNextFromURL}
            isLoading={isLoading}
            error={error}
          />
        );
      case 2:
        return (
          <OrganizationStep
            organizationName={analysisData.organizationName}
            onOrgChange={handleOrgChange}
            onNext={handleNextFromOrg}
            onBack={() => setCurrentStep(1)}
            captureJob={captureJob}
            captureStarted={captureStarted}
          />
        );
      case 3:
        return (
          <PurposeStep
            sitePurpose={analysisData.sitePurpose}
            onPurposeChange={handlePurposeChange}
            onNext={handleNextFromPurpose}
            onBack={() => setCurrentStep(2)}
            captureJob={captureJob}
            captureStarted={captureStarted}
          />
        );
      case 4:
        return <ProcessingStep />;
      case 5:
        return <ScreenshotReviewStep />;
      default:
        return null;
    }
  };

  const ProcessingStep = () => (
    <Card className="border-slate-200 bg-white shadow-lg">
      <CardHeader className="text-center pb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Camera className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-semibold">Finalizing Website Analysis</CardTitle>
        <p className="text-slate-600 mt-2">
          We're just finishing up the website capture process. This should only take a moment more.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {captureJob && (
          <>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700">Progress</span>
                <span className="text-sm text-slate-500">{captureJob.progress.percentage}%</span>
              </div>
              <Progress value={captureJob.progress.percentage} className="h-2" />
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-2">
                  {captureJob.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : captureJob.status === 'failed' ? (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  ) : (
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  )}
                  <Badge variant={
                    captureJob.status === 'completed' ? 'default' :
                    captureJob.status === 'failed' ? 'destructive' : 'secondary'
                  }>
                    {captureJob.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-slate-600">{captureJob.progress.message}</p>
            </div>

            {captureJob.status === 'failed' && captureJob.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{captureJob.error}</p>
                <Button 
                  onClick={() => setCurrentStep(1)}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                onClick={() => setCurrentStep(3)}
                variant="outline"
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={() => setCurrentStep(5)}
                disabled={captureJob.status !== 'completed'}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {captureJob.status === 'completed' ? (
                  <>
                    View Results
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 mr-2" />
                    Please Wait...
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  const ScreenshotReviewStep = () => (
    <Card className="border-slate-200 bg-white shadow-lg">
      <CardHeader className="text-center pb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-semibold">Review Captured Screenshots</CardTitle>
        <p className="text-slate-600 mt-2">
          Here are the pages we captured for analysis. Review them before proceeding.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {analysisData.screenshots && analysisData.screenshots.length > 0 ? (
          <>
            <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 font-medium">
                Successfully captured {analysisData.screenshots.length} screenshots
              </p>
            </div>
            
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-slate-900">Analysis Summary</h4>
              <div className="text-sm text-slate-600 space-y-1">
                <p><strong>Website:</strong> {analysisData.websiteUrl}</p>
                <p><strong>Organization:</strong> {analysisData.organizationName}</p>
                <p><strong>Purpose:</strong> {analysisData.sitePurpose}</p>
                <p><strong>Pages Captured:</strong> {analysisData.screenshots.length}</p>
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {analysisData.screenshots.map((screenshot, index) => (
                <div key={index} className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="aspect-video bg-slate-100 relative">
                    <img 
                      src={getScreenshotUrl(screenshot, analysisData.captureJobId!)}
                      alt={`Screenshot of ${screenshot.url}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        console.log('Image failed to load:', target.src);
                        const originalSrc = target.src;
                        if (originalSrc.includes('/screenshots/desktop/')) {
                          target.src = `http://localhost:3001/data/job_${analysisData.captureJobId}/${screenshot.filename || screenshot.path}`;
                        } else {
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y4ZmFmYyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic3lzdGVtLXVpIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjM3NGIzIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2UgTm90IEF2YWlsYWJsZTwvdGV4dD48L3N2Zz4=';
                        }
                      }}
                    />
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <ExternalLink className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-600 truncate font-mono text-xs" title={screenshot.url}>
                        {screenshot.url}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {screenshot.filename || screenshot.path}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => setCurrentStep(3)}
                variant="outline"
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={() => {
                  alert(`Ready to proceed to LLM analysis!\n\nAnalysis Data:\n- Website: ${analysisData.websiteUrl}\n- Organization: ${analysisData.organizationName}\n- Purpose: ${analysisData.sitePurpose}\n- Screenshots: ${analysisData.screenshots?.length || 0}`);
                }}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                Start LLM Analysis
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Screenshots Available</h3>
            <p className="text-slate-600 mb-4">The capture process may have failed or is still in progress.</p>
            <Button onClick={() => setCurrentStep(1)} variant="outline">
              Start Over
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {WIZARD_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            const isAccessible = currentStep >= step.id;

            return (
              <div key={step.id} className="flex flex-col items-center relative">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-green-600 text-white' 
                      : isActive 
                        ? 'bg-blue-600 text-white' 
                        : isAccessible
                          ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <span className={`text-xs mt-2 font-medium transition-colors ${
                  isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-slate-500'
                }`}>
                  {step.title}
                </span>
                {index < WIZARD_STEPS.length - 1 && (
                  <div className={`absolute top-5 left-10 w-full h-0.5 -z-10 transition-colors ${
                    isCompleted ? 'bg-green-600' : 'bg-slate-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="transition-all duration-300 ease-in-out">
        {renderStepContent()}
      </div>
    </div>
  );
}