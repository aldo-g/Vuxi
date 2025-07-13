"use client";

import { useCallback, useRef } from 'react';
import { API_ENDPOINTS, POLLING_INTERVALS } from '@/lib/constants';
import type { CaptureJob } from '../types';

export function useCapturePolling() {
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  const startPolling = useCallback((
    captureJobId: string,
    onUpdate: (job: CaptureJob) => void,
    onComplete: (job: CaptureJob) => void,
    onError: (error: string) => void
  ) => {
    if (pollingRef.current || isPollingRef.current) {
      return;
    }

    const poll = async () => {
      if (isPollingRef.current) return;
      
      isPollingRef.current = true;
      
      try {
        const response = await fetch(`${API_ENDPOINTS.CAPTURE}/${captureJobId}`);
        if (response.ok) {
          const jobData = await response.json();
          onUpdate(jobData);
          
          if (jobData.status === 'completed') {
            onComplete(jobData);
            stopPolling();
          } else if (jobData.status === 'failed') {
            onError(jobData.error || 'Capture process failed');
            stopPolling();
          }
        }
      } catch (err) {
        console.error('Error polling capture job status:', err);
      } finally {
        isPollingRef.current = false;
      }
    };

    pollingRef.current = setInterval(poll, POLLING_INTERVALS.CAPTURE_JOB);
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