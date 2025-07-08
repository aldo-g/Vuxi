"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle2, ArrowLeft, Zap } from 'lucide-react';
import { ScreenshotGrid } from '../screenshots';
import { AnalysisSummary } from '../analysis-summary';
import type { ScreenshotReviewProps } from '../../types';

export function ScreenshotReview({
  screenshots,
  captureJobId,
  onStartAnalysis,
  onBack,
  isAnalyzing
}: ScreenshotReviewProps) {
  const [selectedScreenshotIndex, setSelectedScreenshotIndex] = useState<number | null>(null);

  const handleScreenshotClick = (index: number) => {
    setSelectedScreenshotIndex(index);
    // You can implement a modal/lightbox here if needed
  };

  const handleEditClick = (index: number) => {
    // Implement screenshot editing functionality
    console.log('Edit screenshot at index:', index);
  };

  const handleDeleteClick = (index: number) => {
    // Implement screenshot deletion functionality
    console.log('Delete screenshot at index:', index);
  };

  const handleAddClick = () => {
    // Implement add screenshot functionality
    console.log('Add new screenshot');
  };

  return (
    <Card className="border-slate-200 bg-white shadow-lg">
      <CardHeader className="text-center pb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-semibold">Review Captured Screenshots</CardTitle>
        <p className="text-slate-600 mt-2">
          Review the captured screenshots and start the AI analysis when ready.
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Screenshot Grid */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Captured Pages ({screenshots.length})</h3>
          <ScreenshotGrid
            screenshots={screenshots}
            captureJobId={captureJobId}
            onScreenshotClick={handleScreenshotClick}
            onEditClick={handleEditClick}
            onDeleteClick={handleDeleteClick}
            onAddClick={handleAddClick}
          />
        </div>

        {/* Analysis Summary */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Analysis Configuration</h3>
          <AnalysisSummary analysisData={{
            websiteUrl: screenshots[0]?.url || '',
            organizationName: 'Current Analysis',
            sitePurpose: 'Website analysis',
            screenshots
          }} />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6 border-t border-slate-200">
          <Button 
            onClick={onBack}
            variant="outline"
            className="flex-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button 
            onClick={onStartAnalysis}
            disabled={screenshots.length === 0 || isAnalyzing}
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            <Zap className="w-4 h-4 mr-2" />
            {isAnalyzing ? 'Starting Analysis...' : 'Start AI Analysis'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}