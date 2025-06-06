import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, CheckCircle } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001/api';

const formSchema = z.object({
  projectName: z.string().min(2, 'Project name must be at least 2 characters.'),
  baseUrl: z.string().url('Please enter a valid URL.'),
  orgName: z.string().optional(),
  orgPurpose: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const ConductAnalysis = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<any>(null);
  const navigate = useNavigate();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectName: '',
      baseUrl: '',
      orgName: '',
      orgPurpose: '',
    },
  });

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (jobId && jobStatus?.status !== 'completed' && jobStatus?.status !== 'failed') {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/capture/status/${jobId}`);
          if (res.ok) {
            const status = await res.json();
            setJobStatus(status);
            if (status.status === 'completed' || status.status === 'failed') {
              if (interval) clearInterval(interval);
            }
          }
        } catch (err) {
          console.error('Failed to fetch job status:', err);
          if (interval) clearInterval(interval);
        }
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [jobId, jobStatus]);

  const handleSubmit = async (values: FormData) => {
    setIsLoading(true);
    setError(null);
    setJobId(null);
    
    const token = localStorage.getItem('token');
    if (!token) {
        setError('You must be logged in to start an analysis.');
        setIsLoading(false);
        toast({
            title: "Authentication Error",
            description: "You must be logged in to start an analysis.",
            variant: "destructive",
        });
        return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Include the auth token
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start job.');
      }

      const data = await response.json();
      setJobId(data.jobId);
      toast({
        title: 'Analysis Started',
        description: `Job ID: ${data.jobId}. You can now monitor its progress.`,
      });
    } catch (error) {
      console.error('Failed to start analysis job:', error);
      setError((error as Error).message);
      toast({
        title: 'Error',
        description: `Failed to start analysis: ${(error as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigateToReport = () => {
    if (jobStatus && jobStatus.analysisRunId) {
      navigate(`/report/${jobStatus.analysisRunId}`);
    }
  };
  
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl">Conduct New Analysis</CardTitle>
          <CardDescription>
            Enter the details for the website you'd like to analyze.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="projectName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., My Company's Website" {...field} />
                    </FormControl>
                    <FormDescription>A memorable name for this analysis project.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="baseUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} />
                    </FormControl>
                    <FormDescription>The full starting URL of the website to analyze.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="orgName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., ACME Inc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="orgPurpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization's Purpose (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., To sell high-quality widgets to businesses."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A brief description of what the organization does. This helps the AI tailor its analysis.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading || !!jobId}>
                {isLoading ? 'Starting...' : 'Confirm and Start Analysis'}
              </Button>
            </form>
          </Form>
        </CardContent>
        {error && (
          <CardFooter>
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardFooter>
        )}
      </Card>

      {jobId && (
        <Card className="max-w-2xl mx-auto mt-8">
            <CardHeader>
                <CardTitle>Analysis in Progress</CardTitle>
                <CardDescription>Job ID: {jobId}</CardDescription>
            </CardHeader>
            <CardContent>
                {jobStatus ? (
                    <div>
                        <div className="flex justify-between mb-1">
                            <span className="text-base font-medium text-blue-700">
                                {jobStatus.status.charAt(0).toUpperCase() + jobStatus.status.slice(1)}
                            </span>
                            <span className="text-sm font-medium text-blue-700">
                                {jobStatus.progress ? `${Math.round(jobStatus.progress * 100)}%` : '0%'}
                            </span>
                        </div>
                        <Progress value={jobStatus.progress ? jobStatus.progress * 100 : 0} className="w-full" />
                        {jobStatus.message && <p className="mt-2 text-sm text-gray-500">{jobStatus.message}</p>}
                    </div>
                ) : (
                    <p>Waiting for job status...</p>
                )}
            </CardContent>
            {jobStatus?.status === 'completed' && (
                <CardFooter className="flex justify-between items-center">
                    <div className="flex items-center text-green-600">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        <span>Analysis Complete!</span>
                    </div>
                    <Button onClick={handleNavigateToReport}>View Report</Button>
                </CardFooter>
            )}
        </Card>
      )}
    </div>
  );
};

export default ConductAnalysis;