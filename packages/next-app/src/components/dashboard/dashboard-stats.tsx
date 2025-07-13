"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, TrendingUp, Clock, CheckCircle2 } from "lucide-react";

interface DashboardStatsProps {
  stats: {
    totalReports: number;
    avgScore: number;
    lastAnalysis?: string;
    completedAnalyses: number;
  };
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards = [
    {
      title: "Total Reports",
      value: stats.totalReports.toString(),
      icon: FileText,
      color: "text-blue-600 bg-blue-100"
    },
    {
      title: "Average Score",
      value: `${stats.avgScore.toFixed(1)}/10`,
      icon: TrendingUp,
      color: "text-green-600 bg-green-100"
    },
    {
      title: "Last Analysis",
      value: stats.lastAnalysis || "None",
      icon: Clock,
      color: "text-orange-600 bg-orange-100"
    },
    {
      title: "Completed",
      value: stats.completedAnalyses.toString(),
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-100"
    }
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
      {statCards.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <Card key={stat.title} className="bg-white border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <IconComponent className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}