
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, ExternalLink, AlertCircle, CheckCircle2 } from "lucide-react";

interface PageAnalysis {
  page_type: string;
  title: string;
  overall_score: number;
  section_scores: {
    [key: string]: number;
  };
  key_issues: string[];
  recommendations: string[];
  url: string;
}

interface PageAnalysisCardProps {
  page: PageAnalysis;
}

const getScoreColor = (score: number) => {
  if (score >= 7) return "text-emerald-600";
  if (score >= 4) return "text-amber-600";
  return "text-red-600";
};

const getScoreBadgeVariant = (score: number) => {
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
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
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
              <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
                {page.page_type}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <ExternalLink className="h-3 w-3" />
              <a 
                href={page.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-gray-700 transition-colors duration-200"
              >
                {page.url}
              </a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right space-y-1">
              <div className="text-xs font-medium text-gray-500">Page Score</div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-gray-900">
                  {page.overall_score}
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-400">/10</div>
                  <Badge 
                    variant={getScoreBadgeVariant(page.overall_score)} 
                    className="text-xs"
                  >
                    {page.overall_score >= 7 ? 'Good' : 
                     page.overall_score >= 4 ? 'Fair' : 'Poor'}
                  </Badge>
                </div>
              </div>
            </div>
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2 h-auto">
                  {isOpen ? 
                    <ChevronDown className="h-4 w-4 text-gray-600" /> : 
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  }
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
        </div>
      </CardHeader>

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-6 border-t border-gray-100">
            {/* Section Scores */}
            <div className="space-y-4 pt-6">
              <h4 className="text-base font-semibold text-gray-800">Performance Breakdown</h4>
              <div className="grid gap-3">
                {Object.entries(page.section_scores).map(([section, score]) => (
                  <div key={section} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 font-medium">
                        {formatSectionName(section)}
                      </span>
                      <span className={`text-sm font-semibold ${getScoreColor(score)}`}>
                        {score}/10
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(score)}`}
                        style={{ width: `${(score / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Issues */}
            <div className="space-y-3">
              <h4 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <div className="h-6 w-6 bg-red-100 rounded-md flex items-center justify-center">
                  <AlertCircle className="h-3 w-3 text-red-600" />
                </div>
                Key Issues
              </h4>
              <div className="space-y-2">
                {page.key_issues.map((issue, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-red-50 rounded-md border border-red-100">
                    <div className="h-1 w-1 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-700 text-sm leading-relaxed">{issue}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-3">
              <h4 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <div className="h-6 w-6 bg-emerald-100 rounded-md flex items-center justify-center">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                </div>
                Recommendations
              </h4>
              <div className="space-y-2">
                {page.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-emerald-50 rounded-md border border-emerald-100">
                    <div className="h-4 w-4 bg-emerald-500 text-white rounded text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <span className="text-gray-700 text-sm leading-relaxed">{recommendation}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
