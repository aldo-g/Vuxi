"use client";

import React, { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import type { CaptureJob } from '../../types';

interface CaptureStatusProps {
  captureJob: CaptureJob | null;
  captureStarted: boolean;
}

export const CaptureStatus = memo(function CaptureStatus({ 
  captureJob, 
  captureStarted 
}: CaptureStatusProps) {
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

  if (captureJob.status === 'failed') {
    return (
      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>Analysis failed: {captureJob.error || 'Unknown error'}</span>
        </div>
      </div>
    );
  }

  if (!['completed', 'failed'].includes(captureJob.status)) {
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