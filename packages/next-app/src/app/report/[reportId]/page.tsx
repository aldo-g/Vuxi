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
import { ExternalLink, ChevronRight, Zap, Lightbulb, ListChecks, MapIcon, Palette, Trophy, Route, FileText, TrendingUp, ShieldCheck, MessageSquareHeart, Target as TargetIcon, CheckCircle2, AlertTriangleIcon, Info, Home, AlertCircle } from "lucide-react";

// Migrated Components
import { ExecutiveSummary } from "@/components/overview/executive-summary";
import { FormattedDate } from "@/components/common/formatted-date";

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
        
        {sectionKey === 'key-findings' && (
            <>
                {goalAchievementAssessment && (
                    <div className="p-6 bg-indigo-50/70 border border-indigo-200/80 rounded-xl shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <TargetIcon className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                            <h4 className="text-xl font-semibold text-indigo-800">Goal Achievement Assessment</h4>
                        </div>
                        <div className="prose prose-base max-w-none text-indigo-700 leading-relaxed">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{goalAchievementAssessment}</ReactMarkdown>
                        </div>
                    </div>
                )}
            </>
        )}

        {subsections && subsections.length > 0 && (
            <div className="space-y-4">
                {subsections.map((sub, idx) => (
                    <Accordion key={idx} type="single" collapsible className="w-full">
                        <AccordionItem value={`subsection-${sectionKey}-${idx}`} className="border bg-white rounded-lg shadow-sm data-[state=open]:shadow-md overflow-hidden">
                            <AccordionTrigger className="text-lg font-semibold text-slate-700 hover:text-blue-600 py-4 px-6 bg-slate-50/80 hover:bg-slate-100/90 transition-colors w-full text-left data-[state=open]:bg-slate-100 data-[state=open]:border-b border-slate-200">
                                {sub.title}
                            </AccordionTrigger>
                            <AccordionContent className="pt-4 pb-6 px-6">
                                <div className="prose prose-base max-w-none text-slate-600 leading-relaxed">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{sub.content}</ReactMarkdown>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                ))}
            </div>
        )}
        {sectionKey === 'key-findings' && performanceSummary && (
            <div className="p-6 bg-purple-50/70 border border-purple-200/80 rounded-xl shadow-sm mt-6">
                <div className="flex items-center gap-3 mb-3">
                    <Zap className="w-6 h-6 text-purple-600 flex-shrink-0" />
                    <h4 className="text-xl font-semibold text-purple-800">Performance Snapshot</h4>
                </div>
                <p className="text-purple-700 leading-relaxed text-base">{performanceSummary}</p>
            </div>
        )}
        {(!mainContent || !mainContent.trim()) && (!subsections || subsections.length === 0) && sectionKey !== 'key-findings' && (
            <p className="text-slate-500 p-4 text-center">No specific details available for this section.</p>
        )}
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
            
            const extractedGoalAssessment = (() => {
                if (!dmc) return "";
                const goalAssessmentMatch = dmc.match(/###?\s*Goal Achievement Assessment[:\s]*\n([\s\S]*?)(?=\n\n(?:###?|##|\*\*Performance Summary|\*\*Key Strengths|$))/i);
                if (goalAssessmentMatch && goalAssessmentMatch[1]) return goalAssessmentMatch[1].trim();
                const keyFindingsMatch = dmc.match(/## KEY FINDINGS([\s\S]*?)(?=\n\n## |$)/i);
                if (keyFindingsMatch && keyFindingsMatch[1]) {
                    const keyFindingsContent = keyFindingsMatch[1];
                    const goalInKeyFindings = keyFindingsContent.match(/Goal Achievement Assessment[:\s]*\n([\s\S]*?)(?=\n\n(?:###?|##|\*\*|$))/i);
                    if (goalInKeyFindings && goalInKeyFindings[1]) return goalInKeyFindings[1].trim();
                }
                return "";
            })();
            setGoalAchievement(extractedGoalAssessment);

            const parsedSectionsResult = (() => {
                if (!dmc) return {};
                const sections: { [key: string]: { title: string; content: string; subsections: Array<{title:string; content:string}> } } = {};
                const lines = dmc.split('\n');
                let currentSectionKey: string | null = null;
                let currentSectionTitle: string | null = null;
                let currentSubsectionTitle: string | null = null;
                let mainSectionContentAccumulator: string[] = [];
                let subSectionContentAccumulator: string[] = [];
                const normalizeKey = (title: string) => title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

                const commitSubSection = () => {
                    if (currentSubsectionTitle && currentSectionKey && sections[currentSectionKey]) {
                        if (!(currentSectionKey === 'executive-summary' && (currentSubsectionTitle.toLowerCase().includes('key strengths') || currentSubsectionTitle.toLowerCase().includes('critical weaknesses')))) {
                            sections[currentSectionKey].subsections.push({ title: currentSubsectionTitle, content: subSectionContentAccumulator.join('\n').trim() });
                        }
                    }
                    subSectionContentAccumulator = [];
                    currentSubsectionTitle = null;
                };

                const commitMainSection = () => {
                    commitSubSection();
                    if (currentSectionKey && sections[currentSectionKey]) {
                        let contentToAdd = mainSectionContentAccumulator.join('\n').trim();
                        if (currentSectionKey === 'executive-summary' && mainExecutiveSummary) {
                            const mainParaLines = mainExecutiveSummary.split('\n');
                            let tempContent = contentToAdd;
                            mainParaLines.forEach(line => {
                                const trimmedLine = line.trim();
                                const regex = new RegExp(`(^|\\n)${trimmedLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*')}(\\n|$)`, 'gi');
                                tempContent = tempContent.replace(regex, (match, p1, p2) => (p1 && p2) ? p1 : ''); 
                            });
                            contentToAdd = tempContent.replace(/\n\s*\n/g, '\n\n').trim();
                            contentToAdd = contentToAdd.replace(/(\n\n)?\*\*Goal Achievement Assessment:\*\*[\s\S]*?(?=\n\n##|$)/i, '').trim();
                            contentToAdd = contentToAdd.replace(/(\n\n)?###?\s*Goal Achievement Assessment[\s\S]*?(?=\n\n##|$)/i, '').trim();
                        }
                        sections[currentSectionKey].content = contentToAdd;
                    }
                    mainSectionContentAccumulator = [];
                };

                for (const line of lines) {
                    if (line.startsWith('## ')) {
                        commitMainSection();
                        currentSectionTitle = line.substring(3).trim();
                        currentSectionKey = normalizeKey(currentSectionTitle);
                        if (!currentSectionKey) continue;
                        sections[currentSectionKey] = { title: currentSectionTitle, content: '', subsections: [] };
                    } else if (line.startsWith('### ')) {
                        commitSubSection();
                        if (currentSectionKey) {
                            currentSubsectionTitle = line.substring(4).trim();
                            if (currentSectionKey === 'key-findings' && currentSubsectionTitle.toLowerCase().includes('goal achievement assessment')) {
                                currentSubsectionTitle = null;
                            }
                        }
                    } else if (currentSectionKey) {
                        if (currentSubsectionTitle) {
                            subSectionContentAccumulator.push(line);
                        } else {
                            mainSectionContentAccumulator.push(line);
                        }
                    }
                }
                commitMainSection();
                return sections;
            })();
            setParsedDetailedSections(parsedSectionsResult);
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

    const sectionDetails: { [key: string]: { icon: React.ElementType; title: string } } = {
        'key-findings': { icon: Lightbulb, title: "Key Findings" },
        'strategic-recommendations': { icon: ListChecks, title: "Strategic Recommendations" },
        'overall-theme-assessment': { icon: Palette, title: "Overall Theme Assessment" },
        'implementation-roadmap': { icon: Route, title: "Implementation Roadmap" },
    };

    useEffect(() => {
        const availableParsedKeys = Object.keys(parsedDetailedSections).filter(key => key !== 'executive-summary' && sectionDetails[key]);
        
        if (availableParsedKeys.length > 0) {
            if (!availableParsedKeys.includes(activeDetailedTab) || activeDetailedTab === 'executive-summary') {
                setActiveDetailedTab(availableParsedKeys[0]);
            }
        } else if (Object.keys(parsedDetailedSections).length === 0) {
            const firstKeyFromDetails = Object.keys(sectionDetails).find(key => key !== 'executive-summary');
            if (firstKeyFromDetails && activeDetailedTab !== firstKeyFromDetails && sectionDetails[activeDetailedTab] === undefined) {
                setActiveDetailedTab(firstKeyFromDetails);
            }
        }
    }, [parsedDetailedSections, activeDetailedTab, sectionDetails]);
    
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
                
                {/* Detailed tabs section */}
                <section className="mt-10">
                    <h2 className="text-3xl font-bold text-slate-900 mb-8">Detailed Findings</h2>
                    {Object.keys(parsedDetailedSections).filter(key => key !== 'executive-summary' && sectionDetails[key]).length > 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl overflow-hidden">
                            <Tabs value={activeDetailedTab} onValueChange={setActiveDetailedTab} className="w-full">
                                <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50/90 to-white/90 backdrop-blur-sm px-4 sm:px-6 py-3">
                                    <TabsList className="grid w-full grid-cols-2 sm:flex sm:w-auto bg-transparent p-0 h-auto gap-1 sm:gap-2 justify-start overflow-x-auto scrollbar-hide">
                                        {Object.keys(sectionDetails).map((key) => {
                                            if (key === 'executive-summary') return null;
                                            const sectionInfo = sectionDetails[key];
                                            const Icon = sectionInfo?.icon;
                                            return parsedDetailedSections[key] ? (
                                                <TabsTrigger
                                                    key={key}
                                                    value={key}
                                                    className="group flex items-center justify-center sm:justify-start text-center sm:text-left gap-2.5 px-4 py-3 h-auto sm:min-h-[56px] whitespace-nowrap rounded-lg border-2 border-transparent bg-slate-100/80 hover:bg-slate-200/80 data-[state=active]:bg-white data-[state=active]:border-blue-200 data-[state=active]:shadow-md data-[state=active]:text-blue-700 text-slate-600 font-medium transition-all duration-300 flex-shrink-0 text-xs sm:text-sm"
                                                >
                                                    {Icon && (
                                                        <div className="flex-shrink-0 w-7 h-7 rounded-md bg-slate-200 group-data-[state=active]:bg-blue-100 flex items-center justify-center transition-colors duration-300">
                                                            <Icon className="w-3.5 h-3.5 group-data-[state=active]:text-blue-600" />
                                                        </div>
                                                    )}
                                                    <span className="font-semibold">
                                                        {sectionInfo?.title || parsedDetailedSections[key]!.title}
                                                    </span>
                                                </TabsTrigger>
                                            ) : null;
                                        })}
                                    </TabsList>
                                </div>

                                <div className="p-6 sm:p-8">
                                    {Object.keys(parsedDetailedSections).map((key) => {
                                        if (key === 'executive-summary') return null;
                                        return parsedDetailedSections[key] && sectionDetails[key] && (
                                            <TabsContent key={key} value={key} className="mt-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none">
                                                <MarkdownSectionRenderer
                                                    title={parsedDetailedSections[key]!.title}
                                                    mainContent={parsedDetailedSections[key]!.content}
                                                    subsections={parsedDetailedSections[key]!.subsections}
                                                    performanceSummary={key === 'key-findings' ? performanceSummary : undefined}
                                                    goalAchievementAssessment={key === 'key-findings' ? goalAchievement : undefined}
                                                    icon={sectionDetails[key]!.icon}
                                                    sectionKey={key}
                                                />
                                            </TabsContent>
                                        )
                                    })}
                                </div>
                            </Tabs>
                        </div>
                    ) : (
                        <Card className="text-center p-10 border-slate-200/80 bg-white shadow-lg">
                            <FileText className="w-16 h-16 text-slate-400 mx-auto mb-6"/>
                            <p className="text-slate-600 text-xl font-medium mb-2">Detailed Overview Not Available</p>
                            <p className="text-sm text-slate-500">
                                The comprehensive markdown content could not be loaded or parsed correctly.
                            </p>
                        </Card>
                    )}
                </section>

                <section className="mt-20">
                    <h2 className="text-3xl font-bold text-slate-900 mb-8">Page-by-Page Analysis</h2>
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {pageAnalyses.map((page) => (
                            <Link key={page.id} href={`/report/${reportId}/page/${page.id}`} className="group block">
                                <Card className="h-full flex flex-col hover:shadow-xl transition-shadow">
                                    <CardHeader className="p-6 pb-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <CardTitle className="text-xl font-semibold text-slate-800 group-hover:text-blue-700 transition-colors duration-300">
                                                {page.title}
                                            </CardTitle>
                                            <div className={`flex items-center justify-center text-base font-bold p-1.5 px-3 rounded-lg min-w-[40px] h-9 border ${getScoreBoxClasses(page.overall_score)} shadow-sm`}>
                                                {page.overall_score}/10
                                            </div>
                                        </div>
                                        <CardDescription className="flex items-center gap-1.5 text-xs text-slate-500 pt-1 truncate">
                                            <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                                            <span className="truncate font-mono" title={page.url}>{page.url}</span>
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6 pt-0 flex-grow">
                                        <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                                            {page.summary}
                                        </p>
                                    </CardContent>
                                    <CardFooter className="p-6 pt-4 mt-auto border-t border-slate-100/90">
                                        <div className="text-sm font-semibold text-blue-600 group-hover:text-blue-700 flex items-center gap-1.5 transition-colors duration-300">
                                            View Detailed Analysis
                                            <ChevronRight className="h-4 w-4 transform transition-transform duration-300 group-hover:translate-x-1" />
                                        </div>
                                    </CardFooter>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}