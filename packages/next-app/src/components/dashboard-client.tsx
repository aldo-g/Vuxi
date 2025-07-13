"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { FormattedDate } from '@/components/common';
import { QuickActions, DashboardStats } from '@/components/dashboard';

interface Project {
  id: number;
  name: string;
  baseUrl: string;
  createdAt: string;
}

interface DashboardClientProps {
  projects?: Project[];
}

export function DashboardClient({ projects }: DashboardClientProps) {
  // Calculate stats from projects
  const stats = {
    totalReports: projects?.length || 0,
    avgScore: 7.2,
    lastAnalysis: projects?.[0]?.createdAt,
    completedAnalyses: projects?.length || 0
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Welcome to Vuxi
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Access your UX analysis reports and explore insights from professional evaluations.
          </p>
        </div>

        {/* Stats Section */}
        <DashboardStats stats={stats} />

        {/* Quick Actions */}
        <QuickActions />

        {/* Historical Projects Section */}
        {projects && projects.length > 0 && (
          <Card className="bg-white/90 backdrop-blur-sm border-slate-200/80 shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-2xl font-semibold text-slate-900">Historical Projects</CardTitle>
              <CardDescription className="text-slate-600">
                Previous analysis projects and their associated data.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <Card key={project.id} className="hover:shadow-lg transition-shadow duration-300 border-slate-200">
                    <CardHeader>
                      <CardTitle className="text-lg text-slate-900">{project.name}</CardTitle>
                      <CardDescription className="text-slate-600">{project.baseUrl}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-500">
                        Created: <FormattedDate dateString={project.createdAt} />
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {(!projects || projects.length === 0) && (
          <Card className="bg-white/90 backdrop-blur-sm border-slate-200/80 shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-2xl font-semibold text-slate-900">Ready to Get Started?</CardTitle>
              <CardDescription className="text-slate-600">
                Create your first UX analysis to start gaining valuable insights.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                <Plus className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Create Your First Analysis</h3>
              <p className="text-slate-600 mb-8 max-w-md mx-auto text-lg leading-relaxed">
                Start analyzing any website to gain valuable UX insights and optimization opportunities.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}