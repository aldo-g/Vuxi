"use client";

import { useCallback, useRef } from 'react';
import { POLLING_INTERVALS } from '@/lib/constants';
import type { AnalysisJob } from '../types';

export function useAnalysisPolling() {
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  const startPolling = useCallback((
    analysisJobId: string,
    onUpdate: (job: AnalysisJob) => void,
    onComplete: (job: AnalysisJob) => void,
    onError: (error: string) => void
  ) => {
    if (pollingRef.current || isPollingRef.current) {
      return;
    }

    const poll = async () => {
      if (isPollingRef.current) return;
      
      isPollingRef.current = true;
      
      try {
        const response = await fetch(`/api/start-analysis?jobId=${analysisJobId}`);
        if (response.ok) {
          const jobData = await response.json();
          onUpdate(jobData);
          
          if (jobData.status === 'completed') {
            onComplete(jobData);
            stopPolling();
          } else if (jobData.status === 'failed') {
            onError(jobData.error || 'Analysis failed');
            stopPolling();
          }
        }
      } catch (err) {
        console.error('Error polling analysis status:', err);
      } finally {
        isPollingRef.current = false;
      }
    };

    pollingRef.current = setInterval(poll, POLLING_INTERVALS.ANALYSIS_JOB);
    poll(); // Initial poll
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    isPollingRef.current = false;
  }, []);

  return {
    startPolling,
    stopPolling,
    isPolling: !!pollingRef.current
  };
}