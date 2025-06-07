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

// The backend API URL
const API_BASE_URL = 'http://localhost:3001/api';

// Zod schema for form validation
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
  const [jobId, setJobId] = useState<string | null>(null); // This will now be a temporary UUID
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

  // This effect polls for the status of the temporary preview job
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    // Start polling only if we have a job ID and it's not in a final state
    if (jobId && jobStatus?.status !== 'screenshots_ready' && jobStatus?.status !== 'failed') {
      interval = setInterval(async () => {
        try {
          // IMPORTANT: Poll the new status endpoint for preview jobs
          const res = await fetch(`${API_BASE_URL}/capture/preview/status/${jobId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });

          if (res.ok) {
            const status = await res.json();
            setJobStatus(status);
            // Stop polling if the job is done or has failed
            if (status.status === 'screenshots_ready' || status.status === 'failed') {
              if (interval) clearInterval(interval);
            }
          }
        } catch (err) {
          console.error('Failed to fetch job status:', err);
          setError('Could not connect to the server to get job status.');
          if (interval) clearInterval(interval);
        }
      }, 2000); // Poll every 2 seconds
    }

    // This block handles the navigation once screenshots are ready
    if (jobStatus?.status === 'screenshots_ready') {
      toast({
        title: "Screenshots Ready!",
        description: "Proceed to the next step to review captured images.",
      });
      
      // Navigate to the review page, passing all necessary data in the state.
      // This includes the temp job ID, the screenshot list, and the original form data
      // which is needed for the final commit.
      navigate('/review-screenshots', {
        state: {
          jobId: jobId,
          screenshots: jobStatus.results.screenshots,
          analysisParams: form.getValues(),
        },
      });
    }

    // Cleanup function to clear the interval when the component unmounts
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [jobId, jobStatus, navigate, form]);


  // This function handles the initial form submission
  const handleSubmit = async (values: FormData) => {
    setIsLoading(true);
    setError(null);
    setJobId(null);
    setJobStatus(null);
    
    const token = localStorage.getItem('token');
    if (!token) {
        setError('You must be logged in to start an analysis.');
        setIsLoading(false);
        return;
    }

    try {
      // IMPORTANT: Call the new `/preview` endpoint
      const response = await fetch(`${API_BASE_URL}/capture/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        // Handle non-2xx responses from the server
        const errorData = await response.json().catch(() => ({ error: 'An unknown server error occurred.' }));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      setJobId(data.jobId); // Set the temporary job ID to start polling
      toast({
        title: 'Preview Started',
        description: `Job ID: ${data.jobId}. Capturing screenshots for review.`,
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error('Failed to start analysis job:', errorMessage);
      setError(errorMessage);
      toast({
        title: 'Error',
        description: `Failed to start preview: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
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
              {/* FormField for projectName */}
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
              {/* FormField for baseUrl */}
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
              {/* FormField for orgName */}
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
              {/* FormField for orgPurpose */}
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
                {isLoading ? 'Starting...' : 'Start Preview'}
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
                <CardTitle>Preview in Progress</CardTitle>
                <CardDescription>Temporary Job ID: {jobId}</CardDescription>
            </CardHeader>
            <CardContent>
                {jobStatus ? (
                    <div>
                        <div className="flex justify-between mb-1">
                            <span className="text-base font-medium text-blue-700">
                                {jobStatus.status.charAt(0).toUpperCase() + jobStatus.status.slice(1)}
                            </span>
                        </div>
                        {jobStatus.status === 'processing' && <Progress value={50} className="w-full" />}
                        {jobStatus.status === 'screenshots_ready' && (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="h-5 w-5 mr-2" />
                            <span>Ready for review! Navigating...</span>
                          </div>
                        )}
                        {jobStatus.status === 'failed' && (
                          <Alert variant="destructive">
                              <Terminal className="h-4 w-4" />
                              <AlertTitle>Job Failed</AlertTitle>
                              <AlertDescription>The preview capture failed. Please try again.</AlertDescription>
                          </Alert>
                        )}
                    </div>
                ) : (
                    <p>Waiting for job status...</p>
                )}
            </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ConductAnalysis;