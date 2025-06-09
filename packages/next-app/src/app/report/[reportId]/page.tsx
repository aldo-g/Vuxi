"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ExternalLink, ChevronRight, Zap, Lightbulb, ListChecks, MapIcon, Palette, Trophy, Route, FileText, TrendingUp, ShieldCheck, MessageSquareHeart, Target as TargetIcon, CheckCircle2, AlertTriangleIcon, Info, Home } from "lucide-react";

// Migrated Components
import { ExecutiveSummary } from "@/components/ExecutiveSummary";
import { FormattedDate } from "@/components/formatted-date";

// --- Interfaces from original Index.tsx ---
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
  sections?: Array<{ name: string; title: string; score: number; summary: string; points: string[]; evidence: string; score_explanation: string; }>;
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
  total_pages?: number;
}
interface ReportData {
  organization: string;
  analysis_date: string;
  timestamp?: string;
  overall_summary: OverallSummary;
  page_analyses: PageAnalysisDetail[];
  metadata?: ReportMetadata;
}

// --- Helper Functions from original Index.tsx ---
const fetchReportData = async (reportId: string | undefined): Promise<ReportData> => {
    if (!reportId) {
        throw new Error("Report ID is undefined. Cannot fetch report data.");
    }
    const dataPath = `/all_analysis_runs/${reportId}/report-data.json`;
    const response = await fetch(dataPath);

    if (!response.ok) {
        throw new Error(`Network response was not ok for report ${reportId}`);
    }
    // Add data sanitization/defaulting logic from original file
    const data = await response.json();
    if (!data.overall_summary) {
        data.overall_summary = {
            executive_summary: "Executive summary not available.",
            overall_score: 0,
            most_critical_issues: [],
            top_recommendations: [],
            key_strengths: [],
            detailed_markdown_content: "# Overview Not Available"
        };
    }
    if (!data.page_analyses) {
        data.page_analyses = [];
    }
    return data;
};

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

const MarkdownSectionRenderer: React.FC<{
    title: string; mainContent: string; subsections: Array<{ title: string; content: string }>;
    performanceSummary?: string; goalAchievementAssessment?: string;
    icon?: React.ElementType; sectionKey: string;
}> = ({ title, mainContent, subsections, performanceSummary, goalAchievementAssessment, icon: Icon, sectionKey }) => (
    <div className="space-y-6">
        {mainContent && mainContent.trim() && (
            <div className="prose prose-lg max-w-none text-slate-700 leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{mainContent}</ReactMarkdown>
            </div>
        )}
        {/* ... Rest of the MarkdownSectionRenderer JSX from original file ... */}
    </div>
);

// --- The Main Page Component ---
export default function ReportOverviewPage({ params }: { params: { reportId: string } }) {
    const { reportId } = params;
    const [activeDetailedTab, setActiveDetailedTab] = useState("key-findings");

    const { data: reportData, isLoading, error, isError } = useQuery<ReportData, Error>({
        queryKey: ["reportData", reportId],
        queryFn: () => fetchReportData(reportId),
        enabled: !!reportId,
    });

    // --- All state and effects from original Index.tsx ---
    const [organizationName, setOrganizationName] = useState("Analysis Report");
    const [analysisDate, setAnalysisDate] = useState<string | null>(null);
    const [overallScore, setOverallScore] = useState(0);
    const [siteScoreExplanation, setSiteScoreExplanation] = useState("Overall site score explanation not available.");
    const [totalPagesAnalyzed, setTotalPagesAnalyzed] = useState(0);
    const [pageAnalyses, setPageAnalyses] = useState<PageAnalysisDetail[]>([]);
    const [mainExecutiveSummary, setMainExecutiveSummary] = useState("");
    const [parsedDetailedSections, setParsedDetailedSections] = useState<{ [key: string]: { title: string; content: string; subsections: Array<{title:string; content:string}> } }>({});
    const [goalAchievement, setGoalAchievement] = useState<string>("");
    const [performanceSummary, setPerformanceSummary] = useState("No performance summary available.");

    useEffect(() => {
        if (reportData) {
            const { overall_summary, page_analyses = [], metadata, organization, timestamp, analysis_date } = reportData;
            setOrganizationName(metadata?.organization_name || organization || `Report ID: ${reportId}`);
            setAnalysisDate(metadata?.generated_at || timestamp || analysis_date || new Date().toISOString());
            setOverallScore(overall_summary.overall_score || 0);
            setSiteScoreExplanation(overall_summary.site_score_explanation || "Not available.");
            setTotalPagesAnalyzed(overall_summary.total_pages_analyzed || page_analyses.length);
            setPageAnalyses(page_analyses);
            setMainExecutiveSummary(overall_summary.executive_summary || "Not available.");
            setPerformanceSummary(overall_summary.performance_summary || "Not available.");
            
            // --- All data parsing logic from original useEffect ---
            const dmc = overall_summary.detailed_markdown_content || "";
            // ... (The complex parsing logic for sections, subsections, goal achievement etc. goes here)
        }
    }, [reportData, reportId]);

    useEffect(() => {
        if (overallScore > 0) {
            const timer = setTimeout(() => {
                const scoreRing = document.querySelector('.score-ring-progress') as SVGCircleElement;
                if (scoreRing) {
                    const circumference = 2 * Math.PI * 45;
                    const offset = circumference - ((overallScore / 10) * circumference);
                    scoreRing.style.strokeDashoffset = offset.toString();
                    if (overallScore >= 8) scoreRing.style.stroke = '#22c55e';
                    else if (overallScore >= 6) scoreRing.style.stroke = '#f59e0b';
                    else scoreRing.style.stroke = '#ef4444';
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [overallScore]);
    
    // ... other useEffects and helper functions ...

    if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading Report...</div>;
    if (isError) return <div className="min-h-screen flex items-center justify-center">Error: {error.message}</div>;
    if (!reportData) return <div className="min-h-screen flex items-center justify-center">No report data found.</div>;

    const { overall_summary } = reportData;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-10">
                    <Link href="/reports" className="inline-flex items-center gap-3 text-slate-600 hover:text-blue-600 font-medium group">
                        <Home className="w-5 h-5" /> All Reports
                    </Link>
                </div>
                <header className="text-center mb-16">
                    <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 tracking-tight">Website Analysis: {organizationName}</h1>
                    {analysisDate && (
                      <p className="text-lg sm:text-xl text-slate-600">
                          Comprehensive UX/UI evaluation conducted on <FormattedDate dateString={analysisDate} />.
                      </p>
                    )}
                </header>

                <section className="grid lg:grid-cols-3 gap-8 mb-16">
                    <div className="lg:col-span-2">
                        <ExecutiveSummary summary={{
                            executive_summary: mainExecutiveSummary,
                            overall_score: overallScore,
                            total_pages_analyzed: totalPagesAnalyzed
                        }} />
                    </div>
                    <div className="lg:col-span-1">
                        <Card className="bg-white rounded-2xl border border-slate-200/70 p-6 sm:p-8 shadow-lg h-full">
                            <CardHeader className="p-0 mb-6">
                                <CardTitle className="flex items-center gap-3 text-2xl font-semibold text-slate-900">
                                    <Trophy className="w-6 h-6 text-emerald-600" /> Overall Site Score
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 flex flex-col items-center justify-center">
                                <div className="relative mb-6">
                                    <svg className="score-ring transform -rotate-90" width="120" height="120">
                                        <circle cx="60" cy="60" r="45" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                                        <circle className="score-ring-progress" cx="60" cy="60" r="45" fill="none" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 45}`} strokeDashoffset={`${2 * Math.PI * 45}`} style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1) .5s' }} />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center">
                                            <div className="text-3xl font-bold text-slate-900">{overallScore.toFixed(1)}</div>
                                            <div className="text-sm text-slate-500 font-medium">/10</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center w-full">
                                    <Badge variant="outline" className={`text-sm font-semibold mb-3 px-3 py-1.5 border ${getScoreBoxClasses(overallScore)}`}>
                                        {getOverallScoreStatusText(overallScore)}
                                    </Badge>
                                    <p className="text-xs text-slate-600 leading-relaxed text-center">{siteScoreExplanation}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>
                
                {/* Placeholder for the detailed tabs section which requires the full parsing logic */}
                <section className="mt-10">
                  <h2 className="text-3xl font-bold text-slate-900 mb-8">Detailed Findings</h2>
                  {/* The complex <Tabs> and <MarkdownSectionRenderer> logic would go here */}
                  <Card><CardContent className="p-6">Detailed analysis tabs would be rendered here.</CardContent></Card>
                </section>

                <section className="mt-20">
                    <h2 className="text-3xl font-bold text-slate-900 mb-8">Page-by-Page Analysis</h2>
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {pageAnalyses.map((page) => (
                            <Link key={page.id} href={`/report/${reportId}/page/${page.id}`} className="group block">
                                <Card className="h-full flex flex-col hover:shadow-xl transition-shadow">
                                  {/* ... simplified card content from previous step ... */}
                                </Card>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}