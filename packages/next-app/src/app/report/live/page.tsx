"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, FileText, Target as TargetIcon, CheckCircle2, AlertTriangleIcon, Info, Home, ArrowLeft } from "lucide-react";
import { FormattedDate } from "@/components/formatted-date";

// Same interfaces as your main report page
interface PageIssue {
  issue: string;
  how_to_fix?: string;
}

interface PageRecommendation {
  recommendation: string;
  benefit?: string;
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
  detailed_analysis?: string;
  raw_analysis?: string;
  screenshot_path?: string;
}

interface OverallSummary {
  executive_summary: string;
  overall_score: number;
  site_score_explanation?: string;
  total_pages_analyzed: number;
  most_critical_issues: string[];
  top_recommendations: string[];
  key_strengths: string[];
  performance_summary: string;
  detailed_markdown_content: string;
}

interface ReportData {
  organization?: string;
  analysis_date?: string;
  timestamp?: string;
  overall_summary: OverallSummary;
  page_analyses: PageAnalysisDetail[];
  metadata?: {
    organization_name?: string;
    generated_at?: string;
  };
  screenshots?: { [key: string]: string };
}

const getScoreBoxClasses = (score: number): string => {
  if (score >= 9) return "bg-emerald-100 text-emerald-800 border-emerald-300";
  if (score >= 7) return "bg-green-100 text-green-800 border-green-300";
  if (score >= 5) return "bg-yellow-100 text-yellow-800 border-yellow-300";
  return "bg-red-100 text-red-700 border-red-300";
};

const getOverallScoreStatusText = (score: number) => {
  if (score >= 8) return "Excellent";
  if (score >= 6) return "Good";
  return "Needs Work";
};

export default function LiveReportPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get report data from sessionStorage (set by your analysis completion page)
    try {
      const storedData = sessionStorage.getItem('liveReportData');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setReportData(parsedData);
      } else {
        setError('No report data found. Please run a new analysis.');
      }
    } catch (err) {
      setError('Failed to load report data.');
    } finally {
      setLoading(false);
    }
  }, []);

  const getScreenshotSrc = (screenshotPath: string | undefined) => {
    if (!screenshotPath || !reportData?.screenshots) return "";
    
    // Extract filename from path
    const filename = screenshotPath.split('/').pop();
    if (!filename) return "";
    
    // Return base64 image data
    return reportData.screenshots[filename] || "";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-slate-700">Loading Your Report...</p>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100/30">
        <div className="text-center p-8 bg-white shadow-xl rounded-2xl max-w-lg">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <AlertTriangleIcon className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Report Not Found</h1>
          <p className="text-slate-600 mb-6 text-lg">{error}</p>
          <Link href="/" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Start New Analysis
          </Link>
        </div>
      </div>
    );
  }

  const { overall_summary, page_analyses = [], metadata } = reportData;
  const organizationName = metadata?.organization_name || reportData.organization || 'Analysis Report';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation */}
        <div className="mb-10">
          <Link href="/" className="inline-flex items-center gap-3 text-slate-600 hover:text-blue-600">
            <ArrowLeft className="w-5 h-5" />
            Start New Analysis
          </Link>
        </div>

        {/* Header */}
        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 px-6 py-3 rounded-2xl text-sm font-semibold mb-8 border border-green-100 shadow-sm">
            <CheckCircle2 className="w-5 h-5" />
            Analysis Complete
          </div>
          <h1 className="text-5xl font-bold text-slate-900 mb-6 tracking-tight leading-tight">{organizationName}</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Complete UX/UI analysis report generated on <FormattedDate date={metadata?.generated_at || new Date().toISOString()} />
          </p>
        </header>

        {/* Overall Score Card */}
        <div className="mb-16">
          <Card className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/70 p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-3xl text-3xl font-bold mb-6 border-2 ${getScoreBoxClasses(overall_summary.overall_score)}`}>
                {overall_summary.overall_score}/10
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Overall Score: {getOverallScoreStatusText(overall_summary.overall_score)}</h2>
              <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">{overall_summary.executive_summary}</p>
            </div>
          </Card>
        </div>

        {/* Page Analysis Cards */}
        <div className="space-y-8 mb-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center">Page Analysis</h2>
          <div className="grid gap-8">
            {page_analyses.map((page, index) => (
              <Card key={page.id} className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/70 overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="grid lg:grid-cols-2 gap-8 p-8">
                  {/* Page Info */}
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">{page.title}</h3>
                        <a href={page.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all text-sm">
                          {page.url} <ExternalLink size={14} className="inline-block ml-1"/>
                        </a>
                      </div>
                      <div className={`px-4 py-2 rounded-xl text-lg font-semibold border-2 ${getScoreBoxClasses(page.overall_score)}`}>
                        {page.overall_score}/10
                      </div>
                    </div>
                    
                    <p className="text-slate-700 mb-6 leading-relaxed">{page.summary}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Badge variant="secondary" className="mb-2">Page Type</Badge>
                        <p className="font-medium">{page.page_type}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Screenshot */}
                  <div className="flex items-center justify-center">
                    {getScreenshotSrc(page.screenshot_path) ? (
                      <img 
                        src={getScreenshotSrc(page.screenshot_path)} 
                        alt={`Screenshot of ${page.title}`}
                        className="w-full max-w-md rounded-xl shadow-lg border border-slate-200"
                      />
                    ) : (
                      <div className="w-full max-w-md aspect-[4/3] bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center">
                        <div className="text-center text-slate-500">
                          <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Screenshot not available</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <Link href="/" className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition-colors text-lg font-semibold">
            Start New Analysis
          </Link>
          <p className="text-sm text-slate-500">This report is temporary and will not be saved</p>
        </div>
      </div>
    </div>
  );
}