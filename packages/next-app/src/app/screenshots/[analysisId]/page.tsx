"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  Image as ImageIcon,
  Download,
  RefreshCw
} from 'lucide-react';

interface AnalysisJob {
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
    screenshots: Array<{
      url: string;
      filename: string;
      path: string;
      timestamp: string;
      duration_ms?: number;
      viewport?: any;
    }>;
    stats: any;
    files: any;
    outputDir: string;
  };
  error?: string;
}

export default function ScreenshotsPage({ params }: { params: { analysisId: string } }) {
  const { analysisId } = params;
  const [job, setJob] = useState<AnalysisJob | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  useEffect(() => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/jobs/${analysisId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Analysis not found. It may have expired or the ID is invalid.');
          } else {
            throw new Error('Failed to fetch analysis status');
          }
          setIsPolling(false);
          return;
        }
        
        const jobData: AnalysisJob = await response.json();
        
        // DEBUG: Log the job data to see what we're getting
        console.log('📊 Job Data:', jobData);
        if (jobData.status === 'completed' && jobData.results) {
          console.log('✅ Job completed with results:', jobData.results);
          console.log('📸 Screenshots array:', jobData.results.screenshots);
          console.log('📁 Output directory:', jobData.results.outputDir);
        }
        
        setJob(jobData);
        
        // Stop polling if job is complete or failed
        if (jobData.status === 'completed' || jobData.status === 'failed') {
          setIsPolling(false);
          if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
            pollingInterval.current = null;
          }
        }
        
      } catch (error) {
        console.error('Polling error:', error);
        setError('Failed to fetch analysis status');
        setIsPolling(false);
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current);
          pollingInterval.current = null;
        }
      }
    };

    // Poll immediately, then every 2 seconds
    poll();
    if (isPolling) {
      pollingInterval.current = setInterval(poll, 2000);
    }

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [analysisId, isPolling]);

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
      case 'completed': return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'failed': return <AlertCircle className="w-6 h-6 text-red-600" />;
      case 'running':
      case 'url_discovery':
      case 'screenshot_capture': return <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />;
      default: return <div className="w-6 h-6 bg-gray-300 rounded-full" />;
    }
  };

  const retry = () => {
    setError(null);
    setIsPolling(true);
    setJob(null);
  };

  // Helper function to construct image URL
  const getImageUrl = (screenshot: any, jobId: string) => {
    console.log('🖼️ Constructing image URL for:', screenshot);
    
    // Try different possible path constructions
    const possiblePaths = [
      `http://localhost:3001/data/job_${jobId}/${screenshot.path}`,
      `http://localhost:3001/data/job_${jobId}/screenshots/desktop/${screenshot.filename}`,
      `http://localhost:3001/data/job_${jobId}/${screenshot.filename}`,
      `http://localhost:3001/${screenshot.path}`,
    ];
    
    console.log('🔗 Possible image paths:', possiblePaths);
    return possiblePaths[0]; // Start with the first one
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
          
          <Card className="text-center p-8">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Analysis Error</h1>
            <p className="text-slate-600 mb-6">{error}</p>
            <div className="flex gap-4 justify-center">
              <Button onClick={retry}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Link href="/">
                <Button variant="outline">Start New Analysis</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-xl text-slate-700">Loading analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          
          <div className="flex items-center gap-4 mb-2">
            {getStatusIcon(job.status)}
            <h1 className="text-3xl font-bold text-slate-900">Website Screenshot Analysis</h1>
          </div>
          
          <p className="text-slate-600">
            Analysis for: <a href={job.baseUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              {job.baseUrl} <ExternalLink className="w-4 h-4 inline ml-1" />
            </a>
          </p>
        </div>

        {/* DEBUG: Show raw job data when completed */}
        {job.status === 'completed' && (
          <Card className="mb-8 bg-yellow-50 border-yellow-200">
            <CardHeader>
              <CardTitle className="text-yellow-800">🐛 Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <details className="text-sm">
                <summary className="cursor-pointer font-medium text-yellow-700 mb-2">
                  Click to view raw job data
                </summary>
                <pre className="bg-yellow-100 p-4 rounded text-xs overflow-auto max-h-64">
                  {JSON.stringify(job, null, 2)}
                </pre>
              </details>
            </CardContent>
          </Card>
        )}

        {/* Status Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span className={getStatusColor(job.status)}>
                {job.status.replace('_', ' ').toUpperCase()}
              </span>
              <Badge variant="outline">ID: {job.id.slice(0, 8)}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-slate-600">{job.progress.percentage}%</span>
              </div>
              <Progress value={job.progress.percentage} className="w-full" />
              <p className="text-sm text-slate-600">{job.progress.message}</p>
            </div>
            
            {job.status === 'completed' && job.results && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-700">{job.results.urls?.length || 0}</div>
                  <div className="text-sm text-green-600">URLs Found</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-700">{job.results.screenshots?.length || 0}</div>
                  <div className="text-sm text-green-600">Screenshots</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-700">
                    {job.results.stats?.screenshots?.duration?.toFixed(1) || '0'}s
                  </div>
                  <div className="text-sm text-green-600">Duration</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-700">
                    {job.results.screenshots?.length ? '100%' : '0%'}
                  </div>
                  <div className="text-sm text-green-600">Success Rate</div>
                </div>
              </div>
            )}

            {job.status === 'failed' && (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-red-800 font-medium">Analysis Failed</p>
                <p className="text-red-700 text-sm mt-1">{job.error}</p>
                <Button 
                  onClick={() => window.location.reload()} 
                  className="mt-3 bg-red-600 hover:bg-red-700"
                  size="sm"
                >
                  Retry Analysis
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Screenshots Grid */}
        {job.status === 'completed' && job.results?.screenshots && job.results.screenshots.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Screenshots ({job.results.screenshots.length})</h2>
              <div className="flex gap-2">
                <Button 
                  onClick={() => window.open(`http://localhost:3001/data/job_${job.id}`, '_blank')}
                  variant="outline"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Browse Files
                </Button>
                <Button 
                  onClick={() => console.log('Screenshots data:', job.results?.screenshots)}
                  variant="outline"
                  size="sm"
                >
                  🐛 Log Data
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {job.results.screenshots.map((screenshot, index) => {
                const imageUrl = getImageUrl(screenshot, job.id);
                
                return (
                  <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video bg-slate-100 relative group">
                      <img
                        src={imageUrl}
                        alt={`Screenshot of ${screenshot.url}`}
                        className="w-full h-full object-cover"
                        onLoad={() => console.log('✅ Image loaded:', imageUrl)}
                        onError={(e) => {
                          console.error('❌ Image failed to load:', imageUrl);
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          
                          // Show error state
                          const errorDiv = target.nextElementSibling as HTMLElement;
                          if (errorDiv) errorDiv.style.display = 'flex';
                        }}
                      />
                      
                      {/* Error fallback */}
                      <div 
                        className="absolute inset-0 bg-red-50 border-2 border-red-200 rounded flex items-center justify-center flex-col text-red-600"
                        style={{ display: 'none' }}
                      >
                        <AlertCircle className="w-8 h-8 mb-2" />
                        <p className="text-sm font-medium">Image not found</p>
                        <p className="text-xs text-red-500 text-center px-2 mt-1">
                          {imageUrl}
                        </p>
                      </div>
                      
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                        <Button 
                          size="sm" 
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => window.open(imageUrl, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Full
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium text-slate-900 mb-2 truncate" title={screenshot.url}>
                        {screenshot.url ? new URL(screenshot.url).pathname || '/' : 'Unknown'}
                      </h3>
                      <p className="text-sm text-slate-600 truncate" title={screenshot.url}>
                        {screenshot.url || 'No URL'}
                      </p>
                      <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                        <span>{screenshot.filename || 'unknown.png'}</span>
                        <span>{screenshot.timestamp ? new Date(screenshot.timestamp).toLocaleTimeString() : 'No time'}</span>
                      </div>
                      <div className="mt-2 text-xs text-slate-400">
                        Path: {screenshot.path || 'No path'}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State for No Screenshots */}
        {job.status === 'completed' && (!job.results?.screenshots || job.results.screenshots.length === 0) && (
          <Card className="text-center p-12">
            <ImageIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-slate-900 mb-2">No Screenshots Generated</h3>
            <p className="text-slate-600 mb-4">
              The analysis completed but no screenshots were captured. This might happen if the website was inaccessible or blocked our crawler.
            </p>
            {job.results && (
              <div className="text-sm text-slate-500 bg-slate-100 p-4 rounded">
                <p>URLs found: {job.results.urls?.length || 0}</p>
                <p>Results object keys: {Object.keys(job.results).join(', ')}</p>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}