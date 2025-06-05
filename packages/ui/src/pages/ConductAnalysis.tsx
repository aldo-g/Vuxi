// src/pages/ConductAnalysis.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Removed useLocation for now, can be added back if needed for pre-filling
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowLeft, PlayCircle, Loader2, AlertTriangle } from 'lucide-react'; // Added Loader2 and AlertTriangle

// Interface for analysis parameters to be passed to review page
interface AnalysisParams {
  targetUrl: string;
  orgName: string;
  orgType: string;
  orgPurpose: string;
  // Add other relevant options from your API if needed
  maxUrls?: number;
  viewportWidth?: number;
  viewportHeight?: number;
}

// Interface for screenshot data expected by ReviewScreenshots page
interface ScreenshotInfo {
  url: string;
  filename: string;
  path: string; // Path relative to the job's screenshot directory e.g. "desktop/000_example.com.png"
  timestamp: string;
}

interface JobResult {
  urls: string[];
  screenshots: ScreenshotInfo[];
  stats: any; 3
  tempDir: string; // Path on the backend, not directly used by frontend usually
}


const API_BASE_URL = 'http://localhost:3001/api'; // Assuming your Express API runs on port 3001

const ConductAnalysis = () => {
  const navigate = useNavigate();

  const [targetUrl, setTargetUrl] = useState('');
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState('');
  const [orgPurpose, setOrgPurpose] = useState('');
  const [maxUrls, setMaxUrls] = useState(10); // Default value

  const [isLoading, setIsLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pollingIntervalId, setPollingIntervalId] = useState<NodeJS.Timeout | null>(null);

  // Cleanup polling on component unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
      }
    };
  }, [pollingIntervalId]);

  const startPollingJobStatus = (currentJobId: string) => {
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
    }

    const intervalId = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/capture/${currentJobId}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to fetch job status.' }));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        const jobStatus = await response.json();
        setProgressMessage(jobStatus.progress?.message || jobStatus.status);

        if (jobStatus.status === 'completed') {
          clearInterval(intervalId);
          setPollingIntervalId(null);
          setIsLoading(false);
          setJobId(null);
          console.log('Capture job completed:', jobStatus.result);

          const analysisParams: AnalysisParams = { targetUrl, orgName, orgType, orgPurpose, maxUrls };
          
          // The job result from the API already contains the screenshot data in the desired format.
          const jobResultData = jobStatus.result as JobResult;

          navigate('/review-screenshots', {
            state: {
              analysisParams,
              screenshots: jobResultData.screenshots,
              jobId: currentJobId // Pass jobId for fetching images
            }
          });
        } else if (jobStatus.status === 'failed') {
          clearInterval(intervalId);
          setPollingIntervalId(null);
          setIsLoading(false);
          setJobId(null);
          setErrorMessage(jobStatus.error || 'Capture job failed.');
          setProgressMessage('Job failed.');
        }
      } catch (error) {
        console.error('Polling error:', error);
        clearInterval(intervalId);
        setPollingIntervalId(null);
        setIsLoading(false);
        setErrorMessage((error as Error).message || 'Error polling job status.');
        setProgressMessage('Error checking job status.');
      }
    }, 3000); // Poll every 3 seconds
    setPollingIntervalId(intervalId);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setProgressMessage('Starting analysis job...');

    const analysisParamsForApi: AnalysisParams = {
      targetUrl,
      orgName, // Though not directly used by capture API, good to have consistent params
      orgType,
      orgPurpose,
      maxUrls: Number(maxUrls),
      viewportWidth: 1440, // Example default
      viewportHeight: 900  // Example default
    };

    try {
      const response = await fetch(`${API_BASE_URL}/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: analysisParamsForApi.targetUrl,
          options: { // Pass options expected by your API
            maxUrls: analysisParamsForApi.maxUrls,
            viewportWidth: analysisParamsForApi.viewportWidth,
            viewportHeight: analysisParamsForApi.viewportHeight,
            // Add other options if your API supports them (e.g. timeout, concurrency)
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to start job.' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setJobId(data.jobId);
      setProgressMessage(data.message || 'Job submitted. Awaiting progress...');
      startPollingJobStatus(data.jobId);

    } catch (error) {
      console.error('Failed to start analysis job:', error);
      setIsLoading(false);
      setErrorMessage((error as Error).message || 'Failed to start analysis job.');
      setProgressMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-100 to-slate-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-700 transition-colors duration-200 group"
          >
            <ArrowLeft size={18} className="transform transition-transform duration-200 group-hover:-translate-x-1" />
            Back to Vuxi Home
          </Link>
        </div>

        <Card className="bg-white shadow-2xl rounded-xl border-slate-200/80">
          <CardHeader className="p-6 sm:p-8 bg-slate-50/70 rounded-t-xl border-b border-slate-200/70">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-lg flex items-center justify-center shadow-md">
                    <PlayCircle size={24} />
                </div>
                <div>
                    <CardTitle className="text-2xl sm:text-3xl font-bold text-slate-800">
                    Conduct New Website Analysis
                    </CardTitle>
                    <CardDescription className="text-slate-500 mt-1 text-sm sm:text-base">
                    Enter the details below to start a new UX/UI inspection.
                    </CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="targetUrl" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Target Website URL
                </Label>
                <Input
                  id="targetUrl"
                  type="url"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://example.com"
                  required
                  disabled={isLoading}
                  className="w-full border-slate-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                />
              </div>

              <div>
                <Label htmlFor="orgName" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Organization Name
                </Label>
                <Input
                  id="orgName"
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g., Acme Corp"
                  required
                  disabled={isLoading}
                  className="w-full border-slate-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                />
              </div>

              <div>
                <Label htmlFor="orgType" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Organization Type
                </Label>
                <Input
                  id="orgType"
                  type="text"
                  value={orgType}
                  onChange={(e) => setOrgType(e.target.value)}
                  placeholder="e.g., E-commerce, Non-profit, SaaS"
                  required
                  disabled={isLoading}
                  className="w-full border-slate-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                />
              </div>

              <div>
                <Label htmlFor="orgPurpose" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Organizational Purpose / Website Goal
                </Label>
                <Textarea
                  id="orgPurpose"
                  value={orgPurpose}
                  onChange={(e) => setOrgPurpose(e.target.value)}
                  rows={3}
                  placeholder="e.g., To sell products online and increase brand awareness."
                  required
                  disabled={isLoading}
                  className="w-full border-slate-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                />
                 <p className="mt-1.5 text-xs text-slate-500">
                  Describe the main goal of the website (e.g., convert visitors, generate leads, provide information).
                </p>
              </div>
               <div>
                <Label htmlFor="maxUrls" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Maximum URLs to Discover (for screenshots)
                </Label>
                <Input
                  id="maxUrls"
                  type="number"
                  value={maxUrls}
                  onChange={(e) => setMaxUrls(Math.max(1, parseInt(e.target.value, 10) || 1))} // Ensure it's at least 1
                  min="1"
                  max="50" // Reasonable upper limit for this UI
                  disabled={isLoading}
                  className="w-full border-slate-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                />
                 <p className="mt-1.5 text-xs text-slate-500">
                  The capture service will discover and screenshot up to this many URLs. Default: 10.
                </p>
              </div>
             <CardFooter className="p-0 pt-6 flex flex-col items-start">
                <Button 
                    type="submit" 
                    className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-base"
                    disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 size={20} className="mr-2 animate-spin" />
                  ) : (
                    <PlayCircle size={20} className="mr-2" />
                  )}
                  {isLoading ? 'Processing...' : 'Crawl & Capture Screenshots'}
                </Button>
                {isLoading && progressMessage && (
                  <p className="mt-4 text-sm text-indigo-600 animate-pulse">{progressMessage}</p>
                )}
                {errorMessage && (
                  <div className="mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm flex items-center gap-2">
                    <AlertTriangle size={18} /> {errorMessage}
                  </div>
                )}
             </CardFooter>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConductAnalysis;