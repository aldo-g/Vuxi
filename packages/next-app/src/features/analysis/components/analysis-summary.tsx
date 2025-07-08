"use client";

import React from 'react';
import type { AnalysisData } from '../types';

interface AnalysisSummaryProps {
  analysisData: AnalysisData;
}

export function AnalysisSummary({ analysisData }: AnalysisSummaryProps) {
  return (
    <div className="bg-slate-50 rounded-lg p-4 space-y-2">
      <h4 className="font-medium text-slate-900">Analysis Summary</h4>
      <div className="text-sm text-slate-600 space-y-1">
        <p><strong>Website:</strong> {analysisData.websiteUrl}</p>
        <p><strong>Organization:</strong> {analysisData.organizationName}</p>
        <p><strong>Purpose:</strong> {analysisData.sitePurpose}</p>
        <p><strong>Pages Captured:</strong> {analysisData.screenshots?.length || 0}</p>
      </div>
    </div>
  );
}