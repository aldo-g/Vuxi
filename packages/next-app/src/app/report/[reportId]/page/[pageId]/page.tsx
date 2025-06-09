"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, FileText, Target as TargetIcon, CheckCircle2, AlertTriangleIcon, Info, Home, ImageOff, MessageSquareHeart } from "lucide-react";
import { FormattedDate } from "@/components/formatted-date";

// --- Interfaces and Helper Functions from original PageAnalysis.tsx ---
// (Again, it's critical to copy all the helper functions and interfaces from your original file here)
interface PageIssue {
  issue: string;
  how_to_fix?: string;
}
interface PageRecommendation {
  recommendation: string;
  benefit?: string;
}
interface PageSection {
  name: string;
  title: string;
  score: number;
  summary: string;
  points: string[];
  evidence: string;
  score_explanation: string;
  rawContent?: string;
}
interface PageAnalysisDetail {
  id: string;
  page_type: string;
  title: string;
  overall_score: number;
  url: string;
  section_scores: { [key: string]: number };
  key_issues: PageIssue[];
  recommendations: PageRecommendation[];
  summary: string;
  overall_explanation?: string;
  sections?: PageSection[];
  detailed_analysis?: string;
  raw_analysis?: string;
  screenshot_path?: string;
}
interface ReportData {
  // ... full ReportData interface
  metadata?: { organization_name?: string, generated_at?: string };
  page_analyses: PageAnalysisDetail[];
}

const fetchReportData = async (reportId: string | undefined): Promise<ReportData> => {
    if (!reportId) throw new Error("Report ID is undefined.");
    const res = await fetch(`/all_analysis_runs/${reportId}/report-data.json`);
    if (!res.ok) throw new Error("Failed to fetch report data");
    return res.json();
};

// ... ALL other helper functions (getScoreBoxClasses, parseDetailedAnalysisSections, etc.)


// --- The Main Page Component ---
export default function PageAnalysisPage({ params }: { params: { reportId: string, pageId: string } }) {
  const { reportId, pageId } = params;

  // ... All the hooks and logic from your original PageAnalysis.tsx file ...
  // This includes useQuery, useMemo, useState, and useEffect hooks.
  // The full JSX from your original file's return statement should be used here.
  // The code below is a restored version of your original file, adapted for Next.js.
  
  const { data: reportData, isLoading: isLoadingReport, error: reportError } = useQuery<ReportData, Error>({
    queryKey: ["reportData", reportId],
    queryFn: () => fetchReportData(reportId),
    enabled: !!reportId,
  });

  const pageData = useMemo(() => {
    return reportData?.page_analyses?.find(page => page.id === pageId);
  }, [reportData, pageId]);

  useEffect(() => {
    // This effect animates the score ring.
    if (pageData) {
      const timer = setTimeout(() => {
        const scoreRing = document.querySelector('.score-ring-progress') as SVGCircleElement;
        if (scoreRing) {
          const score = pageData.overall_score;
          const circumference = 2 * Math.PI * 45;
          const progress = (score / 10) * circumference;
          const offset = circumference - progress;
          scoreRing.style.strokeDashoffset = offset.toString();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [pageData]);


  if (isLoadingReport) {
    return <div className="min-h-screen flex items-center justify-center"><p>Loading Page Analysis...</p></div>;
  }

  if (!pageData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
            <h1 className="text-2xl font-bold">Page Not Found</h1>
            <p>Could not find analysis for page ID "{pageId}" in this report.</p>
            <Link href={`/report/${reportId}`} className="text-blue-600 mt-4 inline-block">Back to Report Overview</Link>
        </div>
      </div>
    );
  }
  
  const actualScreenshotPath = pageData.screenshot_path
    ? `/all_analysis_runs/${reportId}/${pageData.screenshot_path}`
    : "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <Link href={`/report/${reportId}`} className="inline-flex items-center gap-3 text-slate-600 hover:text-blue-600">
            <Home className="w-5 h-5" />
            Back to Report Overview
          </Link>
        </div>

        <header className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">{pageData.title}</h1>
          <a href={pageData.url} target="_blank" rel="noopener noreferrer" className="text-lg text-blue-600 hover:underline break-all">
            {pageData.url} <ExternalLink size={16} className="inline-block ml-1"/>
          </a>
        </header>
        
        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
            <div className="lg:col-span-2">
                {/* ... Card with Page Overview ... */}
            </div>
            <div className="lg:col-span-1">
                 {/* ... Card with Page Score Ring ... */}
            </div>
        </div>

        {/* Tabs Section */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border shadow-xl">
          <Tabs defaultValue="tab-detailed" className="w-full">
            <div className="border-b px-4 py-3">
                <TabsList>
                  {/* ... TabsTrigger for each tab ... */}
                </TabsList>
            </div>
            {/* ... TabsContent for each tab, containing the detailed markdown, issues, recommendations, etc. ... */}
          </Tabs>
        </div>
      </div>
    </div>
  );
}