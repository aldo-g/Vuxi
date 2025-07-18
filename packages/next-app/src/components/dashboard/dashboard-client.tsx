"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ExternalLink, Calendar, Building2 } from 'lucide-react';
import { FormattedDate } from '@/components/common';
import { QuickActions, DashboardStats } from '@/components/dashboard';
import Link from 'next/link';

interface AnalysisRun {
  id: number;
  status: string;
  overallScore?: number;
  createdAt: string;
}

interface Project {
  id: number;
  name: string;
  baseUrl: string;
  orgName?: string;
  orgPurpose?: string;
  createdAt: string;
  analysisRuns?: AnalysisRun[];
}

interface DashboardClientProps {
  projects?: Project[];
}

function getProjectStatus(project: Project): { 
  status: string; 
  icon: React.ReactNode;
  iconColor: string;
} {
  if (!project.analysisRuns || project.analysisRuns.length === 0) {
    return { 
      status: 'No Analysis',
      icon: <div className="h-3 w-3 rounded-full bg-slate-400"></div>,
      iconColor: 'text-slate-400'
    };
  }

  const latestRun = project.analysisRuns[0]; // Assuming they're sorted by creation date
  
  switch (latestRun.status) {
    case 'completed':
      return { 
        status: 'Available',
        icon: <div className="h-3 w-3 rounded-full bg-green-500"></div>,
        iconColor: 'text-green-500'
      };
    case 'running':
    case 'pending':
      return { 
        status: 'Pending',
        icon: <div className="h-3 w-3 rounded-full bg-orange-500"></div>,
        iconColor: 'text-orange-500'
      };
    case 'failed':
    case 'error':
      return { 
        status: 'Failed',
        icon: <div className="h-3 w-3 rounded-full bg-red-500"></div>,
        iconColor: 'text-red-500'
      };
    default:
      return { 
        status: 'Unknown',
        icon: <div className="h-3 w-3 rounded-full bg-slate-400"></div>,
        iconColor: 'text-slate-400'
      };
  }
}

function ProjectCard({ project }: { project: Project }) {
  const { status, icon, iconColor } = getProjectStatus(project);

  return (
    <Card className="w-full bg-white/90 backdrop-blur-sm border-slate-200/80 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01]">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          {/* Left side - Project info */}
          <div className="flex-1 space-y-3">
            {/* Title and URL */}
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-slate-900 line-clamp-1">
                {project.orgName || project.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <ExternalLink className="h-3 w-3 shrink-0" />
                <span className="line-clamp-1">{project.baseUrl}</span>
              </div>
            </div>

            {/* Created date */}
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Calendar className="h-3 w-3" />
              <span>Created: <FormattedDate dateString={project.createdAt} /></span>
            </div>
          </div>

          {/* Right side - Status */}
          <div className="flex items-center gap-4 ml-6">
            {/* Status indicator */}
            <div className="flex items-center gap-2">
              {icon}
              <span className={`text-sm font-medium ${iconColor}`}>
                {status}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateProjectCard() {
  return (
    <Card className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] border-dashed">
      <CardContent className="flex items-center justify-between p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <Plus className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Create Your First Analysis
            </h3>
            <p className="text-slate-600 text-sm">
              Start analyzing any website to gain valuable UX insights and optimization opportunities.
            </p>
          </div>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 shrink-0">
          <Link href="/analysis">
            Start Analysis
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function DashboardClient({ projects = [] }: DashboardClientProps) {
  // Calculate stats from projects
  const stats = {
    totalReports: projects.reduce((acc, project) => acc + (project.analysisRuns?.length || 0), 0),
    avgScore: projects.length > 0 
      ? projects
          .flatMap(p => p.analysisRuns?.filter(run => run.overallScore) || [])
          .reduce((acc, run, idx, arr) => {
            const sum = acc + (run.overallScore || 0);
            return idx === arr.length - 1 ? sum / arr.length : sum;
          }, 0) || 0
      : 0,
    lastAnalysis: projects[0]?.analysisRuns?.[0]?.createdAt || projects[0]?.createdAt,
    completedAnalyses: projects.reduce((acc, project) => 
      acc + (project.analysisRuns?.filter(run => run.status === 'completed').length || 0), 0
    )
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
            {projects.length > 0 
              ? "Access your UX analysis reports and explore insights from professional evaluations."
              : "Get started by creating your first UX analysis to gain valuable insights."
            }
          </p>
        </div>

        {/* Stats Section */}
        <DashboardStats stats={stats} />

        {/* Quick Actions */}
        <QuickActions />

        {/* Projects Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                {projects.length > 0 ? 'Your Projects' : 'Get Started'}
              </h2>
              <p className="text-slate-600 mt-1">
                {projects.length > 0 
                  ? `Manage and view your ${projects.length} project${projects.length === 1 ? '' : 's'}`
                  : 'Create your first UX analysis project'
                }
              </p>
            </div>
            {projects.length > 0 && (
              <Button asChild>
                <Link href="/analysis">
                  <Plus className="h-4 w-4 mr-2" />
                  New Analysis
                </Link>
              </Button>
            )}
          </div>

          {/* Project List - Full Width Cards */}
          <div className="space-y-4">
            {projects.length === 0 ? (
              <div className="max-w-4xl mx-auto">
                <CreateProjectCard />
              </div>
            ) : (
              <>
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
                <CreateProjectCard />
              </>
            )}
          </div>
        </div>

        {/* Recent Activity Section - Only show if there are multiple projects */}
        {projects && projects.length > 3 && (
          <Card className="bg-white/90 backdrop-blur-sm border-slate-200/80 shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-2xl font-semibold text-slate-900">Recent Activity</CardTitle>
              <CardDescription className="text-slate-600">
                Your most recent analysis projects and their performance.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {projects.slice(0, 5).map((project) => {
                  const latestRun = project.analysisRuns?.[0];
                  const { status, icon, iconColor } = getProjectStatus(project);
                  
                  return (
                    <div key={project.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-slate-100 rounded-lg">
                          <Building2 className="h-4 w-4 text-slate-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-900">{project.orgName || project.name}</h3>
                          <p className="text-sm text-slate-600">{project.baseUrl}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {latestRun?.overallScore && (
                          <div className="text-right">
                            <div className="font-semibold text-slate-900">{latestRun.overallScore}/10</div>
                            <div className="text-xs text-slate-500">Score</div>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          {icon}
                          <span className={`text-sm font-medium ${iconColor}`}>
                            {status}
                          </span>
                        </div>
                        <FormattedDate dateString={project.createdAt} className="text-sm text-slate-500 min-w-fit" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}