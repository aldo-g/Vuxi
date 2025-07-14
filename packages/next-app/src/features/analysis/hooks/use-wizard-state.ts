/**
 * Wizard State Hook - Analysis Workflow Management
 * 
 * Complex state management hook that orchestrates the multi-step
 * analysis wizard including website capture, analysis polling,
 * and progress tracking.
 * 
 * @responsibilities
 * - Manages multi-step wizard state and navigation
 * - Handles website capture job initiation and polling
 * - Manages analysis job creation and progress tracking
 * - Coordinates polling intervals for job status updates
 * - Provides error handling and recovery mechanisms
 * - Maintains analysis data throughout the workflow
 */

"use client";

import { useState, useRef, useCallback } from 'react';
import { WIZARD_STEPS, API_ENDPOINTS, POLLING_INTERVALS } from '@/lib/constants';
import { validateAndNormalizeUrl } from '@/lib/validations';
import type { WizardState, AnalysisData, CaptureJob, AnalysisJob } from '../types';

const initialAnalysisData: AnalysisData = {
  websiteUrl: '',
  organizationName: '',
  sitePurpose: ''
};

const initialState: WizardState = {
  currentStep: 1,
  analysisData: initialAnalysisData,
  captureJob: null,
  analysisJob: null,
  isLoading: false,
  error: null,
  captureStarted: false,
  isAnalyzing: false
};

export function useWizardState() {
  const [state, setState] = useState<WizardState>(initialState);
  
  // Refs for polling intervals
  const capturePollingRef = useRef<NodeJS.Timeout | null>(null);
  const analysisPollingRef = useRef<NodeJS.Timeout | null>(null);
  const isCapturePollingRef = useRef(false);
  const isAnalysisPollingRef = useRef(false);

  // State updaters
  const updateAnalysisData = useCallback((updates: Partial<AnalysisData>) => {
    setState(prev => ({
      ...prev,
      analysisData: { ...prev.analysisData, ...updates }
    }));
  }, []);

  const setCurrentStep = useCallback((step: number) => {
    setState(prev => ({ ...prev, currentStep: step }));
  }, []);

  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const setCaptureJob = useCallback((job: CaptureJob | null) => {
    setState(prev => ({ ...prev, captureJob: job }));
  }, []);

  const setAnalysisJob = useCallback((job: AnalysisJob | null) => {
    setState(prev => ({ ...prev, analysisJob: job }));
  }, []);

  const setCaptureStarted = useCallback((started: boolean) => {
    setState(prev => ({ ...prev, captureStarted: started }));
  }, []);

  const setAnalyzing = useCallback((analyzing: boolean) => {
    setState(prev => ({ ...prev, isAnalyzing: analyzing }));
  }, []);

  // Capture job polling
  const pollCaptureJobStatus = useCallback(async () => {
    if (!state.captureJob?.id || isCapturePollingRef.current) return;
    
    isCapturePollingRef.current = true;
    
    try {
      const response = await fetch(`${API_ENDPOINTS.CAPTURE}/${state.captureJob.id}`);
      if (response.ok) {
        const jobData = await response.json();
        setCaptureJob(jobData);
        
        if (jobData.status === 'completed') {
          updateAnalysisData({ screenshots: jobData.results?.screenshots || [] });
          setCurrentStep(5);
          if (capturePollingRef.current) {
            clearInterval(capturePollingRef.current);
            capturePollingRef.current = null;
          }
        } else if (jobData.status === 'failed') {
          setError(jobData.error || 'Capture process failed');
          if (capturePollingRef.current) {
            clearInterval(capturePollingRef.current);
            capturePollingRef.current = null;
          }
        }
      }
    } catch (err) {
      console.error('Error polling capture job status:', err);
    } finally {
      isCapturePollingRef.current = false;
    }
  }, [state.captureJob?.id, setCaptureJob, updateAnalysisData, setCurrentStep, setError]);

  // Analysis job polling
  const pollAnalysisJobStatus = useCallback(async () => {
    if (!state.analysisJob?.id || isAnalysisPollingRef.current) return;
    
    isAnalysisPollingRef.current = true;
    
    try {
      const response = await fetch(`/api/start-analysis?jobId=${state.analysisJob.id}`);
      if (response.ok) {
        const jobData = await response.json();
        setAnalysisJob(jobData);
        
        if (jobData.status === 'completed') {
          setAnalyzing(false);
          
          if (jobData.results?.reportData) {
            sessionStorage.setItem('liveReportData', JSON.stringify(jobData.results.reportData));
            setTimeout(() => {
              window.location.href = '/report/live';
            }, 100);
          } else {
            setCurrentStep(7);
          }
          
          if (analysisPollingRef.current) {
            clearInterval(analysisPollingRef.current);
            analysisPollingRef.current = null;
          }
        } else if (jobData.status === 'failed') {
          setError(jobData.error || 'Analysis failed');
          setAnalyzing(false);
          if (analysisPollingRef.current) {
            clearInterval(analysisPollingRef.current);
            analysisPollingRef.current = null;
          }
        }
      }
    } catch (err) {
      console.error('Error polling analysis status:', err);
    } finally {
      isAnalysisPollingRef.current = false;
    }
  }, [state.analysisJob?.id, setAnalysisJob, setAnalyzing, setCurrentStep, setError]);

  // Start capture
  const startCapture = useCallback(async (url: string): Promise<boolean> => {
    const validation = validateAndNormalizeUrl(url);
    
    if (!validation.isValid) {
      setError(validation.error || 'Please enter a valid website URL');
      return false;
    }

    if (validation.normalizedUrl !== url) {
      updateAnalysisData({ websiteUrl: validation.normalizedUrl });
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.CAPTURE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl: validation.normalizedUrl,
          options: {
            maxPages: 10,
            timeout: 15000,
            concurrency: 3,
            fastMode: true
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to start capture process: ${errorText}`);
      }

      const result = await response.json();
      updateAnalysisData({ captureJobId: result.jobId });
      setCaptureJob({ 
        id: result.jobId, 
        status: result.status,
        progress: { stage: 'starting', percentage: 0, message: 'Starting capture...' }
      });
      setCaptureStarted(true);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start capture';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [updateAnalysisData, setCaptureJob, setCaptureStarted, setLoading, setError]);

  // Start analysis
  const startAnalysis = useCallback(async (): Promise<void> => {
    if (!state.analysisData.captureJobId || !state.analysisData.screenshots?.length) {
      setError('No screenshots available for analysis');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setCurrentStep(6);

    try {
      const response = await fetch('/api/start-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisData: state.analysisData,
          captureJobId: state.analysisData.captureJobId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to start analysis: ${errorText}`);
      }

      const result = await response.json();
      setAnalysisJob({
        id: result.analysisJobId,
        status: result.status,
        progress: { stage: 'starting', percentage: 0, message: 'Starting analysis...' },
        results: result.reportData ? { reportData: result.reportData } : undefined
      });

      // Start polling for analysis progress
      analysisPollingRef.current = setInterval(pollAnalysisJobStatus, POLLING_INTERVALS.ANALYSIS_JOB);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start analysis';
      setError(errorMessage);
      setAnalyzing(false);
      setCurrentStep(5);
    }
  }, [state.analysisData, setAnalyzing, setError, setCurrentStep, setAnalysisJob, pollAnalysisJobStatus]);

  // Start polling when needed
  const startCapturePolling = useCallback(() => {
    if (capturePollingRef.current) return;
    capturePollingRef.current = setInterval(pollCaptureJobStatus, POLLING_INTERVALS.CAPTURE_JOB);
  }, [pollCaptureJobStatus]);

  // Reset wizard
  const resetWizard = useCallback(() => {
    // Clear intervals
    if (capturePollingRef.current) {
      clearInterval(capturePollingRef.current);
      capturePollingRef.current = null;
    }
    if (analysisPollingRef.current) {
      clearInterval(analysisPollingRef.current);
      analysisPollingRef.current = null;
    }
    
    // Reset state
    setState(initialState);
  }, []);

  return {
    // State
    ...state,
    
    // Actions
    updateAnalysisData,
    setCurrentStep,
    setLoading,
    setError,
    setCaptureJob,
    setAnalysisJob,
    setCaptureStarted,
    setAnalyzing,
    
    // Async actions
    startCapture,
    startAnalysis,
    startCapturePolling,
    resetWizard,
    
    // Polling functions
    pollCaptureJobStatus,
    pollAnalysisJobStatus
  };
}