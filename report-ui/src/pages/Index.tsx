import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ExecutiveSummary } from "@/components/ExecutiveSummary";
import { CriticalIssues } from "@/components/CriticalIssues";
import { TopRecommendations } from "@/components/TopRecommendations";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"; // Import Card components
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ChevronRight } from "lucide-react";

interface PageAnalysisDetail {
  id: string;
  page_type: string;
  title: string;
  overall_score: number;
  url: string;
  section_scores: { [key: string]: number };
  key_issues: string[];
  recommendations: string[];
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

interface ReportData {
  organization: string;
  analysis_date: string;
  timestamp?: string;
  total_pages_analyzed: number;
  overall_score: number;
  executive_summary: string;
  most_critical_issues: string[];
  top_recommendations: string[];
  key_strengths: string[];
  performance_summary: string;
  page_analyses: PageAnalysisDetail[];
  metadata?: any;
}

const fetchReportData = async (): Promise<ReportData> => {
  const response = await fetch("/report-data.json");
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};

// Helper function for score badge styling, matching the target image
const getScoreBoxClasses = (score: number): string => {
  if (score >= 7) return "bg-green-100 text-green-700"; // Light green background, darker text
  if (score >= 4) return "bg-yellow-100 text-yellow-700"; // Light yellow background, darker text
  return "bg-red-100 text-red-700"; // Light red background, darker text
};


const Index = () => {
  const [activeTab, setActiveTab] = useState("tab-issues");

  const { data: reportData, isLoading, error } = useQuery<ReportData, Error>({
    queryKey: ["reportData"],
    queryFn: fetchReportData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Effect for overall score ring animation (remains the same)
  useEffect(() => {
    if (reportData) {
      const timer = setTimeout(() => {
        const scoreRing = document.querySelector('.score-ring-progress') as SVGCircleElement;
        if (scoreRing) {
          const score = reportData.overall_score;
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

  // Loading state UI
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-slate-700">Loading Analysis Report...</p>
        </div>
      </div>
    );
  }

  // Error state UI
  if (error || !reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100/30">
        <div className="text-center p-8 bg-white shadow-xl rounded-2xl max-w-lg">
            <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Error Loading Report</h1>
          <p className="text-slate-600 mb-6 text-lg">
            Could not load the analysis data. Please ensure "report-data.json" is available.
          </p>
          {error && <pre className="text-xs text-red-700 bg-red-50 p-4 rounded-md text-left">{error.message}</pre>}
        </div>
      </div>
    );
  }

  // Destructure reportData once it's loaded
  const {
    organization = "Analysis Report",
    analysis_date = new Date().toLocaleDateString(),
    total_pages_analyzed = 0,
    overall_score = 0,
    executive_summary = "No summary available.",
    most_critical_issues = [],
    top_recommendations = [],
    key_strengths = [],
    performance_summary = "No performance summary.",
    page_analyses = [],
  } = reportData; // No non-null assertion needed due to prior checks

  // Helper for overall score status text
   const getOverallScoreStatusText = (score: number) => {
    if (score >= 8) return "Excellent";
    if (score >= 6) return "Good";
    return "Needs Work";
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            Analysis Complete
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Website Analysis Report
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Comprehensive UX/UI evaluation and strategic recommendations for{" "}
            <span className="font-semibold text-gray-900">{organization}</span>
          </p>
        </div>

        {/* Executive Summary & Score */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          <div className="lg:col-span-2">
            <ExecutiveSummary summary={{
                executive_summary,
                overall_score,
                total_pages_analyzed 
            }} />
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200/60 p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-300 h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">Overall Score</h2>
              </div>
              
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
                  <Badge variant="outline" className={`text-xs sm:text-sm font-semibold mb-2 ${getScoreBoxClasses(overall_score)}`}>
                    {getOverallScoreStatusText(overall_score)}
                  </Badge>
                  <p className="text-gray-600 text-sm">
                    {overall_score >= 8 ? 'Outstanding performance' : 
                     overall_score >= 6 ? 'Solid foundation with opportunities' : 
                     'Significant room for improvement'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Tabs */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden mb-16">
          <div className="border-b border-gray-200 bg-gray-50/50">
            <div className="flex overflow-x-auto">
              {[
                { id: 'tab-issues', label: 'Critical Issues', count: most_critical_issues.length, color: 'red' },
                { id: 'tab-recommendations', label: 'Recommendations', count: top_recommendations.length, color: 'blue' },
                { id: 'tab-strengths', label: 'Key Strengths', count: key_strengths.length, color: 'green' },
                { id: 'tab-performance', label: 'Performance', count: null, color: 'purple' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-white'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-white/60'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== null && tab.count > 0 && (
                    <span className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full min-w-[20px] h-5 ${
                      tab.color === 'red' ? 'bg-red-100 text-red-700' :
                      tab.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {activeTab === 'tab-issues' && <CriticalIssues issues={most_critical_issues} />}
            {activeTab === 'tab-recommendations' && <TopRecommendations recommendations={top_recommendations} />}
            {activeTab === 'tab-strengths' && (
              <div className="space-y-4">
                {key_strengths.map((strength, index) => (
                  <div key={index} className="flex gap-4 p-4 sm:p-6 bg-green-50/50 border border-green-200/60 rounded-xl hover:shadow-sm transition-all duration-200">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </div>
                    <div className="flex-1"><p className="text-gray-900 font-medium leading-relaxed">{strength}</p></div>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'tab-performance' && (
              <div className="space-y-6">
                <div className="p-6 bg-purple-50/50 border border-purple-200/60 rounded-xl">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                       <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Technical Performance</h3>
                      <p className="text-gray-700 leading-relaxed">{performance_summary}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Individual Page Analysis Section Title */}
        <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Individual Page Analysis</h2>
            {page_analyses.length > 0 && (
              <Badge variant="secondary" className="text-sm">
                {page_analyses.length} Pages
              </Badge>
            )}
        </div>
          
        {/* Page Analysis Cards - Using ShadCN Card component */}
        {page_analyses.length > 0 ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {page_analyses.map((page) => (
              <Link
                key={page.id}
                to={`/page/${page.id}`}
                className="group block h-full" 
              >
                <Card className="h-full flex flex-col transition-all duration-200 rounded-2xl border border-gray-200/60 hover:shadow-lg group-hover:border-blue-300/60 p-0">
                  {/* Removed default Card padding by setting p-0 on Card, will control padding with CardHeader/Content/Footer */}
                  <CardHeader className="p-6 pb-3"> {/* Custom padding */}
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                        {page.title}
                      </CardTitle>
                      <div 
                        className={`flex items-center justify-center text-lg font-bold p-2 px-3 rounded-lg min-w-[36px] h-[36px] ${getScoreBoxClasses(page.overall_score)}`}
                      >
                        {page.overall_score}
                      </div>
                    </div>
                    <CardDescription className="flex items-center gap-1.5 text-xs text-slate-500 pt-2 truncate">
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate" title={page.url}>{page.url}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 pt-2 flex-grow"> {/* Custom padding, flex-grow */}
                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                      {page.summary}
                    </p>
                  </CardContent>
                  <CardFooter className="p-6 pt-2 mt-auto"> {/* Custom padding, mt-auto */}
                    <div className="text-sm font-medium text-blue-600 group-hover:text-blue-700 flex items-center gap-1.5 transition-colors">
                      View Analysis
                      <ChevronRight className="h-4 w-4 transform transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-center py-8">No individual page analyses available.</p>
        )}
      </div>
    </div>
  );
};

export default Index;