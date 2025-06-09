"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface ExecutiveSummaryProps {
  summary: {
    executive_summary: string;
    overall_score: number;
    total_pages_analyzed: number;
  };
}

export function ExecutiveSummary({ summary }: ExecutiveSummaryProps) {
  return (
    <Card className="border-gray-200 bg-white shadow-sm">
      <CardHeader className="pb-4 bg-gray-50 border-b border-gray-200">
        <CardTitle className="flex items-center gap-3 text-gray-900">
          <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <FileText className="h-4 w-4 text-blue-600" />
          </div>
          <span className="text-xl font-semibold">Executive Summary</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-700 leading-relaxed text-base m-0">
            {summary.executive_summary}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}