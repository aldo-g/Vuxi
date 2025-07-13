"use client";

import { useState, useCallback } from 'react';
import type { AnalysisData } from '../types';

const initialAnalysisData: AnalysisData = {
  websiteUrl: '',
  organizationName: '',
  sitePurpose: ''
};

export function useAnalysisData() {
  const [analysisData, setAnalysisData] = useState<AnalysisData>(initialAnalysisData);

  const updateAnalysisData = useCallback((updates: Partial<AnalysisData>) => {
    setAnalysisData(prev => ({ ...prev, ...updates }));
  }, []);

  const resetAnalysisData = useCallback(() => {
    setAnalysisData(initialAnalysisData);
  }, []);

  return {
    analysisData,
    updateAnalysisData,
    resetAnalysisData
  };
}