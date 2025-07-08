"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  Camera, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Clock 
} from 'lucide-react';
import type { CaptureJob } from '../../../types';

interface ProcessingStepProps {
  captureJob: CaptureJob | null;
  onNext: () => void;
  onBack: () => void;
}

export function ProcessingStep({ captureJob, onNext, onBack }: ProcessingStepProps) {
  return (
    <Card className="border-slate-200 bg-white shadow-lg">
      <CardHeader className="text-center pb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Camera className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-semibold">Capturing Screenshots</CardTitle>
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
                  onClick={onBack}
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
                onClick={onBack}
                variant="outline"
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={onNext}
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
}