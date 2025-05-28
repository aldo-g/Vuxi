import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

// Mock page analysis data
const pageAnalysisData = {
  "homepage": {
    page_type: "Homepage",
    title: "Edinburgh Peace Institute Homepage Analysis",
    overall_score: 4,
    url: "https://edinburghpeaceinstitute.org/index",
    section_scores: {
      first_impression_clarity: 5,
      goal_alignment: 3,
      visual_design: 6,
      content_quality: 5,
      usability_accessibility: 4,
      conversion_optimization: 2,
      technical_execution: 6
    },
    key_issues: [
      "Missing conversion elements (donation buttons, sign-up forms)",
      "Content hierarchy prioritizes team profiles over organization's mission and impact",
      "No clear visual cues or pathways directing users toward donation or training options"
    ],
    recommendations: [
      "Add prominent donation and training CTAs in the top section of the page",
      "Restructure page hierarchy to prioritize impact, mission, and offerings above team information",
      "Create a concise, scannable value proposition that clearly communicates the organization's impact"
    ],
    summary: "The homepage exhibits strong visual design but fails to achieve primary conversion goals. While professionally designed with quality content, it lacks strategic placement of donation opportunities and training enrollment pathways.",
    detailed_analysis: `
PAGE ROLE ANALYSIS:
The homepage serves as the primary entry point for the Edinburgh Peace Institute website, responsible for making strong first impressions and guiding visitors toward key actions like donations and training enrollment.

## 1. FIRST IMPRESSION & CLARITY

The page makes a professional first impression with clean design and clear branding. However, the value proposition could be more prominent and actionable.

- EVIDENCE: Clean, modern design with consistent branding
- EVIDENCE: Professional photography and typography
- Clear organizational identity but mission impact could be more prominent

## 2. GOAL ALIGNMENT

Moderate alignment with organizational goals. The page showcases expertise but doesn't effectively drive conversions.

- EVIDENCE: Team credentials prominently displayed
- EVIDENCE: Research projects highlighted
- Missing strategic donation pathways and training enrollment CTAs

## 3. VISUAL DESIGN

Strong visual hierarchy and professional aesthetic. Good use of whitespace and typography.

- EVIDENCE: Consistent color scheme and branding
- EVIDENCE: Professional photography
- Well-structured layout with clear sections

## 4. CONTENT QUALITY

High-quality content that establishes credibility and expertise in peace and conflict resolution.

- EVIDENCE: Detailed team profiles with academic credentials
- EVIDENCE: Comprehensive project descriptions
- Content effectively demonstrates organizational expertise

## 5. USABILITY & ACCESSIBILITY

Generally accessible with clear navigation, though some improvement opportunities exist.

- EVIDENCE: Clean navigation structure
- EVIDENCE: Responsive design implementation
- Could benefit from enhanced mobile optimization

## 6. CONVERSION OPTIMIZATION

Significant weaknesses in conversion optimization with limited pathways to desired actions.

- EVIDENCE: Single donation button in navigation
- EVIDENCE: No prominent training enrollment CTAs
- Missing contextual calls-to-action throughout content

## 7. TECHNICAL EXECUTION

Strong technical implementation with good performance metrics.

- EVIDENCE: Fast loading times
- EVIDENCE: Mobile-responsive design
- Solid technical foundation for user experience
    `,
    raw_analysis: "RAW ANALYSIS DATA: Homepage analysis shows strong visual design (6/10) but poor conversion optimization (2/10). Technical execution is solid (6/10) with good accessibility (4/10). Main issues include lack of donation pathways and hidden training enrollment options.",
    screenshot_path: "homepage-screenshot.png"
  }
};

const PageAnalysis = () => {
  const { pageId } = useParams();
  const [activeTab, setActiveTab] = useState("tab-detailed");
  const pageData = pageAnalysisData[pageId as keyof typeof pageAnalysisData];

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
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-slate-900">Page Summary</h2>
              </div>
              <p className="text-slate-700 leading-relaxed mb-10 text-lg">
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
                  <span className="text-slate-900 font-bold">May 28, 2025</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-200/60 p-10 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-500 h-full">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <p className="text-slate-600 text-sm font-medium">
                    {pageData.overall_score >= 8 ? 'Outstanding performance' : 
                     pageData.overall_score >= 6 ? 'Solid foundation' : 
                     'Significant improvement needed'}
                  </p>
                </div>
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
                { id: 'tab-issues', label: 'Issues', count: pageData.key_issues.length },
                { id: 'tab-recommendations', label: 'Recommendations', count: pageData.recommendations.length },
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
                    <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-bold rounded-xl min-w-[24px] h-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm">
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
                  <p className="text-slate-700 leading-relaxed text-lg">
                    The homepage serves as the primary entry point for the Edinburgh Peace Institute website, responsible for making strong first impressions and guiding visitors toward key actions like donations and training enrollment.
                  </p>
                </div>

                {/* Section Scores */}
                <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">Performance Breakdown</h3>
                  </div>

                  <div className="grid gap-6">
                    {Object.entries(pageData.section_scores).map(([key, score]) => {
                      const formatName = (name: string) => name.split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ');
                      
                      const getScoreColor = (score: number) => {
                        if (score >= 7) return 'from-emerald-500 to-emerald-600';
                        if (score >= 5) return 'from-amber-500 to-amber-600';
                        return 'from-red-500 to-red-600';
                      };

                      const getScoreBg = (score: number) => {
                        if (score >= 7) return 'bg-emerald-50 border-emerald-200 text-emerald-800';
                        if (score >= 5) return 'bg-amber-50 border-amber-200 text-amber-800';
                        return 'bg-red-50 border-red-200 text-red-800';
                      };

                      return (
                        <div key={key} className="flex items-center gap-6">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-semibold text-slate-700 mb-3">{formatName(key)}</h4>
                            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                              <div 
                                className={`h-full bg-gradient-to-r ${getScoreColor(score)} rounded-full transition-all duration-1000 ease-out`}
                                style={{ width: `${(score / 10) * 100}%` }}
                              />
                            </div>
                          </div>
                          <div className={`px-4 py-2 rounded-xl text-sm font-bold border ${getScoreBg(score)}`}>
                            {score}/10
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Analysis Sections */}
                <div className="space-y-8">
                  {[
                    { title: "First Impression & Clarity", content: "The page makes a professional first impression with clean design and clear branding. However, the value proposition could be more prominent and actionable.", evidence: ["Clean, modern design with consistent branding", "Professional photography and typography", "Clear organizational identity but mission impact could be more prominent"] },
                    { title: "Goal Alignment", content: "Moderate alignment with organizational goals. The page showcases expertise but doesn't effectively drive conversions.", evidence: ["Team credentials prominently displayed", "Research projects highlighted", "Missing strategic donation pathways and training enrollment CTAs"] },
                    { title: "Visual Design", content: "Strong visual hierarchy and professional aesthetic. Good use of whitespace and typography.", evidence: ["Consistent color scheme and branding", "Professional photography", "Well-structured layout with clear sections"] },
                    { title: "Content Quality", content: "High-quality content that establishes credibility and expertise in peace and conflict resolution.", evidence: ["Detailed team profiles with academic credentials", "Comprehensive project descriptions", "Content effectively demonstrates organizational expertise"] },
                    { title: "Usability & Accessibility", content: "Generally accessible with clear navigation, though some improvement opportunities exist.", evidence: ["Clean navigation structure", "Responsive design implementation", "Could benefit from enhanced mobile optimization"] },
                    { title: "Conversion Optimization", content: "Significant weaknesses in conversion optimization with limited pathways to desired actions.", evidence: ["Single donation button in navigation", "No prominent training enrollment CTAs", "Missing contextual calls-to-action throughout content"] },
                    { title: "Technical Execution", content: "Strong technical implementation with good performance metrics.", evidence: ["Fast loading times", "Mobile-responsive design", "Solid technical foundation for user experience"] }
                  ].map((section, index) => (
                    <div key={index} className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
                      <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                        <span className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 text-white rounded-lg flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        {section.title}
                      </h3>
                      <p className="text-slate-700 leading-relaxed mb-6 text-lg">
                        {section.content}
                      </p>
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Evidence:</h4>
                        <div className="grid gap-3">
                          {section.evidence.map((item, evidenceIndex) => (
                            <div key={evidenceIndex} className="flex gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2.5 flex-shrink-0" />
                              <span className="text-slate-700 leading-relaxed">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
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
                    <div key={index} className="flex gap-6 p-8 bg-gradient-to-r from-blue-50/80 to-blue-50/40 border border-blue-200/60 rounded-2xl hover:shadow-lg hover:shadow-blue-100/50 transition-all duration-300">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl flex items-center justify-center text-sm font-bold shadow-lg">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-slate-900 font-semibold leading-relaxed text-lg mb-4">{recommendation}</p>
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300">
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
                  {pageData.raw_analysis}
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
                <p className="text-slate-600 text-lg">The page screenshot is not available: {pageData.screenshot_path}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageAnalysis;