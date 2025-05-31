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

// IMPROVED COLOR GRADING WITH MORE GRANULAR SCALE
const getScoreBoxClasses = (score: number): string => {
  if (score >= 9) return "bg-emerald-100 text-emerald-800 border-emerald-300"; // Excellent (9-10)
  if (score >= 7) return "bg-green-100 text-green-800 border-green-300"; // Good (7-8)
  if (score >= 6) return "bg-lime-100 text-lime-800 border-lime-300"; // Above Average (6)
  if (score >= 5) return "bg-yellow-100 text-yellow-800 border-yellow-300"; // Average (5)
  if (score >= 4) return "bg-orange-100 text-orange-800 border-orange-300"; // Below Average (4)
  if (score >= 2) return "bg-red-100 text-red-700 border-red-300"; // Poor (2-3)
  return "bg-red-200 text-red-900 border-red-400"; // Very Poor (0-1)
};

const getOverallScoreStatusText = (score: number) => {
  if (score >= 8) return "Excellent";
  if (score >= 6) return "Good";
  return "Needs Work";
};

// SIMPLIFIED COMPONENT - REMOVED CARD WRAPPER
const MarkdownSectionRenderer: React.FC<{
    title: string;
    mainContent: string;
    subsections: Array<{ title: string; content: string }>;
    performanceSummary?: string;
    goalAchievementAssessment?: string;
    icon?: React.ElementType;
    sectionKey: string;
}> = ({ title, mainContent, subsections, performanceSummary, goalAchievementAssessment, icon: Icon, sectionKey }) => (
  <div className="space-y-6">
    {mainContent && mainContent.trim() && (
      <div className="prose prose-lg max-w-none text-slate-700 leading-relaxed react-markdown-content">
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
              <div className="prose prose-base max-w-none text-indigo-700 leading-relaxed react-markdown-content">
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
                <div className="prose prose-base max-w-none text-slate-600 leading-relaxed react-markdown-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{sub.content}</ReactMarkdown>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ))}
      </div>
    )}

    {/* Performance Summary moved to bottom for key-findings */}
    {sectionKey === 'key-findings' && performanceSummary && (
      <div className="p-6 bg-purple-50/70 border border-purple-200/80 rounded-xl shadow-sm">
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


const Index = () => {
  // HOOK 1
  const [activeDetailedTab, setActiveDetailedTab] = useState("key-findings");

  // HOOK 2 (useQuery)
  const { data: reportData, isLoading, error } = useQuery<ReportData, Error>({
    queryKey: ["reportData"],
    queryFn: fetchReportData,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // States for data derived from reportData
  const [organizationName, setOrganizationName] = useState("Analysis Report");
  const [analysisDateToDisplay, setAnalysisDateToDisplay] = useState(new Date().toLocaleDateString());
  const [conciseExecutiveSummary, setConciseExecutiveSummary] = useState("Executive summary not available.");
  const [overallScore, setOverallScore] = useState(0);
  const [totalPagesAnalyzed, setTotalPagesAnalyzed] = useState(0);
  const [performanceSummary, setPerformanceSummary] = useState("No performance summary available.");
  const [detailedMarkdownContentState, setDetailedMarkdownContentState] = useState("# Overview Not Available\n\nThe detailed overview content could not be loaded.");
  const [pageAnalysesForDisplay, setPageAnalysesForDisplay] = useState<PageAnalysisDetail[]>([]);
  const [mainExecutiveSummaryParagraph, setMainExecutiveSummaryParagraph] = useState("");
  const [parsedDetailedSections, setParsedDetailedSections] = useState<{ [key: string]: { title: string; content: string; subsections: Array<{title:string; content:string}> } }>({});

  // HOOK 3 (Score Ring Animation)
  useEffect(() => {
    if (overallScore > 0) { // Check if overallScore has a valid value
      const timer = setTimeout(() => {
        const scoreRing = document.querySelector('.score-ring-progress') as SVGCircleElement;
        if (scoreRing) {
          const circumference = 2 * Math.PI * 45;
          const progress = (overallScore / 10) * circumference;
          const offset = circumference - progress;

          scoreRing.style.strokeDashoffset = offset.toString();

          if (overallScore >= 8) scoreRing.style.stroke = '#22c55e';
          else if (overallScore >= 6) scoreRing.style.stroke = '#f59e0b';
          else scoreRing.style.stroke = '#ef4444';
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [overallScore]); // Depend on the overallScore state

  // Effect to process data when reportData is available
  useEffect(() => {
    if (reportData && reportData.overall_summary && reportData.metadata) {
      const {
        organization: orgFromData = "Analysis Report",
        overall_summary,
        page_analyses = [],
        metadata,
        timestamp
      } = reportData;

      setOrganizationName(metadata?.organization_name || orgFromData);
      setAnalysisDateToDisplay(metadata?.generated_at ? new Date(metadata.generated_at).toLocaleDateString() : (timestamp ? new Date(timestamp).toLocaleDateString() : new Date().toLocaleDateString()));

      const {
        executive_summary: cs,
        overall_score: os = 0,
        total_pages_analyzed: tpaValue,
        performance_summary: ps = "No performance summary available.",
        detailed_markdown_content: dmc = "# Overview Not Available\n\nThe detailed overview content could not be loaded."
      } = overall_summary;

      setConciseExecutiveSummary(cs || "Executive summary not available.");
      setOverallScore(typeof os === 'number' ? os : 0);
      setTotalPagesAnalyzed(typeof tpaValue === 'number' ? tpaValue : (metadata?.total_pages ?? page_analyses.length));
      setPerformanceSummary(ps);
      setDetailedMarkdownContentState(dmc); // Update state for detailed markdown
      setPageAnalysesForDisplay(page_analyses);

      const mainExecSummaryP = (() => {
        if (!dmc) return cs || "";
        const execSummaryMatch = dmc.match(/^## EXECUTIVE SUMMARY\s*([\s\S]*?)(?=\n\n(?:## KEY FINDINGS|## STRATEGIC RECOMMENDATIONS|### Goal Achievement Assessment|$))/i);

        if (execSummaryMatch && execSummaryMatch[1]) {
            const summaryBlock = execSummaryMatch[1].trim();
            const paragraphs = summaryBlock.split(/\n\s*\n+/);
            let extracted = "";
            let paragraphCount = 0;
            for (const p of paragraphs) {
                const trimmedP = p.trim();
                if (trimmedP && !trimmedP.startsWith("**Overall Effectiveness Score:") && !trimmedP.startsWith("###") && trimmedP.length > 30 && paragraphCount < 2) {
                    extracted += (extracted ? "\n\n" : "") + trimmedP;
                    paragraphCount++;
                }
                if(paragraphCount >=1 && !trimmedP.startsWith("-")) break;
                 if(paragraphCount >=2) break;
            }
            return extracted || cs || "";
        }
        return cs || "";
      })();
      setMainExecutiveSummaryParagraph(mainExecSummaryP);

      const parsedSections = (() => {
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
            if (currentSectionKey === 'executive-summary' &&
                (currentSubsectionTitle.toLowerCase().includes('key strengths') ||
                 currentSubsectionTitle.toLowerCase().includes('critical weaknesses') ||
                 currentSubsectionTitle.toLowerCase().includes('goal achievement assessment'))) {
              // Skip
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
            if (currentSectionKey === 'executive-summary' && mainExecSummaryP) { // Use mainExecSummaryP
                const mainParaLines = mainExecSummaryP.split('\n');
                let tempContent = contentToAdd;
                mainParaLines.forEach(line => {
                    const trimmedLine = line.trim();
                    const regex = new RegExp(`(^|\\n)${trimmedLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*')}(\\n|$)`, 'gi');
                    tempContent = tempContent.replace(regex, (match, p1, p2) => (p1 && p2) ? p1 : ''); // More careful removal
                });
                contentToAdd = tempContent.replace(/\n\s*\n/g, '\n\n').trim();

                 contentToAdd = contentToAdd.replace(/(\n\n)?\*\*Goal Achievement Assessment:\*\*[\s\S]*?(?=\n\n##|$)/i, '').trim();
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
      setParsedDetailedSections(parsedSections);
    }
  }, [reportData]);


  // REMOVED 'executive-summary' from sectionDetails
  const sectionDetails: { [key: string]: { icon: React.ElementType; title: string } } = {
    'key-findings': { icon: Lightbulb, title: "Key Findings" },
    'strategic-recommendations': { icon: ListChecks, title: "Strategic Recommendations" },
    'overall-theme-assessment': { icon: Palette, title: "Overall Theme Assessment" },
    'implementation-roadmap': { icon: Route, title: "Implementation Roadmap" },
  };

  // HOOK 4 (Tab Logic) - Updated default to 'key-findings'
  useEffect(() => {
    const availableParsedKeys = Object.keys(parsedDetailedSections).filter(key => sectionDetails[key]);
    if (availableParsedKeys.length > 0) {
      if (!availableParsedKeys.includes(activeDetailedTab)) {
        setActiveDetailedTab(availableParsedKeys[0]);
      }
    } else if (detailedMarkdownContentState && Object.keys(parsedDetailedSections).length === 0) { // Use state here
      const firstKeyFromDetails = Object.keys(sectionDetails)[0];
      if (firstKeyFromDetails && activeDetailedTab !== firstKeyFromDetails && !sectionDetails[activeDetailedTab]) {
           setActiveDetailedTab(firstKeyFromDetails);
      }
    }
  }, [parsedDetailedSections, activeDetailedTab, detailedMarkdownContentState]); // Use state for detailedMarkdownContent

  // Conditional Rendering Logic
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
            Comprehensive UX/UI evaluation for <span className="font-semibold text-slate-800">{organizationName}</span>
          </p>
           <p className="text-sm text-slate-500 mt-2">Generated on: {analysisDateToDisplay}</p>
        </header>

        <section className="grid lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-2">
            {/* Use state variables for ExecutiveSummary */}
            <ExecutiveSummary summary={{ executive_summary: mainExecutiveSummaryParagraph || conciseExecutiveSummary, overall_score: overallScore, total_pages_analyzed: totalPagesAnalyzed }} />
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
                        {/* Use overallScore state */}
                        <div className="text-3xl font-bold text-gray-900">{overallScore.toFixed(1)}</div>
                        <div className="text-sm text-gray-500 font-medium">/ 10</div>
                        </div>
                    </div>
                    </div>
                    <div className="text-center">
                    {/* Use overallScore state */}
                    <Badge variant="outline" className={`text-xs sm:text-sm font-semibold mb-2 px-3 py-1 border ${getScoreBoxClasses(overallScore)}`}>
                        {getOverallScoreStatusText(overallScore)}
                    </Badge>
                    <p className="text-gray-600 text-sm">
                        {overallScore >= 8 ? 'Outstanding performance' :
                        overallScore >= 6 ? 'Solid foundation with opportunities' :
                        'Significant room for improvement'}
                    </p>
                    </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        
        <section className="mt-10">
          {/* Use parsedDetailedSections state - IMPROVED TABS SECTION */}
          {Object.keys(parsedDetailedSections).length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-lg overflow-hidden">
              <Tabs value={activeDetailedTab} onValueChange={setActiveDetailedTab} className="w-full">
                {/* Improved TabsList with better spacing and overflow handling */}
                <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50/80 to-white/80 backdrop-blur-sm px-6 py-4">
                  <TabsList className="w-full bg-transparent p-0 h-auto gap-1 justify-start overflow-x-auto scrollbar-hide">
                    <div className="flex gap-2 min-w-max">
                      {Object.keys(sectionDetails).map((key) => {
                        const sectionInfo = sectionDetails[key];
                        const Icon = sectionInfo?.icon;
                        // Use parsedDetailedSections state
                        return parsedDetailedSections[key] ? (
                          <TabsTrigger
                            key={key}
                            value={key}
                            className="group flex items-center gap-3 px-6 py-4 min-h-[60px] whitespace-nowrap rounded-xl border-2 border-transparent bg-slate-100/80 hover:bg-slate-200/80 data-[state=active]:bg-white data-[state=active]:border-blue-200 data-[state=active]:shadow-lg data-[state=active]:text-blue-700 text-slate-600 font-medium transition-all duration-300 flex-shrink-0"
                          >
                            {Icon && (
                              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-200 group-data-[state=active]:bg-blue-100 flex items-center justify-center transition-colors duration-300">
                                <Icon className="w-4 h-4 group-data-[state=active]:text-blue-600" />
                              </div>
                            )}
                            <span className="text-sm font-semibold">
                              {sectionInfo?.title || parsedDetailedSections[key]!.title}
                            </span>
                          </TabsTrigger>
                        ) : null;
                      })}
                    </div>
                  </TabsList>
                </div>

                {/* Tab Content with proper padding */}
                <div className="p-8">
                  {/* Use parsedDetailedSections state */}
                  {Object.keys(parsedDetailedSections).map((key) => (
                    parsedDetailedSections[key] && sectionDetails[key] && (
                      <TabsContent key={key} value={key} className="mt-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none">
                        <MarkdownSectionRenderer
                            title={parsedDetailedSections[key]!.title}
                            mainContent={parsedDetailedSections[key]!.content}
                            subsections={parsedDetailedSections[key]!.subsections}
                            // Use performanceSummary state
                            performanceSummary={key === 'key-findings' ? performanceSummary : undefined}
                            goalAchievementAssessment={key === 'key-findings' ? goalAchievementAssessmentText : undefined}
                            icon={sectionDetails[key]!.icon}
                            sectionKey={key}
                        />
                      </TabsContent>
                    )
                  ))}
                </div>
              </Tabs>
            </div>
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
                {/* Use pageAnalysesForDisplay state */}
                {pageAnalysesForDisplay.length > 0 && (
                // Use totalPagesAnalyzed state
                <Badge variant="secondary" className="text-sm ml-auto bg-indigo-100 text-indigo-700 border-indigo-200 px-3 py-1.5 rounded-md">
                    {totalPagesAnalyzed} Pages
                </Badge>
                )}
            </header>
            {/* Use pageAnalysesForDisplay state */}
            {pageAnalysesForDisplay.length > 0 ? (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                {pageAnalysesForDisplay.map((page) => (
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