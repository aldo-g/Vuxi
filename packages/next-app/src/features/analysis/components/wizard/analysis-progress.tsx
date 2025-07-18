"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle2, ArrowLeft, Zap } from 'lucide-react';
import { ScreenshotGrid } from '../screenshots';
import { AnalysisSummary } from '../analysis-summary';
import { useToast } from '@/hooks/use-toast';
import type { ScreenshotReviewProps } from '../../types';
import type { Screenshot } from '@/types';

export function ScreenshotReview({
  screenshots,
  captureJobId,
  onStartAnalysis,
  onBack,
  isAnalyzing,
  updateAnalysisData
}: ScreenshotReviewProps) {
  const [selectedScreenshotIndex, setSelectedScreenshotIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const handleScreenshotClick = (index: number) => {
    setSelectedScreenshotIndex(index);
    // You can implement a modal/lightbox here if needed
  };

  const handleEditClick = (index: number) => {
    // Implement screenshot editing functionality
    console.log('Edit screenshot at index:', index);
    // TODO: Implement edit functionality - could open a modal to edit screenshot details
  };

  const handleDeleteClick = (index: number) => {
    const screenshotToDelete = screenshots[index];
    
    // Create a new array without the screenshot at the specified index
    const updatedScreenshots = screenshots.filter((_, i) => i !== index);
    
    // Update the analysis data with the new screenshots array
    updateAnalysisData({ screenshots: updatedScreenshots });
    
    // Reset selected index if it was the deleted one
    if (selectedScreenshotIndex === index) {
      setSelectedScreenshotIndex(null);
    } else if (selectedScreenshotIndex !== null && selectedScreenshotIndex > index) {
      setSelectedScreenshotIndex(selectedScreenshotIndex - 1);
    }
    
    // Show success toast
    toast({
      title: "Screenshot deleted",
      description: `Removed screenshot of ${screenshotToDelete.url}`,
      variant: "default"
    });
    
    console.log(`Deleted screenshot at index ${index}. Remaining screenshots: ${updatedScreenshots.length}`);
  };

  const handleAddClick = () => {
    // Implement add screenshot functionality
    console.log('Add new screenshot');
    // TODO: Implement add functionality - could open a modal to add custom screenshot URL
  };

  const handleViewFullSize = (index: number) => {
    // Implement full size view functionality
    const screenshot = screenshots[index];
    if (screenshot?.success && screenshot.data?.dataUrl) {
      // Open in a new tab/window
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>Screenshot - ${screenshot.url}</title>
              <style>
                body { margin: 0; padding: 20px; background: #f5f5f5; text-align: center; }
                img { max-width: 100%; height: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                .info { margin-bottom: 20px; font-family: Arial, sans-serif; color: #333; }
              </style>
            </head>
            <body>
              <div class="info">
                <h2>Screenshot Preview</h2>
                <p><strong>URL:</strong> ${screenshot.url}</p>
              </div>
              <img src="${screenshot.data.dataUrl}" alt="Screenshot of ${screenshot.url}" />
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    } else {
      toast({
        title: "Preview unavailable",
        description: "No image data available for this screenshot",
        variant: "destructive"
      });
      console.log('No image data available for full size view');
    }
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
            onScreenshotClick={handleViewFullSize}
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