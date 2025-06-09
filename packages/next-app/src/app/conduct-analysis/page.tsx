'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { ArrowLeft, Beaker, Loader2 } from 'lucide-react';

const ConductAnalysisPage = () => {
  const router = useRouter();
  const [projectName, setProjectName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [orgName, setOrgName] = useState('');
  const [orgPurpose, setOrgPurpose] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    // TODO: Implement the API call to start the analysis.
    // The logic below is commented out as requested.

    /*
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          baseUrl: websiteUrl,
          orgName,
          orgPurpose,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start analysis.');
      }

      const project = await response.json();
      // On success, navigate to the new project's dashboard or report page
      router.push(`/dashboard`);

    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
    */

    // For now, we'll just log the data and reset the loading state.
    console.log({
      projectName,
      websiteUrl,
      orgName,
      orgPurpose,
    });
    
    // Simulate a network request
    setTimeout(() => {
        setIsLoading(false);
        // router.push('/dashboard'); // Uncomment to navigate on successful submission
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-700 transition-colors duration-200 group"
          >
            <ArrowLeft
              size={18}
              className="transform transition-transform duration-200 group-hover:-translate-x-1"
            />
            Back to Dashboard
          </Link>
        </div>

        <Card className="bg-white shadow-lg rounded-xl border-slate-200/80">
          <CardHeader className="p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-lg flex items-center justify-center shadow-md">
                <Beaker size={24} />
              </div>
              <div>
                <CardTitle className="text-2xl sm:text-3xl font-bold text-slate-800">
                  Conduct New Analysis
                </CardTitle>
                <CardDescription className="text-slate-500 mt-1 text-sm sm:text-base">
                  Provide details about the project to start the UX analysis.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="project-name" className="text-base">
                  Project Name
                </Label>
                <Input
                  id="project-name"
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g., 'Vuxi Redesign Q3'"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website-url" className="text-base">
                  Website URL
                </Label>
                <Input
                  id="website-url"
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://your-website.com"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-name" className="text-base">
                  Organization Name
                </Label>
                <Input
                  id="org-name"
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.g. target.value)}
                  placeholder="e.g., 'Vuxi Inc.'"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-purpose" className="text-base">
                  Organization's Purpose
                </Label>
                <Textarea
                  id="org-purpose"
                  value={orgPurpose}
                  onChange={(e) => setOrgPurpose(e.target.value)}
                  placeholder="Describe the main goal of your organization or product. For example, 'We help teams analyze user experience with AI.'"
                  required
                  disabled={isLoading}
                  rows={4}
                />
              </div>
            </CardContent>

            <CardFooter className="p-6 sm:p-8 border-t border-slate-200/70">
              <Button
                type="submit"
                size="lg"
                className="w-full sm:w-auto"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 size={20} className="mr-2 animate-spin" />
                ) : (
                  <Beaker size={20} className="mr-2" />
                )}
                {isLoading ? 'Starting Analysis...' : 'Start Analysis'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ConductAnalysisPage;