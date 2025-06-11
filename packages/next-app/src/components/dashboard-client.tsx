"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { FileText, Eye } from 'lucide-react';
import { FormattedDate } from './formatted-date';

interface Project {
  id: number;
  name: string;
  baseUrl: string;
  createdAt: string;
}

export function DashboardClient({ projects }: { projects: Project[] }) {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Welcome to Vuxi</h1>
        <p className="text-lg text-muted-foreground">
          Access your UX analysis reports and explore insights from previous evaluations.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              View Reports
            </CardTitle>
            <CardDescription>
              Browse through all available UX analysis reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/reports">
              <Button className="w-full">
                <Eye className="mr-2 h-4 w-4" />
                Browse Reports
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Latest Analysis
            </CardTitle>
            <CardDescription>
              Quick access to the most recent report
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/reports">
              <Button variant="outline" className="w-full">
                View Latest
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Projects Section - Keep for historical data if any exists */}
      {projects && projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historical Projects</CardTitle>
            <CardDescription>
              Previous analysis projects and their associated data.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <CardDescription>{project.baseUrl}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Created: <FormattedDate dateString={project.createdAt} />
                  </p>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty State when no projects */}
      {(!projects || projects.length === 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Explore available UX analysis reports to gain insights into user experience best practices.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-6">
              Ready to explore UX analysis reports? View our collection of professional evaluations.
            </p>
            <Link href="/reports">
              <Button size="lg">
                <Eye className="mr-2 h-5 w-5" />
                Browse Reports
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}