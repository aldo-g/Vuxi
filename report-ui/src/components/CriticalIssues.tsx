import { AlertTriangle } from "lucide-react";

interface CriticalIssuesProps {
  issues: string[];
}

export function CriticalIssues({ issues }: CriticalIssuesProps) {
  return (
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
  );
}