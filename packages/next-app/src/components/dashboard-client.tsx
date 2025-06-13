"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { FileText, Eye, TrendingUp, Zap, ArrowRight, Plus } from 'lucide-react';
import { FormattedDate } from './formatted-date';

interface Project {
  id: number;
  name: string;
  baseUrl: string;
  createdAt: string;
}

export function DashboardClient({ projects }: { projects?: Project[] }) {
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

        {/* Quick Actions Grid */}
        <div className="grid gap-8 md:grid-cols-3 mb-16">
          {/* Create New Analysis Card */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-slate-200/80 bg-white/90 backdrop-blur-sm hover:scale-[1.02]">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Plus className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl font-semibold text-slate-900 group-hover:text-purple-700 transition-colors">
                Create New Analysis
              </CardTitle>
              <CardDescription className="text-slate-600 text-base">
                Start a comprehensive UX analysis of any website
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/create-analysis">
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 group">
                  <Plus className="mr-2 h-5 w-5" />
                  Start Analysis
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* View Example Reports Card */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-slate-200/80 bg-white/90 backdrop-blur-sm hover:scale-[1.02]">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                View Example Reports
              </CardTitle>
              <CardDescription className="text-slate-600 text-base">
                Browse through sample UX analysis reports and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/reports">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 group">
                  <Eye className="mr-2 h-5 w-5" />
                  Browse Examples
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Latest Analysis Card */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-slate-200/80 bg-white/90 backdrop-blur-sm hover:scale-[1.02]">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                Latest Analysis
              </CardTitle>
              <CardDescription className="text-slate-600 text-base">
                Quick access to the most recent UX evaluation report
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/reports">
                <Button variant="outline" className="w-full border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 text-emerald-700 font-semibold py-3 group">
                  <Zap className="mr-2 h-5 w-5" />
                  View Latest
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Historical Projects Section - Keep for historical data if any exists */}
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

        {/* Empty State when no projects */}
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
              <Link href="/create-analysis">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-8 py-4 text-lg">
                  <Plus className="mr-3 h-6 w-6" />
                  Create Analysis
                  <ArrowRight className="ml-3 h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}