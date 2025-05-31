import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ExternalLink, ChevronRight, Zap, Lightbulb, ListChecks, MapIcon, Palette, Trophy, Route, FileText, TrendingUp, ShieldCheck, MessageSquareHeart, Target as TargetIcon, CheckCircle2, AlertTriangleIcon } from "lucide-react";
import { ExecutiveSummary } from "@/components/ExecutiveSummary";

// Interfaces
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
  sections?: Array<{
    name: string;
    title: string;
    score: number;
    summary: string;
    points: string[];
    evidence: string;
    score_explanation: string;
  }>;
  detailed_analysis?: string;
  raw_analysis?: string;
  screenshot_path?: string;
}

interface OverallSummary {
  executive_summary: string; 
  overall_score: number;
  total_pages_analyzed: number;
  most_critical_issues: string[]; 
  top_recommendations: string[];  
  key_strengths: string[];       
  performance_summary: string; 
  detailed_markdown_content: string; 
}

interface ReportData {
  organization: string;
  analysis_date: string;
  timestamp?: string;
  overall_summary: OverallSummary;
  page_analyses: PageAnalysisDetail[];
  metadata?: any;
}

const fetchReportData = async (): Promise<ReportData> => {
  const response = await fetch("/report-data.json");
  if (!response.ok) {
    throw new Error("Network response was not ok: " + response.statusText);
  }
  const data = await response.json();
  // Ensure overall_summary and its critical sub-field detailed_markdown_content exist
  if (!data.overall_summary) {
    console.warn("Fetched data is missing 'overall_summary'. Using defaults.");
    data.overall_summary = {}; // Initialize if completely missing
  }
  if (typeof data.overall_summary.detailed_markdown_content !== 'string') {
    console.warn("Fetched data is missing or has invalid 'overall_summary.detailed_markdown_content'. Using defaults.");
    data.overall_summary.detailed_markdown_content = "# Overview Not Available\n\nThe detailed overview content could not be loaded.";
  }
  // Ensure other overall_summary fields have defaults if missing
    data.overall_summary = {
        executive_summary: data.overall_summary.executive_summary || "Executive summary not available.",
        overall_score: typeof data.overall_summary.overall_score === 'number' ? data.overall_summary.overall_score : 0,
        total_pages_analyzed: typeof data.overall_summary.total_pages_analyzed === 'number' ? data.overall_summary.total_pages_analyzed : (data.page_analyses?.length || 0),
        most_critical_issues: Array.isArray(data.overall_summary.most_critical_issues) ? data.overall_summary.most_critical_issues : [],
        top_recommendations: Array.isArray(data.overall_summary.top_recommendations) ? data.overall_summary.top_recommendations : [],
        key_strengths: Array.isArray(data.overall_summary.key_strengths) ? data.overall_summary.key_strengths : [],
        performance_summary: data.overall_summary.performance_summary || "Performance summary not available.",
        detailed_markdown_content: data.overall_summary.detailed_markdown_content // This is already defaulted above
    };
  return data;
};

const getScoreBoxClasses = (score: number): string => {
  if (score >= 7) return "bg-green-100 text-green-800 border-green-300";
  if (score >= 4) return "bg-yellow-100 text-yellow-800 border-yellow-300";
  return "bg-red-100 text-red-800 border-red-300";
};

const getOverallScoreStatusText = (score: number) => {
  if (score >= 8) return "Excellent";
  if (score >= 6) return "Good";
  return "Needs Work";
};

const MarkdownSectionRenderer: React.FC<{ 
    title: string; 
    mainContent: string; 
    subsections: Array<{ title: string; content: string }>;
    performanceSummary?: string; 
    goalAchievementAssessment?: string; 
    icon?: React.ElementType;
    sectionKey: string;
}> = ({ title, mainContent, subsections, performanceSummary, goalAchievementAssessment, icon: Icon, sectionKey }) => (
  <Card className="mb-8 shadow-lg border-slate-200/80 bg-white">
    <CardHeader className="bg-slate-50/70 border-b border-slate-200/80 p-6">
      <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-3">
        {Icon && <Icon className="w-7 h-7 text-blue-600 flex-shrink-0" />}
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-6 px-6 pb-6">
      {mainContent && mainContent.trim() && (
        <div className="prose prose-lg max-w-none text-slate-700 leading-relaxed mb-6 react-markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{mainContent}</ReactMarkdown>
        </div>
      )}
      
      {sectionKey === 'key-findings' && (
        <>
          {goalAchievementAssessment && (
            <div className="mt-4 mb-6 p-6 bg-indigo-50/70 border border-indigo-200/80 rounded-xl shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                    <TargetIcon className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                    <h4 className="text-xl font-semibold text-indigo-800">Goal Achievement Assessment</h4>
                </div>
                <div className="prose prose-base max-w-none text-indigo-700 leading-relaxed react-markdown-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{goalAchievementAssessment}</ReactMarkdown>
                </div>
            </div>
          )}
          {performanceSummary && (
            <div className="mt-4 mb-6 p-6 bg-purple-50/70 border border-purple-200/80 rounded-xl shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                    <Zap className="w-6 h-6 text-purple-600 flex-shrink-0" />
                    <h4 className="text-xl font-semibold text-purple-800">Performance Snapshot</h4>
                </div>
                <p className="text-purple-700 leading-relaxed text-base">{performanceSummary}</p>
            </div>
          )}
        </>
      )}

      {subsections && subsections.length > 0 && (
        <div className="space-y-4 mt-6">
          {subsections.map((sub, idx) => (
            <Accordion key={idx} type="single" collapsible className="w-full">
              <AccordionItem value={`subsection-${sectionKey}-${idx}`} className="border bg-white rounded-lg shadow-sm data-[state=open]:shadow-md overflow-hidden">
                <AccordionTrigger className="text-lg font-semibold text-slate-700 hover:text-blue-600 py-4 px-6 bg-slate-50/80 hover:bg-slate-100/90 transition-colors w-full text-left data-[state=open]:bg-slate-100 data-[state=open]:border-b border-slate-200">
                  {sub.title}
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-6 px-6">
                  <div className="prose prose-base max-w-none text-slate-600 leading-relaxed react-markdown-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{sub.content}</ReactMarkdown>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ))}
        </div>
      )}
       {(!mainContent || !mainContent.trim()) && (!subsections || subsections.length === 0) && sectionKey !== 'key-findings' && (
         <p className="text-slate-500 p-4 text-center">No specific details available for this section.</p>
       )}
    </CardContent>
  </Card>
);


const Index = () => {
  const [activeDetailedTab, setActiveDetailedTab] = useState("executive-summary"); 

  const { data: reportData, isLoading, error } = useQuery<ReportData, Error>({
    queryKey: ["reportData"],
    queryFn: fetchReportData,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  useEffect(() => {
    if (reportData?.overall_summary?.overall_score) {
      const timer = setTimeout(() => {
        const scoreRing = document.querySelector('.score-ring-progress') as SVGCircleElement;
        if (scoreRing) {
          const score = reportData.overall_summary.overall_score;
          const circumference = 2 * Math.PI * 45;
          const progress = (score / 10) * circumference;
          const offset = circumference - progress;
          
          scoreRing.style.strokeDashoffset = offset.toString();
          
          if (score >= 8) scoreRing.style.stroke = '#22c55e';
          else if (score >= 6) scoreRing.style.stroke = '#f59e0b';
          else scoreRing.style.stroke = '#ef4444';
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [reportData]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-gray-50 to-slate-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-slate-700">Loading Analysis Report...</p>
        </div>
      </div>
    );
  }
  
  if (error || !reportData || !reportData.overall_summary) { 
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100/30">
        <div className="text-center p-8 bg-white shadow-xl rounded-2xl max-w-lg">
            <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Error Loading Report</h1>
          <p className="text-slate-600 mb-6 text-lg">
            Could not load the analysis data. Please ensure "report-data.json" is available and correctly formatted.
          </p>
          {error && <pre className="text-xs text-red-700 bg-red-50 p-4 rounded-md text-left">{error.message}</pre>}
          {!reportData && <p className="text-slate-500 text-sm">Report data is undefined.</p>}
          {reportData && !reportData.overall_summary && <p className="text-slate-500 text-sm">Overall summary is missing in report data.</p>}
        </div>
      </div>
    );
  }

  const {
    organization = "Analysis Report",
    overall_summary,
    page_analyses = [],
    metadata,
    timestamp
  } = reportData as ReportData; 

  const analysisDateToDisplay = metadata?.generated_at ? new Date(metadata.generated_at).toLocaleDateString() : (timestamp ? new Date(timestamp).toLocaleDateString() : new Date().toLocaleDateString());

  const {
    executive_summary: concise_executive_summary, // Renamed to avoid conflict with parsed
    overall_score = 0,
    performance_summary = "No performance summary available.", 
    detailed_markdown_content = "# Overview Not Available\n\nThe detailed overview content could not be loaded."
  } = overall_summary;
  
  const totalPagesAnalyzed = metadata?.total_pages ?? page_analyses.length;

  const mainExecutiveSummaryParagraph = (() => {
    if (!detailed_markdown_content) return "";
    const execSummaryMatch = detailed_markdown_content.match(/^## EXECUTIVE SUMMARY\s*([\s\S]*?)(?=\n\n(?:## KEY FINDINGS|## STRATEGIC RECOMMENDATIONS|### Goal Achievement Assessment|$))/i);

    if (execSummaryMatch && execSummaryMatch[1]) {
        const summaryBlock = execSummaryMatch[1].trim();
        // Split into paragraphs, take the first few substantial ones, excluding score lines or sub-headers.
        const paragraphs = summaryBlock.split(/\n\s*\n+/);
        let extracted = "";
        let paragraphCount = 0;
        for (const p of paragraphs) {
            const trimmedP = p.trim();
            if (trimmedP && !trimmedP.startsWith("**Overall Effectiveness Score:") && !trimmedP.startsWith("###") && trimmedP.length > 30 && paragraphCount < 2) {
                extracted += (extracted ? "\n\n" : "") + trimmedP;
                paragraphCount++;
            }
            if(paragraphCount >=1 && !trimmedP.startsWith("-")) break; // Stop after first main paragraph if next is not a list
             if(paragraphCount >=2) break;
        }
        return extracted || concise_executive_summary; // Fallback to the short one
    }
    return concise_executive_summary; 
  })();

  const parsedDetailedSections = (() => {
    if (!detailed_markdown_content) return {};
    const sections: { [key: string]: { title: string; content: string; subsections: Array<{title:string; content:string}> } } = {};
    const lines = detailed_markdown_content.split('\n');
    let currentSectionKey: string | null = null;
    let currentSectionTitle: string | null = null;
    let currentSubsectionTitle: string | null = null;
    let mainSectionContentAccumulator: string[] = [];
    let subSectionContentAccumulator: string[] = [];

    const normalizeKey = (title: string) => title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    const commitSubSection = () => {
      if (currentSubsectionTitle && currentSectionKey && sections[currentSectionKey]) {
        if (currentSectionKey === 'executive-summary' && 
            (currentSubsectionTitle.toLowerCase().includes('key strengths') || 
             currentSubsectionTitle.toLowerCase().includes('critical weaknesses') ||
             currentSubsectionTitle.toLowerCase().includes('goal achievement assessment'))) {
          // Skip these as they are handled elsewhere or not part of the "details" of exec summary
        } else {
            sections[currentSectionKey].subsections.push({
              title: currentSubsectionTitle,
              content: subSectionContentAccumulator.join('\n').trim()
            });
        }
      }
      subSectionContentAccumulator = [];
      currentSubsectionTitle = null;
    };
    
    const commitMainSection = () => {
      commitSubSection(); 
      if (currentSectionKey && sections[currentSectionKey]) {
        let contentToAdd = mainSectionContentAccumulator.join('\n').trim();
        if (currentSectionKey === 'executive-summary' && mainExecutiveSummaryParagraph) {
            // Attempt to remove the already displayed main paragraph more carefully
            const mainParaLines = mainExecutiveSummaryParagraph.split('\n');
            let tempContent = contentToAdd;
            mainParaLines.forEach(line => {
                tempContent = tempContent.replace(line.trim(), '');
            });
            contentToAdd = tempContent.trim();
            // Remove "Goal Achievement Assessment" if it was part of the main content block
             contentToAdd = contentToAdd.replace(/(\n\n)?\*\*Goal Achievement Assessment:\*\*[\s\S]*?(?=\n\n##|$)/i, '').trim();
        }
        sections[currentSectionKey].content = contentToAdd; // Only assign the remaining content
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
  
  const sectionDetails: { [key: string]: { icon: React.ElementType; title: string } } = {
    'executive-summary': { icon: FileText, title: "Executive Summary Details" },
    'key-findings': { icon: Lightbulb, title: "Key Findings" },
    'strategic-recommendations': { icon: ListChecks, title: "Strategic Recommendations" },
    'overall-theme-assessment': { icon: Palette, title: "Overall Theme Assessment" },
    'implementation-roadmap': { icon: Route, title: "Implementation Roadmap" },
  };
  
  useEffect(() => {
    const availableParsedKeys = Object.keys(parsedDetailedSections).filter(key => sectionDetails[key]);
    if (availableParsedKeys.length > 0) {
      if (!availableParsedKeys.includes(activeDetailedTab)) {
        setActiveDetailedTab(availableParsedKeys[0]);
      }
    } else if (detailed_markdown_content && Object.keys(parsedDetailedSections).length === 0) {
      const firstKeyFromDetails = Object.keys(sectionDetails)[0];
      if (firstKeyFromDetails && activeDetailedTab !== firstKeyFromDetails && !sectionDetails[activeDetailedTab]) {
           setActiveDetailedTab(firstKeyFromDetails);
      }
    }
  }, [parsedDetailedSections, activeDetailedTab, detailed_markdown_content]); 

  const goalAchievementAssessmentText = `**Donations:** Poor (3/10) - Despite having a "Donate" button in navigation, the site lacks compelling donation appeals, impact stories, or contextual CTAs explaining why and how donations make a difference.\n\n**Training Sign-ups:** Below Average (4/10) - While training courses are well-described with strong content, the site lacks clear registration pathways, pricing information, course schedules, and compelling CTAs to drive enrollment.`;


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-blue-200 shadow-sm">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></div>
            Analysis Complete
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Website Analysis Report
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Comprehensive UX/UI evaluation for <span className="font-semibold text-slate-800">{metadata?.organization_name || organization}</span>
          </p>
           <p className="text-sm text-slate-500 mt-2">Generated on: {analysisDateToDisplay}</p>
        </header>

        <section className="grid lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-2">
            <ExecutiveSummary summary={{ executive_summary: concise_executive_summary, overall_score, total_pages_analyzed: totalPagesAnalyzed }} />
          </div>
          <div className="lg:col-span-1">
            <Card className="bg-white rounded-2xl border border-gray-200/60 p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-300 h-full">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="flex items-center gap-3 text-2xl font-semibold text-gray-900">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Trophy className="w-5 h-5 text-emerald-600" />
                    </div>
                    Overall Score
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex flex-col items-center">
                    <div className="relative mb-6">
                    <svg className="score-ring transform -rotate-90" width="120" height="120">
                        <circle cx="60" cy="60" r="45" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                        <circle
                        className="score-ring-progress"
                        cx="60" cy="60" r="45" fill="none" strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 45}`}
                        strokeDashoffset={`${2 * Math.PI * 45}`} 
                        style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">{overall_score.toFixed(1)}</div>
                        <div className="text-sm text-gray-500 font-medium">/ 10</div>
                        </div>
                    </div>
                    </div>
                    <div className="text-center">
                    <Badge variant="outline" className={`text-xs sm:text-sm font-semibold mb-2 px-3 py-1 border ${getScoreBoxClasses(overall_score)}`}>
                        {getOverallScoreStatusText(overall_score)}
                    </Badge>
                    <p className="text-gray-600 text-sm">
                        {overall_score >= 8 ? 'Outstanding performance' : 
                        overall_score >= 6 ? 'Solid foundation with opportunities' : 
                        'Significant room for improvement'}
                    </p>
                    </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>        
        <section className="mt-10">
          {Object.keys(parsedDetailedSections).length > 0 ? (
            <Tabs value={activeDetailedTab} onValueChange={setActiveDetailedTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-8 bg-slate-200/80 p-2 rounded-xl h-auto shadow-sm">
                {Object.keys(sectionDetails).map((key) => {
                  const sectionInfo = sectionDetails[key];
                  const Icon = sectionInfo?.icon;
                  return parsedDetailedSections[key] ? (
                      <TabsTrigger 
                        key={key} 
                        value={key} 
                        className="flex-col sm:flex-row h-auto items-center justify-center sm:h-12 py-3 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-700 data-[state=active]:font-semibold text-slate-600 hover:bg-slate-300/50 text-xs sm:text-sm transition-all rounded-lg"
                      >
                        {Icon && <Icon className="w-5 h-5 mr-0 mb-1 sm:mr-2 sm:mb-0 flex-shrink-0" />} 
                        <span className="text-center sm:text-left">{sectionInfo?.title || parsedDetailedSections[key]!.title}</span>
                      </TabsTrigger>
                  ) : null;
                })}
              </TabsList>

              {Object.keys(parsedDetailedSections).map((key) => (
                parsedDetailedSections[key] && sectionDetails[key] && (
                  <TabsContent key={key} value={key} className="focus-visible:ring-0 focus-visible:ring-offset-0 outline-none">
                    <MarkdownSectionRenderer 
                        title={parsedDetailedSections[key]!.title} 
                        mainContent={parsedDetailedSections[key]!.content} 
                        subsections={parsedDetailedSections[key]!.subsections}
                        performanceSummary={key === 'key-findings' ? performance_summary : undefined}
                        goalAchievementAssessment={key === 'key-findings' ? goalAchievementAssessmentText : undefined}
                        icon={sectionDetails[key]!.icon}
                        sectionKey={key}
                    />
                  </TabsContent>
                )
              ))}
            </Tabs>
          ) : (
            <Card className="text-center p-10 border-slate-200/80 bg-white shadow">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4"/>
                <p className="text-slate-600 text-lg">No detailed overview content is available in the report data.</p>
                <p className="text-sm text-slate-500 mt-2">Please check if `detailed_markdown_content` is populated in `report-data.json`.</p>
            </Card>
          )}
        </section>

        <section className="mt-20">
            <header className="flex items-center gap-4 mb-10 border-b border-slate-300/70 pb-6">
                <MapIcon className="w-8 h-8 text-indigo-600 flex-shrink-0" />
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Individual Page Analyses</h2>
                {page_analyses.length > 0 && (
                <Badge variant="secondary" className="text-sm ml-auto bg-indigo-100 text-indigo-700 border-indigo-200 px-3 py-1.5 rounded-md">
                    {totalPagesAnalyzed} Pages
                </Badge>
                )}
            </header>
            {page_analyses.length > 0 ? (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                {page_analyses.map((page) => (
                    <Link key={page.id} to={`/page/${page.id}`} className="group block h-full">
                    <Card className="h-full flex flex-col transition-all duration-300 ease-in-out rounded-2xl border border-gray-200/80 hover:shadow-xl group-hover:border-blue-500/80 p-0 bg-white hover:scale-[1.025] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 outline-none">
                        <CardHeader className="p-6 pb-4">
                        <div className="flex justify-between items-start mb-2">
                            <CardTitle className="text-xl font-semibold text-slate-800 group-hover:text-blue-700 transition-colors duration-300">
                            {page.title}
                            </CardTitle>
                            <div className={`flex items-center justify-center text-lg font-bold p-2 px-3.5 rounded-lg min-w-[40px] h-[40px] border ${getScoreBoxClasses(page.overall_score)} shadow-sm`}>
                            {page.overall_score}
                            </div>
                        </div>
                        <CardDescription className="flex items-center gap-1.5 text-xs text-slate-500 pt-1 truncate">
                            <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate" title={page.url}>{page.url}</span>
                        </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 pt-0 flex-grow">
                        <p className="text-sm text-slate-600 leading-relaxed line-clamp-4">
                            {page.summary}
                        </p>
                        </CardContent>
                        <CardFooter className="p-6 pt-3 mt-auto border-t border-gray-100/80">
                        <div className="text-sm font-semibold text-blue-600 group-hover:text-blue-700 flex items-center gap-1.5 transition-colors duration-300">
                            View Detailed Analysis
                            <ChevronRight className="h-4 w-4 transform transition-transform duration-300 group-hover:translate-x-1" />
                        </div>
                        </CardFooter>
                    </Card>
                    </Link>
                ))}
                </div>
            ) : (
                 <Card className="text-center p-10 border-slate-200/80 bg-white shadow">
                    <MessageSquareHeart className="w-12 h-12 text-slate-400 mx-auto mb-4"/>
                    <p className="text-slate-600 text-lg">No individual page analyses are available in this report.</p>
                </Card>
            )}
        </section>

      </div>
    </div>
  );
};

export default Index;