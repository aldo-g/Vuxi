'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { ArrowLeft, Beaker, Loader2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

interface Job {
  id: string;
  status: 'pending' | 'running' | 'url_discovery' | 'screenshot_capture' | 'completed' | 'failed';
  progress: {
    stage: string;
    percentage: number;
    message: string;
  };
  baseUrl: string;
  createdAt: string;
  results?: {
    urls: string[];
    screenshots: any[];
    stats: any;
    files: any;
  };
  error?: string;
}

const ConductAnalysisPage = () => {
  const router = useRouter();
  const [projectName, setProjectName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [orgName, setOrgName] = useState('');
  const [orgPurpose, setOrgPurpose] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Job polling state
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, []);

  // Start polling for job status
  const startPolling = (jobId: string) => {
    setIsPolling(true);
    
    const poll = async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch job status');
        }
        
        const job: Job = await response.json();
        setCurrentJob(job);
        
        // Stop polling if job is complete or failed
        if (job.status === 'completed' || job.status === 'failed') {
          setIsPolling(false);
          if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
            pollingInterval.current = null;
          }
        }
        
      } catch (error) {
        console.error('Polling error:', error);
        setError('Failed to fetch job status');
        setIsPolling(false);
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current);
          pollingInterval.current = null;
        }
      }
    };

    // Poll immediately, then every 2 seconds
    poll();
    pollingInterval.current = setInterval(poll, 2000);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setCurrentJob(null);

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl: websiteUrl,
          options: {
            maxPages: 15, // Keep it reasonable for demo
            timeout: 8000,
            concurrency: 3,
            fastMode: true,
          },
          projectMeta: {
            name: projectName,
            orgName,
            orgPurpose,
          }
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start analysis.');
      }

      const { jobId } = await response.json();
      
      // Start polling for job status
      startPolling(jobId);
      
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'running':
      case 'url_discovery':
      case 'screenshot_capture': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed': return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'running':
      case 'url_discovery':
      case 'screenshot_capture': return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      default: return <div className="w-5 h-5 bg-gray-300 rounded-full" />;
    }
  };

  const resetForm = () => {
    setCurrentJob(null);
    setIsPolling(false);
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  };

  // Show job progress if we have an active job
  if (currentJob) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <button
              onClick={resetForm}
              className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-700 transition-colors duration-200 group"
            >
              <ArrowLeft size={18} className="transform transition-transform duration-200 group-hover:-translate-x-1" />
              Start New Analysis
            </button>
          </div>

          <Card className="bg-white shadow-lg rounded-xl border-slate-200/80">
            <CardHeader className="p-6 sm:p-8">
              <div className="flex items-center gap-4">
                {getStatusIcon(currentJob.status)}
                <div>
                  <CardTitle className="text-2xl sm:text-3xl font-bold text-slate-800">
                    Website Analysis in Progress
                  </CardTitle>
                  <CardDescription className="text-slate-500 mt-1 text-sm sm:text-base">
                    Analyzing: {currentJob.baseUrl}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700">Progress</span>
                  <span className={`text-sm font-medium ${getStatusColor(currentJob.status)}`}>
                    {currentJob.progress.percentage}%
                  </span>
                </div>
                <Progress value={currentJob.progress.percentage} className="w-full" />
                <p className="text-sm text-slate-600">{currentJob.progress.message}</p>
              </div>

              {currentJob.status === 'completed' && currentJob.results && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-800 mb-4">Analysis Complete!</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-green-700">URLs Found:</span>
                      <span className="ml-2 text-green-800">{currentJob.results.urls.length}</span>
                    </div>
                    <div>
                      <span className="font-medium text-green-700">Screenshots:</span>
                      <span className="ml-2 text-green-800">{currentJob.results.screenshots.length}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <Button
                      onClick={() => router.push('/dashboard')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      View in Dashboard
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.open(`http://localhost:3001/data/job_${currentJob.id}`, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Raw Data
                    </Button>
                  </div>
                </div>
              )}

              {currentJob.status === 'failed' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">Analysis Failed</h3>
                  <p className="text-red-700 text-sm">{currentJob.error}</p>
                  <Button
                    onClick={resetForm}
                    className="mt-4 bg-red-600 hover:bg-red-700"
                  >
                    Try Again
                  </Button>
                </div>
              )}

              <div className="text-xs text-slate-500 space-y-1">
                <div>Job ID: {currentJob.id}</div>
                <div>Started: {new Date(currentJob.createdAt).toLocaleString()}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show the form
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
                  onChange={(e) => setOrgName(e.target.value)}
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

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-800 font-medium">Error</span>
                  </div>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              )}
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