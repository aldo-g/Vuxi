import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, FileText, Target as TargetIcon, CheckCircle2, AlertTriangleIcon, Info, Home, ImageOff, MessageSquareHeart } from "lucide-react";

// Interfaces
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

interface ReportMetadata {
  organization_name?: string;
  generated_at?: string;
}

interface ReportData {
  organization?: string;
  analysis_date?: string;
  timestamp?: string;
  overall_summary: OverallSummary;
  page_analyses: PageAnalysisDetail[];
  metadata?: ReportMetadata;
}

const fetchReportData = async (reportId: string | undefined): Promise<ReportData> => {
  if (!reportId) {
    throw new Error("Report ID is undefined. Cannot fetch report data.");
  }
  const dataPath = `/all_analysis_runs/${reportId}/report-data.json`;
  const response = await fetch(dataPath);
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Failed to fetch report data from ${dataPath}:`, response.status, errorText);
    throw new Error(`Network response was not ok for report ${reportId} from ${dataPath}: ${response.statusText}`);
  }
  try {
    const data = await response.json();
    if (!data.overall_summary) {
        data.overall_summary = {
            executive_summary: "Executive summary not available.",
            overall_score: 0,
            site_score_explanation: "Site score explanation not available.",
            total_pages_analyzed: data.page_analyses?.length || 0,
            most_critical_issues: [],
            top_recommendations: [],
            key_strengths: [],
            performance_summary: "Performance summary not available.",
            detailed_markdown_content: "# Overview Not Available\n\nThe detailed overview content could not be loaded."
        };
    } else {
         data.overall_summary = {
            executive_summary: data.overall_summary.executive_summary || "Executive summary not available.",
            overall_score: typeof data.overall_summary.overall_score === 'number' ? data.overall_summary.overall_score : 0,
            site_score_explanation: data.overall_summary.site_score_explanation || "Site score explanation not available.",
            total_pages_analyzed: typeof data.overall_summary.total_pages_analyzed === 'number' ? data.overall_summary.total_pages_analyzed : (data.page_analyses?.length || 0),
            most_critical_issues: Array.isArray(data.overall_summary.most_critical_issues) ? data.overall_summary.most_critical_issues : [],
            top_recommendations: Array.isArray(data.overall_summary.top_recommendations) ? data.overall_summary.top_recommendations : [],
            key_strengths: Array.isArray(data.overall_summary.key_strengths) ? data.overall_summary.key_strengths : [],
            performance_summary: data.overall_summary.performance_summary || "Performance summary not available.",
            detailed_markdown_content: data.overall_summary.detailed_markdown_content || "# Overview Not Available\n\nThe detailed overview content could not be loaded."
        };
    }
    if (!Array.isArray(data.page_analyses)) {
      data.page_analyses = [];
    }
    return data;
  } catch (e) {
    console.error(`Failed to parse JSON from ${dataPath}:`, e);
    throw new Error(`Failed to parse report data for ${reportId}.`);
  }
};

const getScoreBoxClasses = (score: number): string => {
  if (score >= 9) return "bg-emerald-100 text-emerald-800 border-emerald-300";
  if (score >= 7) return "bg-green-100 text-green-800 border-green-300";
  if (score >= 6) return "bg-lime-100 text-lime-800 border-lime-300";
  if (score >= 5) return "bg-yellow-100 text-yellow-800 border-yellow-300";
  if (score >= 4) return "bg-orange-100 text-orange-800 border-orange-300";
  if (score >= 2) return "bg-red-100 text-red-700 border-red-300";
  return "bg-red-200 text-red-900 border-red-400";
};

const getOverallScoreStatusText = (score: number) => {
  if (score >= 8) return "Excellent";
  if (score >= 6) return "Good";
  return "Needs Improvement";
};

const getProgressColorClass = (score: number): string => {
  if (score >= 8) return "bg-emerald-500";
  if (score >= 6) return "bg-green-500";
  if (score >= 4) return "bg-amber-500";
  return "bg-red-500";
};

const getScoreColorTextClass = (score: number): string => {
  if (score >= 8) return "text-emerald-600";
  if (score >= 6) return "text-green-600";
  if (score >= 4) return "text-amber-600";
  return "text-red-600";
};

const extractPageRoleAnalysis = (content: string | undefined): string | null => {
  if (!content) return null;
  const lines = content.split('\n');
  let pageRoleContent: string[] = [];
  let inPageRoleSection = false;
  const pageRoleKeywords = ['PAGE ROLE ANALYSIS', 'PAGE ROLE:', 'ROLE OF THIS PAGE:'];

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    const upperLine = trimmedLine.toUpperCase();
    if (pageRoleKeywords.some(keyword => upperLine.startsWith(keyword))) {
      inPageRoleSection = true;
      const contentAfterKeyword = trimmedLine.substring(upperLine.indexOf(':') + 1).trim();
      if (contentAfterKeyword) pageRoleContent.push(contentAfterKeyword);
    } else if (trimmedLine.startsWith('## ') && inPageRoleSection) {
      if (!pageRoleKeywords.some(keyword => upperLine.startsWith(keyword))) inPageRoleSection = false;
    } else if (inPageRoleSection && trimmedLine && !trimmedLine.toUpperCase().includes('EVIDENCE:')) {
      pageRoleContent.push(trimmedLine);
    }
  });
  const result = pageRoleContent.join(' ').trim();
  return result || null;
};

const parseDetailedAnalysisSections = (content: string | undefined, sectionScores: { [key: string]: number } = {}): PageSection[] => {
  if (!content) return [];
  const lines = content.split('\n');
  const parsedSections: PageSection[] = [];
  const titleToScoreKey: { [key: string]: keyof typeof sectionScores } = {
    'FIRST IMPRESSION & CLARITY': 'first_impression_clarity',
    'GOAL ALIGNMENT': 'goal_alignment',
    'VISUAL DESIGN': 'visual_design',
    'CONTENT QUALITY': 'content_quality',
    'USABILITY & ACCESSIBILITY': 'usability_accessibility',
    'CONVERSION OPTIMIZATION': 'conversion_optimization',
    'TECHNICAL EXECUTION': 'technical_execution'
  };
  let currentSectionData: Partial<PageSection> & { contentBuffer?: string[] } = {};
  let collectingEvidence = false;

  const finalizeSection = () => {
    if (currentSectionData.title) {
      const scoreKey = titleToScoreKey[currentSectionData.title.toUpperCase() as keyof typeof titleToScoreKey];
      const scoreValue = scoreKey ? sectionScores[scoreKey] : undefined;
      const sectionRawScoreMatch = currentSectionData.title.match(/\(Score:\s*(\d+)\/10\)/i);
      let finalScore = 5; // Default score

      if (typeof scoreValue === 'number') {
        finalScore = scoreValue;
      } else if (sectionRawScoreMatch && sectionRawScoreMatch[1]) {
        finalScore = parseInt(sectionRawScoreMatch[1], 10);
      } else if (typeof currentSectionData.score === 'number') {
         finalScore = currentSectionData.score;
      }
      
      // Clean title from score string
      const cleanTitle = currentSectionData.title.replace(/\s*\(Score:\s*\d+\/10\)/i, '').trim();

      parsedSections.push({
        name: currentSectionData.name || cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        title: cleanTitle,
        score: finalScore,
        summary: currentSectionData.summary || "Summary not available.",
        points: currentSectionData.points || [],
        evidence: currentSectionData.evidence || "Evidence not specified.",
        score_explanation: currentSectionData.score_explanation || "Score explanation not provided.",
        rawContent: (currentSectionData.contentBuffer || []).join('\n').trim() || "Detailed content not available for this section."
      });
    }
    currentSectionData = {};
    collectingEvidence = false;
  };

  for (const line of lines) {
    const trimmedLine = line.trim();
    const sectionMatch = trimmedLine.match(/^##\s*\d*\.?\s*([^(\n]+)(?:\s*\(Score:\s*(\d+)\/10\))?/i);

    if (sectionMatch) {
      finalizeSection();
      currentSectionData.title = sectionMatch[1].trim(); // Title without score part
      currentSectionData.name = currentSectionData.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      currentSectionData.points = [];
      currentSectionData.contentBuffer = [];
      if (sectionMatch[2]) { // Score from markdown heading itself
        currentSectionData.score = parseInt(sectionMatch[2], 10);
      }
      collectingEvidence = false;
    } else if (currentSectionData.title) {
        if (trimmedLine.toUpperCase().startsWith('EVIDENCE:')) {
            collectingEvidence = true;
            currentSectionData.evidence = trimmedLine.substring(9).trim();
        } else if (collectingEvidence) {
            currentSectionData.evidence += `\n${trimmedLine}`;
        } else if (trimmedLine.startsWith('- ')) {
            (currentSectionData.points = currentSectionData.points || []).push(trimmedLine.substring(2).trim());
        } else if (trimmedLine.toUpperCase().startsWith('SUMMARY:')) {
            currentSectionData.summary = trimmedLine.substring(8).trim();
        } else if (trimmedLine.toUpperCase().startsWith('SCORE EXPLANATION:')) {
            currentSectionData.score_explanation = trimmedLine.substring(18).trim();
        } else if (trimmedLine) {
             (currentSectionData.contentBuffer = currentSectionData.contentBuffer || []).push(trimmedLine);
        }
    }
  }
  finalizeSection();
  return parsedSections;
};

const PageAnalysis = () => {
  const { reportId, pageId } = useParams<{ reportId: string; pageId: string }>();
  const [activeTab, setActiveTab] = useState("tab-detailed");
  const [activeNestedTab, setActiveNestedTab] = useState("role-analysis");

  const { data: reportData, isLoading: isLoadingReport, error: reportError, isError: isReportError } = useQuery<ReportData, Error>({
    queryKey: ["reportData", reportId],
    queryFn: () => fetchReportData(reportId),
    enabled: !!reportId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const pageData = useMemo(() => {
    return reportData?.page_analyses?.find(page => page.id === pageId);
  }, [reportData, pageId]);

  const analysisSections = useMemo(() => {
    if (pageData) {
      if (pageData.sections && pageData.sections.length > 0) {
        return pageData.sections.map(s => ({...s, score: typeof s.score === 'number' ? s.score : 5})); // Ensure score is number
      }
      return parseDetailedAnalysisSections(pageData.detailed_analysis || pageData.raw_analysis, pageData.section_scores || {});
    }
    return [];
  }, [pageData]);

  useEffect(() => {
    if (activeTab === "tab-detailed") {
        if (analysisSections.length > 0) {
          setActiveNestedTab(`section-0`);
        } else {
          setActiveNestedTab('role-analysis');
        }
    }
  }, [analysisSections, activeTab]);

  useEffect(() => {
    if (pageData) {
        const timer = setTimeout(() => {
        const scoreRing = document.querySelector('.score-ring-progress') as SVGCircleElement;
        if (scoreRing) {
            const score = pageData.overall_score;
            const circumference = 2 * Math.PI * 45;
            const progress = (score / 10) * circumference;
            const offset = circumference - progress;
            scoreRing.style.strokeDashoffset = offset.toString();
            if (score >= 8) scoreRing.style.stroke = '#10b981';
            else if (score >= 6) scoreRing.style.stroke = '#f59e0b';
            else scoreRing.style.stroke = '#ef4444';
        }
        }, 500);
        return () => clearTimeout(timer);
    }
  }, [pageData]);

  const getBadgeColors = (tabId: string) => {
    if (tabId === 'tab-issues') return 'bg-red-100 text-red-700 border-red-200';
    if (tabId === 'tab-recommendations') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  const getDisplayDate = () => {
    const dateSource = reportData?.metadata?.generated_at || reportData?.timestamp || reportData?.analysis_date;
    return dateSource ? new Date(dateSource).toLocaleDateString() : new Date().toLocaleDateString();
  };

  const getGenericPageRoleDescription = (pageDetail: PageAnalysisDetail | undefined) => {
    if (!pageDetail || !reportData) return "Page role information not available.";
    const pageType = pageDetail.page_type.toLowerCase();
    const organization = reportData.metadata?.organization_name || reportData.organization || "the organization";
    return `This page serves as a ${pageType} for ${organization}'s website, contributing to the overall user experience and supporting the organization's digital goals. Its primary function is to [describe common function of such page type, e.g., 'provide users with information about X' or 'enable users to accomplish Y'].`;
  };
  
  if (isLoadingReport) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-slate-700">Loading Page Analysis for Report {reportId}...</p>
        </div>
      </div>
    );
  }

  if (isReportError || !reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100/30">
        <div className="text-center p-8 bg-white shadow-xl rounded-2xl max-w-lg">
            <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Error Loading Report Data</h1>
          <p className="text-slate-600 mb-8 text-lg">Could not load data for report ID: {reportId}.</p>
          {reportError && <pre className="text-xs text-red-700 bg-red-50 p-4 rounded-md text-left mt-4">{reportError.message}</pre>}
          <Link to="/reports" className="mt-8 inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            <Home size={18}/> Back to Report List
          </Link>
        </div>
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <div className="text-center p-8 bg-white shadow-xl rounded-2xl max-w-lg">
           <div className="w-20 h-20 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <AlertCircle className="w-10 h-10 text-yellow-500" />
            </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Page Analysis Not Found</h1>
          <p className="text-slate-600 mb-8 text-lg">The analysis for page ID "{pageId}" could not be found in report "{reportId}".</p>
          <Link to={`/report/${reportId}`} className="mt-8 inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            <Home size={18}/> Back to Report Overview
          </Link>
        </div>
      </div>
    );
  }

  const actualScreenshotPath = pageData.screenshot_path
    ? `/all_analysis_runs/${reportId}/${pageData.screenshot_path}`
    : "/assets/screenshots/placeholder.png";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10">
          <Link
            to={`/report/${reportId}`} // This link correctly points to the report overview
            className="inline-flex items-center gap-3 text-slate-600 hover:text-blue-600 transition-all duration-300 font-medium group"
          >
            <Home className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform duration-300" />
            Back to Report: {reportData?.metadata?.organization_name || `ID ${reportId}`}
          </Link>
        </div>

        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 px-6 py-3 rounded-2xl text-sm font-semibold mb-8 border border-indigo-100 shadow-sm">
            <FileText className="w-5 h-5" />
            Page-Specific Analysis
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6 tracking-tight leading-tight">{pageData.title}</h1>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Detailed analysis of the <span className="font-semibold text-slate-800">{pageData.page_type}</span>.
          </p>
        </header>

        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          <div className="lg:col-span-2">
            <Card className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/70 p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-2xl font-semibold text-slate-900">Page Overview</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-slate-700 leading-relaxed mb-6 text-base">{pageData.summary}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 pt-6 border-t border-slate-100">
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-1">PAGE TYPE</p>
                    <p className="text-slate-800 font-semibold">{pageData.page_type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-1">ANALYSIS DATE</p>
                    <p className="text-slate-800 font-semibold">{getDisplayDate()}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-slate-500 font-medium mb-1">URL</p>
                    <a href={pageData.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-mono text-sm truncate hover:underline break-all" title={pageData.url}>
                      {pageData.url} <ExternalLink size={12} className="inline-block ml-1"/>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
           <div className="lg:col-span-1">
            <Card className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/70 p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
                <CardHeader className="p-0 mb-6">
                    <CardTitle className="text-2xl font-semibold text-slate-900 text-center">Page Score</CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-grow flex flex-col items-center justify-center">
                    <div className="relative mb-6">
                        <svg className="score-ring transform -rotate-90" width="120" height="120">
                            <circle cx="60" cy="60" r="45" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                            <circle
                                className="score-ring-progress"
                                cx="60" cy="60" r="45" fill="none" strokeWidth="8" strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 45}`} strokeDashoffset={`${2 * Math.PI * 45}`}
                                style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1) .5s' }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-slate-900">{pageData.overall_score}</div>
                                <div className="text-sm text-slate-500 font-medium">/10</div>
                            </div>
                        </div>
                    </div>
                    <div className="text-center w-full">
                        <Badge variant="outline" className={`text-xs font-semibold mb-3 px-3 py-1.5 border ${getScoreBoxClasses(pageData.overall_score)}`}>
                            {getOverallScoreStatusText(pageData.overall_score)}
                        </Badge>
                        {pageData.overall_explanation && (
                            <div className="mt-4 pt-4 border-t border-slate-100">
                                 <h4 className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center justify-center gap-1.5">
                                    <Info size={14} className="text-blue-500" /> Score Rationale
                                </h4>
                                <p className="text-xs text-slate-600 leading-relaxed text-center">{pageData.overall_explanation}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/70 shadow-xl overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50/90 to-white/90 backdrop-blur-sm px-4 sm:px-6 py-3">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:flex md:w-auto bg-transparent p-0 h-auto gap-1 sm:gap-2 justify-start overflow-x-auto scrollbar-hide">
                {[
                  { id: 'tab-detailed', label: 'Detailed Analysis' },
                  { id: 'tab-issues', label: 'Key Issues', count: pageData.key_issues?.length || 0 },
                  { id: 'tab-recommendations', label: 'Recommendations', count: pageData.recommendations?.length || 0 },
                  { id: 'tab-raw', label: 'Raw LLM Output' },
                  { id: 'tab-screenshot', label: 'Screenshot' }
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="group flex items-center justify-center text-center sm:text-left gap-2 px-4 py-3 h-auto min-h-[52px] whitespace-nowrap rounded-lg border-2 border-transparent bg-slate-100/80 hover:bg-slate-200/80 data-[state=active]:bg-white data-[state=active]:border-blue-200 data-[state=active]:shadow-md data-[state=active]:text-blue-700 text-slate-600 font-medium transition-all duration-300 flex-shrink-0 text-xs sm:text-sm"
                  >
                    <span className="font-semibold">{tab.label}</span>
                    {typeof tab.count === 'number' && tab.count > 0 && (
                      <span className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full min-w-[20px] h-5 border ${getBadgeColors(tab.id)}`}>
                        {tab.count}
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            
            <TabsContent value="tab-detailed" className="p-6 sm:p-8 mt-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none">
              <div className="space-y-8">
                <div className="bg-gradient-to-r from-blue-50/60 to-indigo-50/60 rounded-xl border border-blue-100/70 p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow">
                          <TargetIcon className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Page Role & Purpose</h3>
                  </div>
                  <div className="prose prose-base max-w-none text-slate-700 leading-relaxed">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {extractPageRoleAnalysis(pageData.detailed_analysis || pageData.raw_analysis) || getGenericPageRoleDescription(pageData)}
                      </ReactMarkdown>
                  </div>
                </div>

                {analysisSections.length > 0 ? (
                  <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                     <div className="border-b border-slate-200 bg-slate-50/90 backdrop-blur-sm px-2 py-2">
                      <div className="grid w-full grid-cols-2 sm:grid-cols-3 md:flex md:w-auto bg-transparent p-0 h-auto gap-1 justify-start overflow-x-auto scrollbar-hide">
                          {analysisSections.map((section, index) => (
                              <button
                                  key={`section-tab-${index}`}
                                  onClick={() => setActiveNestedTab(`section-${index}`)}
                                  data-state={activeNestedTab === `section-${index}` ? 'active' : 'inactive'}
                                  className={`group flex items-center justify-center text-center sm:text-left gap-2 px-3 py-2.5 h-auto min-h-[48px] whitespace-nowrap rounded-md border-2 border-transparent bg-slate-100/70 hover:bg-slate-200/70 data-[state=active]:bg-white data-[state=active]:border-indigo-200 data-[state=active]:shadow-sm data-[state=active]:text-indigo-700 text-slate-500 font-medium transition-all duration-300 flex-shrink-0 text-xs`}
                              >
                              <span className={`w-5 h-5 text-xs font-bold rounded-sm flex items-center justify-center text-white ${
                                  section.score >= 7 ? 'bg-emerald-500' : (section.score >= 5 ? 'bg-amber-500' : 'bg-red-500')
                              }`}>
                                  {index + 1}
                              </span>
                              <span className="font-medium">{section.title}</span>
                              {typeof section.score === 'number' && (
                                  <span className="text-xs text-slate-400 group-data-[state=active]:text-indigo-500">({section.score}/10)</span>
                              )}
                              </button>
                          ))}
                      </div>
                    </div>
                    <div className="p-6 sm:p-8">
                      {analysisSections.map((section, index) => (
                        activeNestedTab === `section-${index}` && (
                          <div key={`section-content-${index}`} className="space-y-6">
                            {section.summary && section.summary !== "Summary not available." && (
                              <div>
                                <h5 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-2">Section Summary</h5>
                                <p className="text-slate-700 leading-relaxed text-sm">{section.summary}</p>
                              </div>
                            )}
                            {section.points && section.points.length > 0 && (
                              <div>
                                <h5 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-2">Key Points</h5>
                                <ul className="space-y-2">
                                  {section.points.map((point: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2.5">
                                      <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${getProgressColorClass(section.score)}`}/>
                                      <span className="text-slate-700 text-sm leading-relaxed">{point}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {section.evidence && section.evidence !== "Evidence not specified." && (
                              <div>
                                <h5 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-2">Evidence Cited</h5>
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600 italic">
                                  {section.evidence}
                                </div>
                              </div>
                            )}
                            {typeof section.score === 'number' && (
                                <div className="mb-4">
                                    <h5 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-2">Section Score</h5>
                                    <div className="flex items-center gap-3">
                                    <div className="flex-grow bg-slate-200 rounded-full h-2.5">
                                        <div
                                        className={`h-2.5 rounded-full ${getProgressColorClass(section.score)}`}
                                        style={{ width: `${(section.score / 10) * 100}%`, transition: 'width 0.5s ease-in-out' }}
                                        ></div>
                                    </div>
                                    <span className={`text-sm font-bold ${getScoreColorTextClass(section.score)}`}>{section.score}/10</span>
                                    </div>
                                </div>
                            )}
                             {section.score_explanation && section.score_explanation !== "Score explanation not provided." && (
                              <div>
                                <h5 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-2">Score Explanation</h5>
                                 <p className="text-slate-700 leading-relaxed text-sm">{section.score_explanation}</p>
                              </div>
                            )}
                            {(!section.summary || section.summary === "Summary not available.") &&
                             (!section.points || section.points.length === 0) &&
                             (!section.evidence || section.evidence === "Evidence not specified.") &&
                             (!section.score_explanation || section.score_explanation === "Score explanation not provided.") &&
                             section.rawContent && (
                              <div>
                                <h5 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-2">Detailed Observations</h5>
                                <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-sm max-w-none text-slate-700 leading-relaxed">
                                  {section.rawContent}
                                </ReactMarkdown>
                              </div>
                            )}
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4"/>
                    <p className="text-slate-600">No detailed analysis sections available for this page.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="tab-issues" className="p-6 sm:p-8 mt-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none">
              <div className="space-y-6">
                {(pageData.key_issues && pageData.key_issues.length > 0) ? (
                  pageData.key_issues.map((issueObj, index) => (
                    <div key={index} className="flex gap-4 sm:gap-6 p-4 sm:p-6 bg-gradient-to-r from-red-50/90 to-rose-50/70 border border-red-200/70 rounded-xl hover:shadow-md hover:shadow-red-100/60 transition-all duration-300">
                      <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-red-500 to-rose-600 text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-md">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-slate-900 font-semibold leading-relaxed text-base sm:text-lg mb-1.5 sm:mb-2">{issueObj.issue}</p>
                        {issueObj.how_to_fix && (
                          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-red-200/90">
                            <h4 className="text-xs sm:text-sm font-semibold text-red-700 mb-1">Suggested Fix:</h4>
                            <p className="text-slate-700 text-xs sm:text-sm leading-relaxed">{issueObj.how_to_fix}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 sm:py-20">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">No Critical Issues Identified</h3>
                    <p className="text-slate-600 text-base sm:text-lg">This page appears to be functioning well without major problems according to the analysis.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="tab-recommendations" className="p-6 sm:p-8 mt-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none">
              <div className="space-y-6">
                {(pageData.recommendations && pageData.recommendations.length > 0) ? (
                  pageData.recommendations.map((recObj, index) => (
                    <div key={index} className="flex gap-4 sm:gap-6 p-4 sm:p-6 bg-gradient-to-r from-emerald-50/90 to-green-50/70 border border-emerald-200/70 rounded-xl hover:shadow-md hover:shadow-green-100/60 transition-all duration-300">
                      <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-md">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-slate-900 font-semibold leading-relaxed text-base sm:text-lg mb-1.5 sm:mb-2">{recObj.recommendation}</p>
                         {recObj.benefit && (
                           <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-emerald-200/90">
                            <h4 className="text-xs sm:text-sm font-semibold text-emerald-700 mb-1">Potential Benefit:</h4>
                            <p className="text-slate-700 text-xs sm:text-sm leading-relaxed">{recObj.benefit}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 sm:py-20">
                     <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <MessageSquareHeart className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">No Specific Recommendations</h3>
                    <p className="text-slate-600 text-base sm:text-lg">No specific improvement suggestions were provided for this page in the analysis.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="tab-raw" className="p-6 sm:p-8 mt-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200/80 p-6 sm:p-8 shadow-inner">
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Raw LLM Output</h3>
                <pre className="text-xs sm:text-sm text-slate-700 font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto bg-white p-4 rounded-lg border border-slate-200">
                  {pageData.raw_analysis || pageData.detailed_analysis || 'No raw analysis data available for this page.'}
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="tab-screenshot" className="p-6 sm:p-8 mt-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none">
              <div className="text-center py-6 sm:py-10">
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6 sm:mb-8">Page Screenshot</h3>
                 {pageData.screenshot_path ? (
                    <img
                        src={actualScreenshotPath}
                        alt={`Screenshot of ${pageData.title}`}
                        className="max-w-full h-auto rounded-xl border-2 border-slate-200 shadow-2xl mx-auto"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null; // Prevent infinite loop if fallback also fails
                            target.style.display = 'none'; // Hide broken image
                            const fallbackDiv = document.getElementById(`screenshot-fallback-${pageData.id}`);
                            if (fallbackDiv) fallbackDiv.style.display = 'block'; // Show fallback
                        }}
                    />
                 ) : null }
                 <div id={`screenshot-fallback-${pageData.id}`} style={{display: !pageData.screenshot_path ? 'block' : 'none'}}
                      className="text-center py-16 sm:py-20"
                 >
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                          <ImageOff className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">Screenshot Not Available</h3>
                      <p className="text-slate-600 text-base sm:text-lg">No visual capture is available for this page analysis.</p>
                 </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PageAnalysis;