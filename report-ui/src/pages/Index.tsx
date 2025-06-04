import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom"; // Import useParams
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // Ensure this is installed if you use it
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ExternalLink, ChevronRight, Zap, Lightbulb, ListChecks, MapIcon, Palette, Trophy, Route, FileText, TrendingUp, ShieldCheck, MessageSquareHeart, Target as TargetIcon, CheckCircle2, AlertTriangleIcon, Info, Home, AlertCircle } from "lucide-react";
import { ExecutiveSummary } from "@/components/ExecutiveSummary";

// Interfaces (ensure these match your actual data structure in report-data.json)
interface PageIssue {
  issue: string;
  how_to_fix?: string;
}

interface PageRecommendation {
  recommendation: string;
  benefit?: string;
}
interface PageAnalysisDetail {
  id: string; // This 'id' is for the page within the report
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
  screenshot_path?: string; // e.g., "assets/screenshots/000_example.com_index.png"
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
  // Add other metadata fields if present in your report-data.json's metadata object
}

interface ReportData {
  organization: string; // Fallback if metadata.organization_name is not present
  analysis_date: string; // Fallback if metadata.generated_at is not present
  timestamp?: string; // Original top-level timestamp
  overall_summary: OverallSummary;
  page_analyses: PageAnalysisDetail[];
  metadata?: ReportMetadata;
}

// Modified fetchReportData to accept reportId
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
      console.warn(`Fetched data for report ${reportId} is missing 'overall_summary'. Using defaults.`);
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
    throw new Error(`Failed to parse report data for ${reportId}. Ensure it's valid JSON.`);
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


const Index = () => { 
  const { reportId } = useParams<{ reportId: string }>();
  const [activeDetailedTab, setActiveDetailedTab] = useState("key-findings");

  const { data: reportData, isLoading, error, isError } = useQuery<ReportData, Error>({
    queryKey: ["reportData", reportId], 
    queryFn: () => fetchReportData(reportId),
    enabled: !!reportId, 
    staleTime: Infinity, 
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const [organizationName, setOrganizationName] = useState("Analysis Report");
  const [analysisDateToDisplay, setAnalysisDateToDisplay] = useState(new Date().toLocaleDateString());
  const [conciseExecutiveSummary, setConciseExecutiveSummary] = useState("Executive summary not available.");
  const [overallScore, setOverallScore] = useState(0);
  const [siteScoreExplanation, setSiteScoreExplanation] = useState("Overall site score explanation not available.");
  const [totalPagesAnalyzed, setTotalPagesAnalyzed] = useState(0);
  const [performanceSummary, setPerformanceSummary] = useState("No performance summary available.");
  const [detailedMarkdownContentState, setDetailedMarkdownContentState] = useState("# Overview Not Available\n\nThe detailed overview content could not be loaded.");
  const [pageAnalysesForDisplay, setPageAnalysesForDisplay] = useState<PageAnalysisDetail[]>([]);
  const [mainExecutiveSummaryParagraph, setMainExecutiveSummaryParagraph] = useState("");
  const [parsedDetailedSections, setParsedDetailedSections] = useState<{ [key: string]: { title: string; content: string; subsections: Array<{title:string; content:string}> } }>({});
  const [goalAchievementAssessment, setGoalAchievementAssessment] = useState<string>("");


  useEffect(() => {
    if (reportData && reportData.overall_summary) {
      const {
        organization: orgFromData, 
        overall_summary,
        page_analyses = [],
        metadata,
        timestamp,
        analysis_date 
      } = reportData;

      setOrganizationName(metadata?.organization_name || orgFromData || `Report ID: ${reportId}`);
      setAnalysisDateToDisplay(metadata?.generated_at ? new Date(metadata.generated_at).toLocaleDateString() : (timestamp ? new Date(timestamp).toLocaleDateString() : (analysis_date || new Date().toLocaleDateString())));
      
      const {
        executive_summary: es,
        overall_score: os = 0,
        site_score_explanation: sse,
        total_pages_analyzed: tpaValue,
        performance_summary: ps = "No performance summary available.",
        detailed_markdown_content: dmc = "# Overview Not Available\n\nThe detailed overview content could not be loaded."
      } = overall_summary;

      // This will be used by the ExecutiveSummary card component directly
      setMainExecutiveSummaryParagraph(es || "Executive summary not available."); 
      // Set conciseExecutiveSummary if you still need a shorter version elsewhere, or set it to the full es
      setConciseExecutiveSummary(es || "Executive summary not available.");


      setOverallScore(typeof os === 'number' ? os : 0);
      setSiteScoreExplanation(sse || "Overall site score explanation not available.");
      setTotalPagesAnalyzed(typeof tpaValue === 'number' ? tpaValue : (metadata?.total_pages ?? page_analyses.length));
      setPerformanceSummary(ps);
      setDetailedMarkdownContentState(dmc);
      setPageAnalysesForDisplay(page_analyses);

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
      setGoalAchievementAssessment(extractedGoalAssessment);

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
            // Ensure not to add 'Key Strengths' or 'Critical Weaknesses' as subsections of 'Executive Summary'
            if (!(currentSectionKey === 'executive-summary' && (currentSubsectionTitle.toLowerCase().includes('key strengths') || currentSubsectionTitle.toLowerCase().includes('critical weaknesses')))) {
                sections[currentSectionKey].subsections.push({ title: currentSubsectionTitle, content: subSectionContentAccumulator.join('\n').trim() });
            }
          }
          subSectionContentAccumulator = [];
          currentSubsectionTitle = null;
        };

        const commitMainSection = () => {
          commitSubSection(); // Commit any pending subsection first
          if (currentSectionKey && sections[currentSectionKey]) {
            let contentToAdd = mainSectionContentAccumulator.join('\n').trim();
            // For executive summary, ensure we don't duplicate the main paragraph if it's part of the overall content
            if (currentSectionKey === 'executive-summary' && mainExecutiveSummaryParagraph) {
                const mainParaLines = mainExecutiveSummaryParagraph.split('\n');
                let tempContent = contentToAdd;
                mainParaLines.forEach(line => {
                    const trimmedLine = line.trim();
                     // Regex to remove the exact line, trying to avoid removing parts of other lines
                    const regex = new RegExp(`(^|\\n)${trimmedLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*')}(\\n|$)`, 'gi');
                    tempContent = tempContent.replace(regex, (match, p1, p2) => (p1 && p2) ? p1 : ''); 
                });
                 contentToAdd = tempContent.replace(/\n\s*\n/g, '\n\n').trim(); // Clean up extra newlines
                 // Also remove specific subheadings from the main content of executive summary if they were parsed separately
                 contentToAdd = contentToAdd.replace(/(\n\n)?\*\*Goal Achievement Assessment:\*\*[\s\S]*?(?=\n\n##|$)/i, '').trim();
                 contentToAdd = contentToAdd.replace(/(\n\n)?###?\s*Goal Achievement Assessment[\s\S]*?(?=\n\n##|$)/i, '').trim();

            }
            sections[currentSectionKey].content = contentToAdd;
          }
          mainSectionContentAccumulator = [];
        };

        for (const line of lines) {
          if (line.startsWith('## ')) { // Main section (H2)
            commitMainSection(); // Commit previous section before starting a new one
            currentSectionTitle = line.substring(3).trim();
            currentSectionKey = normalizeKey(currentSectionTitle);
            if (!currentSectionKey) continue; // Skip if key is invalid (e.g., empty title)
            sections[currentSectionKey] = { title: currentSectionTitle, content: '', subsections: [] };
          } else if (line.startsWith('### ')) { // Subsection (H3)
            commitSubSection(); // Commit previous subsection
            if (currentSectionKey) { // Only if we are inside a main section
              currentSubsectionTitle = line.substring(4).trim();
               // Don't treat "Goal Achievement Assessment" under "Key Findings" as a new subsection for accordion
              if (currentSectionKey === 'key-findings' && currentSubsectionTitle.toLowerCase().includes('goal achievement assessment')) {
                  currentSubsectionTitle = null; // It's part of key findings main content
              }
            }
          } else if (currentSectionKey) { // Content lines
            if (currentSubsectionTitle) {
              subSectionContentAccumulator.push(line);
            } else {
              mainSectionContentAccumulator.push(line);
            }
          }
        }
        commitMainSection(); // Commit the last section
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
  }, [overallScore]);

  const sectionDetails: { [key: string]: { icon: React.ElementType; title: string } } = {
    // "executive-summary" is intentionally removed from here as it won't be a tab
    'key-findings': { icon: Lightbulb, title: "Key Findings" },
    'strategic-recommendations': { icon: ListChecks, title: "Strategic Recommendations" },
    'overall-theme-assessment': { icon: Palette, title: "Overall Theme Assessment" },
    'implementation-roadmap': { icon: Route, title: "Implementation Roadmap" },
  };

 useEffect(() => {
    // Filter out 'executive-summary' before determining the default tab
    const availableParsedKeys = Object.keys(parsedDetailedSections).filter(key => key !== 'executive-summary' && sectionDetails[key]);
    
    if (availableParsedKeys.length > 0) {
      if (!availableParsedKeys.includes(activeDetailedTab) || activeDetailedTab === 'executive-summary') {
        setActiveDetailedTab(availableParsedKeys[0]);
      }
    } else if (detailedMarkdownContentState && Object.keys(parsedDetailedSections).length === 0) {
      // Fallback if no sections are parsed but DMW content exists
      const firstKeyFromDetails = Object.keys(sectionDetails).find(key => key !== 'executive-summary');
       if (firstKeyFromDetails && activeDetailedTab !== firstKeyFromDetails && sectionDetails[activeDetailedTab] === undefined) { // ensure activeTab is not already valid non-exec
           setActiveDetailedTab(firstKeyFromDetails);
      }
    }
  }, [parsedDetailedSections, activeDetailedTab, detailedMarkdownContentState, sectionDetails]);


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-gray-50 to-slate-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-slate-700">Loading Analysis Report: {reportId}...</p>
        </div>
      </div>
    );
  }

  if (isError || !reportData || !reportData.overall_summary) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100/30">
        <div className="text-center p-8 bg-white shadow-xl rounded-2xl max-w-lg">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Error Loading Report: {reportId}</h1>
          <p className="text-slate-600 mb-6 text-lg">
            Could not load the analysis data for this report. Please ensure "report-data.json" is available at `/all_analysis_runs/${reportId}/report-data.json`.
          </p>
          {error && <pre className="text-xs text-red-700 bg-red-50 p-4 rounded-md text-left mt-4">{error.message}</pre>}
          <Link to="/reports" className="mt-8 inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            <Home size={18} />
            Back to Report List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
            <Link
                to="/reports"
                className="inline-flex items-center gap-3 text-slate-600 hover:text-blue-600 transition-all duration-300 font-medium group"
            >
                <Home className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform duration-300" />
                All Reports
            </Link>
        </div>
        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-6 py-3 rounded-2xl text-sm font-semibold mb-8 border border-blue-100 shadow-sm">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></div>
            Analysis Complete
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Website Analysis: {organizationName}
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Comprehensive UX/UI evaluation conducted on {analysisDateToDisplay}.
          </p>
        </header>

        <section className="grid lg:grid-cols-3 gap-8 mb-16">
          <div className="lg:col-span-2">
             {/* ExecutiveSummary card now directly uses mainExecutiveSummaryParagraph */}
             <ExecutiveSummary 
                summary={{ 
                  executive_summary: mainExecutiveSummaryParagraph, 
                  overall_score: overallScore, 
                  total_pages_analyzed: totalPagesAnalyzed 
                }} 
              />
          </div>
          <div className="lg:col-span-1">
            <Card className="bg-white rounded-2xl border border-slate-200/70 p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="flex items-center gap-3 text-2xl font-semibold text-slate-900">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow">
                        <Trophy className="w-5 h-5 text-emerald-600" />
                    </div>
                    Overall Site Score
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex flex-col items-center">
                    <div className="relative mb-6">
                    <svg className="score-ring transform -rotate-90" width="120" height="120">
                        <circle cx="60" cy="60" r="45" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                        <circle
                        className="score-ring-progress"
                        cx="60" cy="60" r="45" fill="none" strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 45}`}
                        strokeDashoffset={`${2 * Math.PI * 45}`}
                        style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1) .5s' }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                        <div className="text-3xl font-bold text-slate-900">{overallScore.toFixed(1)}</div>
                        <div className="text-sm text-slate-500 font-medium">/10</div>
                        </div>
                    </div>
                    </div>
                    <div className="text-center w-full">
                      <Badge variant="outline" className={`text-xs sm:text-sm font-semibold mb-3 px-3 py-1.5 border ${getScoreBoxClasses(overallScore)}`}>
                          {getOverallScoreStatusText(overallScore)}
                      </Badge>
                      <p className="text-slate-600 text-sm mb-4">
                          {overallScore >= 8 ? 'Strong overall performance with excellent UX.' :
                          overallScore >= 6 ? 'Good foundation, but key areas need attention.' :
                          'Significant opportunities for improvement across the site.'}
                      </p>
                       {siteScoreExplanation && siteScoreExplanation !== "Overall site score explanation not available." && (
                        <div className="mt-4 pt-4 border-t border-slate-200/70">
                             <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center justify-center gap-2">
                                <Info size={16} className="text-blue-500" />
                                Score Rationale
                            </h4>
                            <p className="text-xs text-slate-600 leading-relaxed text-center">
                                {siteScoreExplanation}
                            </p>
                        </div>
                    )}
                    </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        
        <section className="mt-10">
           {/* Ensure we only render tabs if there are sections other than executive summary */}
           {Object.keys(parsedDetailedSections).filter(key => key !== 'executive-summary' && sectionDetails[key]).length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl overflow-hidden">
              <Tabs value={activeDetailedTab} onValueChange={setActiveDetailedTab} className="w-full">
                 <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50/90 to-white/90 backdrop-blur-sm px-4 sm:px-6 py-3">
                  <TabsList className="grid w-full grid-cols-2 sm:flex sm:w-auto bg-transparent p-0 h-auto gap-1 sm:gap-2 justify-start overflow-x-auto scrollbar-hide">
                     {Object.keys(sectionDetails).map((key) => {
                        // Skip 'executive-summary' tab
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
                    // Skip 'executive-summary' tab content
                    if (key === 'executive-summary') return null;

                    return parsedDetailedSections[key] && sectionDetails[key] && (
                      <TabsContent key={key} value={key} className="mt-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none">
                        <MarkdownSectionRenderer
                            title={parsedDetailedSections[key]!.title}
                            mainContent={parsedDetailedSections[key]!.content}
                            subsections={parsedDetailedSections[key]!.subsections}
                            performanceSummary={key === 'key-findings' ? performanceSummary : undefined}
                            goalAchievementAssessment={key === 'key-findings' ? goalAchievementAssessment : undefined}
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
             Object.keys(parsedDetailedSections).length === 0 && // Only show this if NO sections were parsed at all
             <Card className="text-center p-10 border-slate-200/80 bg-white shadow-lg">
                <FileText className="w-16 h-16 text-slate-400 mx-auto mb-6"/>
                <p className="text-slate-600 text-xl font-medium mb-2">Detailed Overview Not Available</p>
                <p className="text-sm text-slate-500">
                    The comprehensive markdown content (`detailed_markdown_content`) for this report could not be loaded or parsed correctly.
                    Please verify the `report-data.json` file for this run ({reportId}).
                </p>
            </Card>
          )}
        </section>

        <section className="mt-20">
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10 border-b border-slate-300/70 pb-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow">
                        <MapIcon className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Page-by-Page Analysis</h2>
                        <p className="text-slate-500 text-sm mt-1">Drill down into individual page evaluations.</p>
                    </div>
                </div>
                {pageAnalysesForDisplay.length > 0 && (
                <Badge variant="secondary" className="text-sm bg-indigo-100 text-indigo-700 border-indigo-200 px-3 py-1.5 rounded-lg shrink-0 mt-2 sm:mt-0">
                    {totalPagesAnalyzed} Pages Analyzed
                </Badge>
                )}
            </header>
            {pageAnalysesForDisplay.length > 0 ? (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                {pageAnalysesForDisplay.map((page) => (
                    <Link key={page.id} to={`/report/${reportId}/page/${page.id}`} className="group block h-full outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-50 rounded-2xl">
                    <Card className="h-full flex flex-col transition-all duration-300 ease-in-out rounded-2xl border border-slate-200/80 group-hover:shadow-xl group-hover:border-blue-500/80 p-0 bg-white group-hover:scale-[1.025]">
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
            ) : (
                 <Card className="text-center p-10 border-slate-200/80 bg-white shadow-lg">
                    <div className="w-20 h-20 bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                         <MessageSquareHeart className="w-10 h-10 text-slate-400"/>
                    </div>
                    <p className="text-slate-600 text-xl font-medium mb-2">No Individual Page Analyses</p>
                    <p className="text-sm text-slate-500">This report does not contain any individual page analysis data.</p>
                </Card>
            )}
        </section>

      </div>
    </div>
  );
};

export default Index;