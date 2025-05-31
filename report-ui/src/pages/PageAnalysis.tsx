import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

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
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Helper function to extract page role analysis from detailed analysis
const extractPageRoleAnalysis = (content: string) => {
  const lines = content.split('\n');
  let pageRoleContent: string[] = [];
  let inPageRoleSection = false;
  
  lines.forEach((line) => {
    const trimmedLine = line.trim();
    
    if (trimmedLine.toUpperCase().includes('PAGE ROLE ANALYSIS')) {
      inPageRoleSection = true;
    } else if (trimmedLine.startsWith('##') && inPageRoleSection) {
      // Found next section, stop collecting
      inPageRoleSection = false;
    } else if (inPageRoleSection && trimmedLine && !trimmedLine.includes('EVIDENCE:')) {
      pageRoleContent.push(trimmedLine);
    }
  });
  
  return pageRoleContent.join(' ').trim();
};

const parseDetailedAnalysis = (content: string, sectionScores: { [key: string]: number }) => {
  const lines = content.split('\n');
  const sections: Array<{
    title: string;
    content: string[];
    evidence: string[];
    score?: number;
  }> = [];
  
  // Mapping between section titles and score keys
  const titleToScoreKey: { [key: string]: string } = {
    'FIRST IMPRESSION & CLARITY': 'first_impression_clarity',
    'GOAL ALIGNMENT': 'goal_alignment', 
    'VISUAL DESIGN': 'visual_design',
    'CONTENT QUALITY': 'content_quality',
    'USABILITY & ACCESSIBILITY': 'usability_accessibility',
    'CONVERSION OPTIMIZATION': 'conversion_optimization',
    'TECHNICAL EXECUTION': 'technical_execution'
  };
  
  let currentSection: any = null;
  let currentContent: string[] = [];
  let currentEvidence: string[] = [];
  let collectingEvidence = false;
  
  lines.forEach((line) => {
    const trimmedLine = line.trim();
    
    // Check for section headers like "## 1. FIRST IMPRESSION & CLARITY (Score: 5/10)"
    const sectionMatch = trimmedLine.match(/^##\s*\d+\.\s*([^(]+)(?:\(Score:\s*\d+\/\d+\))?/);
    if (sectionMatch) {
      // Save previous section
      if (currentSection) {
        currentSection.content = currentContent;
        currentSection.evidence = currentEvidence;
        // Try to find matching score
        const scoreKey = titleToScoreKey[currentSection.title.toUpperCase()];
        if (scoreKey && sectionScores[scoreKey]) {
          currentSection.score = sectionScores[scoreKey];
        }
        sections.push(currentSection);
      }
      
      // Start new section
      currentSection = {
        title: sectionMatch[1].trim(),
        content: [],
        evidence: [],
        score: undefined
      };
      currentContent = [];
      currentEvidence = [];
      collectingEvidence = false;
    }
    // Check for evidence marker
    else if (trimmedLine.toUpperCase().includes('EVIDENCE:')) {
      collectingEvidence = true;
      // Extract evidence from the same line if it exists
      const evidenceMatch = trimmedLine.match(/EVIDENCE:\s*(.+)/i);
      if (evidenceMatch && evidenceMatch[1]) {
        currentEvidence.push(evidenceMatch[1]);
      }
    }
    // Handle bullet points
    else if (trimmedLine.startsWith('- ') && currentSection) {
      const bulletContent = trimmedLine.substring(2).trim();
      if (collectingEvidence) {
        currentEvidence.push(bulletContent);
      } else {
        currentContent.push(bulletContent);
      }
    }
    // Handle regular content lines (only if not collecting evidence and not empty)
    else if (trimmedLine && currentSection && !collectingEvidence) {
      currentContent.push(trimmedLine);
    }
  });
  
  // Save last section
  if (currentSection) {
    currentSection.content = currentContent;
    currentSection.evidence = currentEvidence;
    // Try to find matching score
    const scoreKey = titleToScoreKey[currentSection.title.toUpperCase()];
    if (scoreKey && sectionScores[scoreKey]) {
      currentSection.score = sectionScores[scoreKey];
    }
    sections.push(currentSection);
  }
  
  return sections;
};

const PageAnalysis = () => {
const renderMarkdownContent = (content: string) => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentParagraph: string[] = [];
  let listItems: string[] = [];
  
  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      elements.push(
        <p key={elements.length} className="text-slate-700 leading-relaxed mb-4">
          {currentParagraph.join(' ').replace(/\*\*(.*?)\*\*/g, (_, text) => text)}
        </p>
      );
      currentParagraph = [];
    }
  };
  
  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={elements.length} className="list-disc list-inside space-y-2 mb-6 text-slate-700">
          {listItems.map((item, idx) => (
            <li key={idx} className="leading-relaxed">{item}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('# ')) {
      flushParagraph();
      flushList();
      elements.push(
        <h1 key={elements.length} className="text-3xl font-bold text-slate-900 mb-6 mt-8 first:mt-0">
          {trimmedLine.substring(2)}
        </h1>
      );
    } else if (trimmedLine.startsWith('## ')) {
      flushParagraph();
      flushList();
      elements.push(
        <h2 key={elements.length} className="text-xl font-semibold text-slate-900 mb-4 mt-8">
          {trimmedLine.substring(3)}
        </h2>
      );
    } else if (trimmedLine.startsWith('### ')) {
      flushParagraph();
      flushList();
      elements.push(
        <h3 key={elements.length} className="text-lg font-medium text-slate-900 mb-3 mt-6">
          {trimmedLine.substring(4)}
        </h3>
      );
    } else if (trimmedLine.startsWith('- ')) {
      flushParagraph();
      listItems.push(trimmedLine.substring(2));
    } else if (trimmedLine === '') {
      flushParagraph();
      flushList();
    } else {
      currentParagraph.push(trimmedLine);
    }
  });
  
  flushParagraph();
  flushList();
  
  return elements;
};
  const { pageId } = useParams();
  const [activeTab, setActiveTab] = useState("tab-detailed");
  const [activeNestedTab, setActiveNestedTab] = useState("role-analysis");

  const { data: reportData, isLoading, error } = useQuery<ReportData, Error>({
    queryKey: ["reportData"],
    queryFn: fetchReportData,
    staleTime: Infinity, // Never mark as stale
    refetchOnWindowFocus: false,
  });

  // Find the specific page data from the report
  const pageData = reportData?.page_analyses?.find(page => page.id === pageId);

  // Initialize nested tab state
  useEffect(() => {
    if (pageData) {
      const analysisData = pageData.sections || 
        (pageData.detailed_analysis ? 
          parseDetailedAnalysis(pageData.detailed_analysis, pageData.section_scores) : 
          []);
      
      if (analysisData.length > 0) {
        setActiveNestedTab('section-0');
      }
    }
  }, [pageData]);

  useEffect(() => {
    // Animate score ring
    const timer = setTimeout(() => {
      const scoreRing = document.querySelector('.score-ring-progress') as SVGCircleElement;
      if (scoreRing && pageData) {
        const score = pageData.overall_score;
        const circumference = 2 * Math.PI * 45;
        const progress = (score / 10) * circumference;
        const offset = circumference - progress;
        
        scoreRing.style.strokeDashoffset = offset.toString();
        
        if (score >= 8) {
          scoreRing.style.stroke = '#10b981';
        } else if (score >= 6) {
          scoreRing.style.stroke = '#f59e0b';
        } else {
          scoreRing.style.stroke = '#ef4444';
        }
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [pageData]);

  // Helper function to get badge colors based on tab type
  const getBadgeColors = (tabId: string) => {
    switch (tabId) {
      case 'tab-issues':
        return 'bg-red-100 text-red-700';
      case 'tab-recommendations':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-slate-700">Loading Page Analysis...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-50 to-red-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Error Loading Data</h1>
          <p className="text-slate-600 mb-8 text-lg">Could not load the analysis data.</p>
          <Link 
            to="/" 
            className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-2xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Overview
          </Link>
        </div>
      </div>
    );
  }

  // Page not found
  if (!pageData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-50 to-red-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Page Not Found</h1>
          <p className="text-slate-600 mb-8 text-lg">The requested page analysis could not be found.</p>
          <Link 
            to="/" 
            className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-2xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Overview
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Breadcrumb */}
        <div className="mb-10">
          <Link 
            to="/" 
            className="inline-flex items-center gap-3 text-slate-600 hover:text-blue-600 transition-all duration-300 font-medium group"
          >
            <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Overview
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-6 py-3 rounded-2xl text-sm font-semibold mb-8 border border-blue-100 shadow-sm">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></div>
            Page Analysis
          </div>
          <h1 className="text-5xl font-bold text-slate-900 mb-6 tracking-tight leading-tight">{pageData.title}</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">Detailed analysis and strategic recommendations</p>
        </div>

        {/* Summary & Score */}
        <div className="grid lg:grid-cols-5 gap-10 mb-16">
          <div className="lg:col-span-3">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-200/60 p-10 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-500">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="lucide lucide-file-text h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-slate-900">Page Summary</h2>
              </div>
              <p className="text-slate-700 leading-relaxed mb-6 text-lg">
                {pageData.summary}
              </p>
              
              <div className="grid gap-6 pt-8 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Page Type:</span>
                  <span className="text-slate-900 font-bold text-lg">{pageData.page_type}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">URL:</span>
                  <span className="text-slate-600 font-mono text-sm truncate max-w-xs bg-slate-50 px-3 py-1 rounded-lg">{pageData.url}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Analysis Date:</span>
                  <span className="text-slate-900 font-bold">{reportData?.analysis_date || 'May 28, 2025'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-200/60 p-10 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-500 h-full">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-slate-900">Score</h2>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="relative mb-8">
                  <svg className="score-ring transform -rotate-90" width="140" height="140">
                    <circle
                      cx="70"
                      cy="70"
                      r="45"
                      fill="none"
                      stroke="#f1f5f9"
                      strokeWidth="10"
                    />
                    <circle
                      className="score-ring-progress"
                      cx="70"
                      cy="70"
                      r="45"
                      fill="none"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 45}`}
                      strokeDashoffset={`${2 * Math.PI * 45}`}
                      style={{ transition: 'stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1) 1s' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-slate-900">{pageData.overall_score}</div>
                      <div className="text-sm text-slate-500 font-semibold">/ 10</div>
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className={`inline-flex items-center px-4 py-2 rounded-2xl text-sm font-bold mb-3 ${
                    pageData.overall_score >= 8 ? 'bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-800 border border-emerald-200' : 
                    pageData.overall_score >= 6 ? 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-800 border border-amber-200' : 
                    'bg-gradient-to-r from-red-50 to-red-100 text-red-800 border border-red-200'
                  }`}>
                    {pageData.overall_score >= 8 ? 'Excellent' : pageData.overall_score >= 6 ? 'Good' : 'Needs Improvement'}
                  </div>
                  <p className="text-slate-600 text-sm font-medium mb-6">
                    {pageData.overall_score >= 8 ? 'Outstanding performance' : 
                     pageData.overall_score >= 6 ? 'Solid foundation' : 
                     'Significant improvement needed'}
                  </p>
                  
                  {/* Score Progress Ring */}
                  <div className="flex justify-center mb-6">
                    <div className="w-4/5 bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${
                          pageData.overall_score >= 8 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' :
                          pageData.overall_score >= 6 ? 'bg-gradient-to-r from-amber-500 to-amber-600' :
                          'bg-gradient-to-r from-red-500 to-red-600'
                        }`}
                        style={{ width: `${(pageData.overall_score / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Score Explanation - moved below score bar */}
                {pageData.overall_explanation && (
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <div className="h-5 w-5 bg-blue-100 rounded-md flex items-center justify-center">
                        <svg className="h-3 w-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      Score Breakdown
                    </h3>
                    {(() => {
                      const helpedMatch = pageData.overall_explanation.match(/What helped:\s*([^.]*\.?)\s*What hurt:\s*(.*)$/i);
                      if (helpedMatch) {
                        const [, helped, hurt] = helpedMatch;
                        return (
                          <div className="space-y-4">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center mt-1">
                                <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-emerald-800">What helped:</span>
                                <p className="text-slate-700 leading-relaxed text-sm mt-1">{helped.trim()}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-5 h-5 bg-red-100 rounded-full flex items-center justify-center mt-1">
                                <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-red-800">What hurt:</span>
                                <p className="text-slate-700 leading-relaxed text-sm mt-1">{hurt.trim()}</p>
                              </div>
                            </div>
                          </div>
                        );
                      } else {
                        return <p className="text-slate-700 leading-relaxed text-sm">{pageData.overall_explanation}</p>;
                      }
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/50 overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50/80 to-white/80 backdrop-blur-sm">
            <div className="flex overflow-x-auto scrollbar-hide">
              {[
                { id: 'tab-detailed', label: 'Detailed Analysis', count: null },
                { id: 'tab-issues', label: 'Key Issues', count: pageData.key_issues.length },
                { id: 'tab-recommendations', label: 'Key Recommendations', count: pageData.recommendations.length },
                { id: 'tab-raw', label: 'Raw Analysis', count: null },
                { id: 'tab-screenshot', label: 'Screenshot', count: null }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-8 py-6 text-sm font-semibold whitespace-nowrap transition-all duration-300 border-b-3 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-white/90 shadow-sm'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count && tab.count > 0 && (
                    <span className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full min-w-[20px] h-5 ${getBadgeColors(tab.id)}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-10">
            {/* Detailed Analysis Tab */}
            {activeTab === 'tab-detailed' && (
              <div className="space-y-8">
                {/* Page Role Analysis Section */}
                <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-2xl border border-blue-100/60 p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">Page Role Analysis</h3>
                  </div>
                  <div className="prose prose-lg max-w-none">
                    <p className="text-slate-700 leading-relaxed text-lg m-0">
                      {pageData.detailed_analysis ? 
                        extractPageRoleAnalysis(pageData.detailed_analysis) || 
                        `This page serves as a ${pageData.page_type.toLowerCase()} for the ${reportData?.organization} website, responsible for ${pageData.page_type === 'Homepage' ? 'making strong first impressions and guiding visitors toward key actions like donations and training enrollment' : 'supporting the organization\'s overall user experience and conversion goals'}.` :
                        `This page serves as a ${pageData.page_type.toLowerCase()} for the ${reportData?.organization} website.`
                      }
                    </p>
                  </div>
                </div>

                {/* Category Analysis Sections with Nested Tabs */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  {/* Nested Tab Navigation */}
                  <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50/80 to-white/80 backdrop-blur-sm">
                    <div className="flex overflow-x-auto scrollbar-hide">
                      {(() => {
                        const analysisData = pageData.sections || 
                          (pageData.detailed_analysis ? 
                            parseDetailedAnalysis(pageData.detailed_analysis, pageData.section_scores) : 
                            []);
                        
                        return analysisData.map((section: any, index: number) => (
                          <button
                            key={index}
                            onClick={() => setActiveNestedTab(`section-${index}`)}
                            className={`flex items-center gap-3 px-6 py-4 text-sm font-medium whitespace-nowrap transition-all duration-300 border-b-2 ${
                              activeNestedTab === `section-${index}`
                                ? 'border-blue-500 text-blue-600 bg-white/90 shadow-sm'
                                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60'
                            }`}
                          >
                            <span className={`w-6 h-6 ${
                              section.score && section.score >= 7 ? 'bg-emerald-500' :
                              section.score && section.score >= 5 ? 'bg-amber-500' :
                              section.score ? 'bg-red-500' :
                              'bg-slate-500'
                            } text-white rounded-md flex items-center justify-center text-xs font-bold`}>
                              {index + 1}
                            </span>
                            <span>{section.title}</span>
                            {section.score && (
                              <span className="text-xs text-slate-500">({section.score}/10)</span>
                            )}
                          </button>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Nested Tab Content */}
                  <div className="p-8">
                    {(() => {
                      const analysisData = pageData.sections || 
                        (pageData.detailed_analysis ? 
                          parseDetailedAnalysis(pageData.detailed_analysis, pageData.section_scores) : 
                          []);

                      if (analysisData.length === 0) {
                        return (
                          <div className="text-center py-12">
                            <p className="text-slate-600">No detailed analysis sections available for this page.</p>
                          </div>
                        );
                      }

                      return analysisData.map((section: any, index: number) => (
                        activeNestedTab === `section-${index}` && (
                          <div key={index} className="space-y-6">
                            {/* Section Title */}
                            <div className="flex items-center gap-3 mb-6">
                              <span className={`w-8 h-8 bg-gradient-to-br ${
                                section.score && section.score >= 7 ? 'from-emerald-500 to-emerald-600' :
                                section.score && section.score >= 5 ? 'from-amber-500 to-amber-600' :
                                section.score ? 'from-red-500 to-red-600' :
                                'from-slate-600 to-slate-700'
                              } text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-lg`}>
                                {index + 1}
                              </span>
                              <h4 className="text-xl font-bold text-slate-900">{section.title}</h4>
                            </div>
                            
                            {/* Section Summary */}
                            {section.summary && (
                              <div className="mb-6">
                                <h5 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Summary:</h5>
                                <p className="text-slate-700 leading-relaxed">{section.summary}</p>
                              </div>
                            )}
                            
                            {/* Key Points */}
                            {section.points && section.points.length > 0 && (
                              <div className="mb-6">
                                <h5 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Key Points:</h5>
                                <ul className="space-y-3">
                                  {section.points.map((point: string, pointIndex: number) => (
                                    <li key={pointIndex} className="flex gap-3">
                                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2.5 flex-shrink-0" />
                                      <span className="text-slate-700 leading-relaxed">{point}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Content from parsing (fallback) */}
                            {section.content && section.content.length > 0 && (
                              <div className="mb-6">
                                <ul className="space-y-3">
                                  {section.content.map((item: string, contentIndex: number) => (
                                    <li key={contentIndex} className="flex gap-3">
                                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2.5 flex-shrink-0" />
                                      <span className="text-slate-700 leading-relaxed text-lg">{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {/* Evidence */}
                            {section.evidence && (
                              <div className="mb-6">
                                <h5 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Evidence:</h5>
                                {typeof section.evidence === 'string' ? (
                                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-slate-700 leading-relaxed">{section.evidence}</span>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    {section.evidence.map((item: string, evidenceIndex: number) => (
                                      <div key={evidenceIndex} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <span className="text-slate-700 leading-relaxed">{item}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Score Explanation */}
                            {section.score_explanation && (
                              <div className="mb-6">
                                <h5 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Score Explanation:</h5>
                                {(() => {
                                  const helpedMatch = section.score_explanation.match(/What helped:\s*([^.]*\.?)\s*What hurt:\s*(.*)$/i);
                                  if (helpedMatch) {
                                    const [, helped, hurt] = helpedMatch;
                                    return (
                                      <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                          <div className="flex-shrink-0 w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mt-0.5">
                                            <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                          </div>
                                          <div>
                                            <span className="text-sm font-medium text-emerald-800">What helped:</span>
                                            <p className="text-slate-700 leading-relaxed mt-1">{helped.trim()}</p>
                                          </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                          <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                                            <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                          </div>
                                          <div>
                                            <span className="text-sm font-medium text-red-800">What hurt:</span>
                                            <p className="text-slate-700 leading-relaxed mt-1">{hurt.trim()}</p>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  } else {
                                    return <p className="text-slate-700 leading-relaxed">{section.score_explanation}</p>;
                                  }
                                })()}
                              </div>
                            )}
                            
                            {/* Score Progress Bar */}
                            {section.score && (
                              <div className="pt-6 border-t border-slate-100">
                                <div className="flex items-center gap-4">
                                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden mr-4">
                                    <div 
                                      className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                        section.score >= 7 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' :
                                        section.score >= 5 ? 'bg-gradient-to-r from-amber-500 to-amber-600' :
                                        'bg-gradient-to-r from-red-500 to-red-600'
                                      }`}
                                      style={{ width: `${(section.score / 10) * 100}%` }}
                                    />
                                  </div>
                                  <div className={`px-3 py-1 rounded-lg text-sm font-bold border ${
                                    section.score >= 7 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                                    section.score >= 5 ? 'bg-amber-50 border-amber-200 text-amber-800' :
                                    'bg-red-50 border-red-200 text-red-800'
                                  }`}>
                                    {section.score}/10
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      ));
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* Issues Tab */}
            {activeTab === 'tab-issues' && (
              <div className="space-y-6">
                {pageData.key_issues.length > 0 ? (
                  pageData.key_issues.map((issue, index) => (
                    <div key={index} className="flex gap-6 p-8 bg-gradient-to-r from-red-50/80 to-red-50/40 border border-red-200/60 rounded-2xl hover:shadow-lg hover:shadow-red-100/50 transition-all duration-300">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl flex items-center justify-center text-sm font-bold shadow-lg">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-slate-900 font-semibold leading-relaxed text-lg mb-4">{issue}</p>
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300">
                            High Priority
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">No Critical Issues</h3>
                    <p className="text-slate-600 text-lg">This page is functioning well without major problems.</p>
                  </div>
                )}
              </div>
            )}

            {/* Recommendations Tab */}
            {activeTab === 'tab-recommendations' && (
              <div className="space-y-6">
                {pageData.recommendations.length > 0 ? (
                  pageData.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex gap-6 p-8 bg-gradient-to-r from-green-50/80 to-green-50/40 border border-green-200/60 rounded-2xl hover:shadow-lg hover:shadow-green-100/50 transition-all duration-300">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl flex items-center justify-center text-sm font-bold shadow-lg">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-slate-900 font-semibold leading-relaxed text-lg mb-4">{recommendation}</p>
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300">
                            High Impact
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">No Recommendations</h3>
                    <p className="text-slate-600 text-lg">No specific recommendations were provided for this page.</p>
                  </div>
                )}
              </div>
            )}

            {/* Raw Analysis Tab */}
            {activeTab === 'tab-raw' && (
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200 p-8 shadow-inner">
                <pre className="text-sm text-slate-700 font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
                  {pageData.raw_analysis || pageData.detailed_analysis || 'No raw analysis data available.'}
                </pre>
              </div>
            )}

            {/* Screenshot Tab */}
            {activeTab === 'tab-screenshot' && (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Screenshot Not Available</h3>
                <p className="text-slate-600 text-lg">The page screenshot is not available: {pageData.screenshot_path || 'No screenshot path provided'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageAnalysis;