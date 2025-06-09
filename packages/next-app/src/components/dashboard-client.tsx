"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { FormattedDate } from './formatted-date'; // Import the new component

interface Project {
  id: number;
  name: string;
  baseUrl: string;
  createdAt: string;
}

export function DashboardClient({ projects }: { projects: Project[] }) {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Dashboard</h1>
        <Link href="/conduct-analysis">
          <Button size="lg">
            <PlusCircle className="mr-2 h-5 w-5" />
            Start New Project
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Projects</CardTitle>
          {projects.length === 0 && (
            <CardDescription className="pt-2">
              You haven't started any projects yet. Click the button above to begin your first analysis.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle>{project.name}</CardTitle>
                <CardDescription>{project.baseUrl}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Created on: <FormattedDate dateString={project.createdAt} />
                </p>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}