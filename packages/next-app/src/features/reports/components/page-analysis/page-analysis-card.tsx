"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, ExternalLink, AlertCircle, CheckCircle2 } from "lucide-react";

// Interfaces
interface PageIssueSummary {
  issue: string;
  how_to_fix?: string;
}

interface PageRecommendationSummary {
  recommendation: string;
  benefit?: string;
}

interface PageAnalysis {
  page_type: string;
  title: string;
  overall_score: number;
  section_scores: { [key: string]: number };
  key_issues: PageIssueSummary[];
  recommendations: PageRecommendationSummary[];
  url: string;
  overall_explanation?: string;
}

interface PageAnalysisCardProps {
  page: PageAnalysis;
}

// Helper functions
const getScoreColor = (score: number) => {
  if (score >= 7) return "text-emerald-600";
  if (score >= 4) return "text-amber-600";
  return "text-red-600";
};

const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" => {
  if (score >= 7) return "default";
  if (score >= 4) return "secondary";
  return "destructive";
};

const getProgressColor = (score: number) => {
  if (score >= 7) return "bg-emerald-500";
  if (score >= 4) return "bg-amber-500";
  return "bg-red-500";
};

const formatSectionName = (key: string) => {
  return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export function PageAnalysisCard({ page }: PageAnalysisCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="border-gray-200 bg-white transition-shadow duration-200 hover:shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg font-semibold text-gray-900">{page.title}</CardTitle>
              <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">{page.page_type}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <ExternalLink className="h-3 w-3" />
              <a href={page.url} target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 transition-colors duration-200 truncate max-w-[200px] sm:max-w-xs" title={page.url}>
                {page.url}
              </a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right space-y-1">
              <div className="text-xs font-medium text-gray-500">Page Score</div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-gray-900">{page.overall_score}</div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-400">/10</div>
                  <Badge variant={getScoreBadgeVariant(page.overall_score)} className="text-xs">
                    {page.overall_score >= 7 ? 'Good' : page.overall_score >= 4 ? 'Fair' : 'Poor'}
                  </Badge>
                </div>
              </div>
            </div>
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2 h-auto">
                  {isOpen ? <ChevronDown className="h-4 w-4 text-gray-600" /> : <ChevronRight className="h-4 w-4 text-gray-600" />}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
        </div>
      </CardHeader>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-6 border-t border-gray-100">
            {/* Add the rest of the detailed content here */}
            {page.overall_explanation && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Score Explanation</h4>
                <p className="text-sm text-gray-600">{page.overall_explanation}</p>
              </div>
            )}
            
            {/* Section Scores */}
            {Object.keys(page.section_scores).length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Section Scores</h4>
                <div className="space-y-2">
                  {Object.entries(page.section_scores).map(([key, score]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{formatSectionName(key)}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getProgressColor(score)}`}
                            style={{ width: `${(score / 10) * 100}%` }}
                          />
                        </div>
                        <span className={`text-sm font-medium ${getScoreColor(score)}`}>
                          {score}/10
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Issues and Recommendations */}
            <div className="grid md:grid-cols-2 gap-4">
              {page.key_issues.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    Key Issues
                  </h4>
                  <ul className="space-y-1">
                    {page.key_issues.slice(0, 3).map((issue, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                        <div className="w-1 h-1 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                        {issue.issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {page.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Recommendations
                  </h4>
                  <ul className="space-y-1">
                    {page.recommendations.slice(0, 3).map((rec, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                        <div className="w-1 h-1 bg-emerald-500 rounded-full mt-2 flex-shrink-0" />
                        {rec.recommendation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}