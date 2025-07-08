"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle2, RotateCcw, ExternalLink } from 'lucide-react';

interface AnalysisCompleteProps {
  onRestart: () => void;
}

export function AnalysisComplete({ onRestart }: AnalysisCompleteProps) {
  return (
    <Card className="border-slate-200 bg-white shadow-lg">
      <CardHeader className="text-center pb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-semibold">Analysis Complete!</CardTitle>
        <p className="text-slate-600 mt-2">
          Your website analysis has been completed successfully.
        </p>
      </CardHeader>
      <CardContent className="space-y-6 text-center">
        <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            Your UX Analysis Report is Ready
          </h3>
          <p className="text-green-700 mb-4">
            We've generated a comprehensive analysis of your website's user experience, 
            including actionable recommendations for improvement.
          </p>
          <Button 
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => window.location.href = '/report/live'}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Your Report
          </Button>
        </div>

        <div className="pt-4 border-t border-slate-200">
          <Button 
            onClick={onRestart}
            variant="outline"
            className="w-full"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Start New Analysis
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}