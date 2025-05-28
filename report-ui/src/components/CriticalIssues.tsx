
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface CriticalIssuesProps {
  issues: string[];
}

export function CriticalIssues({ issues }: CriticalIssuesProps) {
  return (
    <Card className="border-gray-200 bg-white shadow-sm">
      <CardHeader className="pb-4 bg-gray-50 border-b border-gray-200">
        <CardTitle className="flex items-center gap-3 text-gray-900">
          <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <span className="text-xl font-semibold">Critical Issues</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {issues.map((issue, index) => (
            <div key={index} className="flex items-start gap-3 bg-white border border-red-200 border-l-4 border-l-red-500 rounded-md p-4 hover:shadow-sm transition-shadow">
              <div className="h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                {index + 1}
              </div>
              <span className="text-gray-700 leading-relaxed font-medium">{issue}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
