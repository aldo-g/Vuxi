"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, ExternalLink, AlertCircle, CheckCircle2 } from "lucide-react";

// Interfaces from your original file
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

// Helper functions from your original file
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
            {/* The rest of the JSX from your original file goes here */}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}