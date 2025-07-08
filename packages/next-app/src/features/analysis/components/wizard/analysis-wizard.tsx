"use client";

import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle } from 'lucide-react';
import { WIZARD_STEPS } from '@/lib/constants';
import { useWizardState } from '../../hooks/use-wizard-state';
import { 
  UrlInputStep, 
  OrganizationStep, 
  PurposeStep, 
  ProcessingStep 
} from './steps';
import { ScreenshotReview } from './screenshot-review';
import { AnalysisProgress } from './analysis-progress';
import { AnalysisComplete } from './analysis-complete';

export function AnalysisWizard() {
  const {
    currentStep,
    analysisData,
    captureJob,
    analysisJob,
    isLoading,
    error,
    captureStarted,
    isAnalyzing,
    updateAnalysisData,
    setCurrentStep,
    startCapture,
    startAnalysis,
    startCapturePolling,
    resetWizard
  } = useWizardState();

  // Start polling when capture job exists and is not completed/failed
  useEffect(() => {
    if (captureJob && !['completed', 'failed'].includes(captureJob.status)) {
      startCapturePolling();
    }
  }, [captureJob, startCapturePolling]);

  const handleUrlNext = async () => {
    const success = await startCapture(analysisData.websiteUrl);
    if (success) {
      setCurrentStep(2);
    }
  };

  const handleOrganizationNext = () => {
    setCurrentStep(3);
  };

  const handlePurposeNext = () => {
    // If capture is still running, go to processing step
    if (captureJob && !['completed', 'failed'].includes(captureJob.status)) {
      setCurrentStep(4);
    } else if (captureJob?.status === 'completed') {
      // If capture is done, go directly to review
      setCurrentStep(5);
    }
  };

  const handleProcessingNext = () => {
    setCurrentStep(5);
  };

  const handleStartAnalysis = async () => {
    await startAnalysis();
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleRestart = () => {
    resetWizard();
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <UrlInputStep
            websiteUrl={analysisData.websiteUrl}
            onUrlChange={(url) => updateAnalysisData({ websiteUrl: url })}
            onNext={handleUrlNext}
            onBack={() => {}}
            isLoading={isLoading}
            error={error}
          />
        );

      case 2:
        return (
          <OrganizationStep
            organizationName={analysisData.organizationName}
            onOrgChange={(name) => updateAnalysisData({ organizationName: name })}
            onNext={handleOrganizationNext}
            onBack={handleBack}
            captureJob={captureJob}
            captureStarted={captureStarted}
          />
        );

      case 3:
        return (
          <PurposeStep
            sitePurpose={analysisData.sitePurpose}
            onPurposeChange={(purpose) => updateAnalysisData({ sitePurpose: purpose })}
            onNext={handlePurposeNext}
            onBack={handleBack}
            captureJob={captureJob}
            captureStarted={captureStarted}
          />
        );

      case 4:
        return (
          <ProcessingStep
            captureJob={captureJob}
            onNext={handleProcessingNext}
            onBack={handleBack}
          />
        );

      case 5:
        return (
          <ScreenshotReview
            screenshots={analysisData.screenshots || []}
            captureJobId={analysisData.captureJobId || ''}
            onStartAnalysis={handleStartAnalysis}
            onBack={handleBack}
            isAnalyzing={isAnalyzing}
          />
        );

      case 6:
        return (
          <AnalysisProgress
            analysisJob={analysisJob}
          />
        );

      case 7:
        return (
          <AnalysisComplete
            onRestart={handleRestart}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-12">
        <div className="flex items-center justify-between">
          {WIZARD_STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            const isAccessible = currentStep >= step.id;

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300
                      ${isCompleted 
                        ? 'bg-green-500 text-white shadow-lg shadow-green-200' 
                        : isActive 
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-200 scale-110' 
                        : isAccessible
                        ? 'bg-slate-200 text-slate-600'
                        : 'bg-slate-100 text-slate-400'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <StepIcon className={`w-6 h-6 ${isActive ? 'animate-pulse' : ''}`} />
                    )}
                  </div>
                  <Badge 
                    variant={isActive ? 'default' : isCompleted ? 'secondary' : 'outline'}
                    className="text-xs font-medium px-2 py-1"
                  >
                    {step.title}
                  </Badge>
                </div>
                {index < WIZARD_STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mx-4 mb-6">
                    <div 
                      className={`
                        h-full transition-all duration-500
                        ${currentStep > step.id 
                          ? 'bg-green-500' 
                          : 'bg-slate-200'
                        }
                      `}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Step Content */}
      <div className="min-h-[600px]">
        {renderCurrentStep()}
      </div>

      {/* Error Display */}
      {error && (
        <Card className="mt-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <Circle className="w-4 h-4 fill-current" />
              <span className="font-medium">Error:</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}