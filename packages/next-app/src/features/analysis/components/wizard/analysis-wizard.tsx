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
            isLoading={isLoading}
            error={error}
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
            isLoading={isLoading}
            error={error}
          />
        );

      case 4:
        return (
          <ProcessingStep
            captureJob={captureJob}
            onNext={handleProcessingNext}
            onBack={handleBack}
            isLoading={isLoading}
            error={error}
          />
        );

      case 5:
        return (
          <ScreenshotReview
            screenshots={analysisData.screenshots || []}
            captureJobId={captureJob?.id || ''}
            onStartAnalysis={handleStartAnalysis}
            onBack={handleBack}
            isAnalyzing={isAnalyzing}
            updateAnalysisData={updateAnalysisData} // Pass the updateAnalysisData function
          />
        );

      case 6:
        return (
          <AnalysisProgress
            analysisJob={analysisJob}
            onBack={handleBack}
            isLoading={isLoading}
            error={error}
          />
        );

      case 7:
        return (
          <AnalysisComplete
            analysisJob={analysisJob}
            onRestart={handleRestart}
            onBack={handleBack}
            isLoading={isLoading}
            error={error}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {WIZARD_STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all
                    ${isActive 
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg' 
                      : isCompleted 
                        ? 'bg-green-500 text-white' 
                        : 'bg-white text-slate-400 border-2 border-slate-200'
                    }
                  `}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <StepIcon className="w-6 h-6" />
                    )}
                  </div>
                  <span className={`
                    text-sm font-medium text-center max-w-20
                    ${isActive ? 'text-green-600' : isCompleted ? 'text-green-500' : 'text-slate-400'}
                  `}>
                    {step.title}
                  </span>
                  {index < WIZARD_STEPS.length - 1 && (
                    <div className={`
                      absolute h-0.5 w-20 mt-6 translate-x-16
                      ${isCompleted ? 'bg-green-500' : 'bg-slate-200'}
                    `} />
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="text-center">
            <Badge variant="outline" className="bg-white border-slate-200">
              Step {currentStep} of {WIZARD_STEPS.length}
            </Badge>
          </div>
        </div>

        {/* Current Step Content */}
        <div className="mb-8">
          {renderCurrentStep()}
        </div>

        {/* Global Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}