
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";

interface TopRecommendationsProps {
  recommendations: string[];
}

export function TopRecommendations({ recommendations }: TopRecommendationsProps) {
  return (
    <Card className="border-gray-200 bg-white shadow-sm">
      <CardHeader className="pb-4 bg-gray-50 border-b border-gray-200">
        <CardTitle className="flex items-center gap-3 text-gray-900">
          <div className="h-8 w-8 bg-emerald-100 rounded-lg flex items-center justify-center">
            <Target className="h-4 w-4 text-emerald-600" />
          </div>
          <span className="text-xl font-semibold">Top Recommendations</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
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
      </CardContent>
    </Card>
  );
}
