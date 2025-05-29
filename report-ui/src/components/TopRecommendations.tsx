import { Target } from "lucide-react";

interface TopRecommendationsProps {
  recommendations: string[];
}

export function TopRecommendations({ recommendations }: TopRecommendationsProps) {
  return (
    <div className="space-y-4">
      {recommendations.map((recommendation, index) => (
        <div key={index} className="flex items-start gap-3 bg-white border border-emerald-200 border-l-4 border-l-emerald-500 rounded-md p-4 hover:shadow-sm transition-shadow">
          <div className="h-6 w-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
            {index + 1}
          </div>
          <span className="text-gray-700 leading-relaxed font-medium">{recommendation}</span>
        </div>
      ))}
    </div>
  );
}