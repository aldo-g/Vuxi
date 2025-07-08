"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Target, ArrowRight, ArrowLeft } from 'lucide-react';
import type { PurposeStepProps } from '../../../types';
import { CaptureStatus } from '../capture-status';

export function PurposeStep({ 
  sitePurpose, 
  onPurposeChange, 
  onNext, 
  onBack, 
  captureJob, 
  captureStarted 
}: PurposeStepProps) {
  return (
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
  );
}