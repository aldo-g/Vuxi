import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, Edit3, ImageOff, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const API_BASE_URL = 'http://localhost:3001/api';

// Type for the screenshot metadata received from the previous page
interface ScreenshotInfoFromState {
  url: string;
  filename: string;
  path: string;
}

// Type for managing the display state of each screenshot
interface ScreenshotDisplayInfo extends ScreenshotInfoFromState {
  id: string; // Use filename as a unique ID
  base64Image?: string;
  isLoading: boolean;
  error?: string;
}

const ReviewScreenshots = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCommitting, setIsCommitting] = useState(false);

  // Safely destructure data from location.state, providing defaults
  const { jobId, screenshots, analysisParams } = location.state || {
    jobId: null,
    screenshots: [],
    analysisParams: { projectName: 'N/A', baseUrl: 'N/A' }
  };
  
  const [displayScreenshots, setDisplayScreenshots] = useState<ScreenshotDisplayInfo[]>([]);

  useEffect(() => {
    // Check if we have the necessary data to proceed
    if (!jobId || !screenshots || screenshots.length === 0) {
      toast({
        title: "Missing Data",
        description: "Could not load screenshot information. Please start a new analysis.",
        variant: "destructive",
      });
      navigate('/conduct-analysis'); // Redirect back if data is missing
      return;
    }

    // Initialize display data with loading state
    const initialDisplayData: ScreenshotDisplayInfo[] = screenshots.map((ss: ScreenshotInfoFromState) => ({
      ...ss,
      id: ss.filename,
      isLoading: true,
    }));
    setDisplayScreenshots(initialDisplayData);

    // Fetch the Base64 image data for each screenshot
    initialDisplayData.forEach((ss) => {
      fetch(`${API_BASE_URL}/capture/${ss.id.startsWith('placeholder') ? '' : jobId + '/screenshot/'}${ss.filename}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch ${ss.filename}`);
          }
          return response.json();
        })
        .then(data => {
          // Update the specific screenshot with its image data
          setDisplayScreenshots(prev => prev.map(prevSs => 
            prevSs.id === ss.id ? { ...prevSs, base64Image: data.image, isLoading: false } : prevSs
          ));
        })
        .catch(error => {
          console.error(`Error fetching screenshot ${ss.filename}:`, error);
          // Update the specific screenshot with an error state
          setDisplayScreenshots(prev => prev.map(prevSs => 
            prevSs.id === ss.id ? { ...prevSs, isLoading: false, error: (error as Error).message } : prevSs
          ));
        });
    });
  }, [jobId, screenshots, navigate]);


  // This function is called when the user confirms the screenshots
  const handleConfirm = async () => {
    setIsCommitting(true);
    try {
        const response = await fetch(`${API_BASE_URL}/capture/commit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            // Send the temporary job ID and the original form params for DB creation
            body: JSON.stringify({ 
              tempJobId: jobId,
              ...analysisParams 
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to commit the project.');
        }

        const result = await response.json();
        toast({
            title: "Project Saved!",
            description: `Project and analysis run with ID ${result.finalJobId} have been created.`,
        });
        
        // Navigate to a final reports page or dashboard
        navigate(`/report/${result.finalJobId}`);

    } catch (error) {
        toast({
            title: "Commit Failed",
            description: (error as Error).message,
            variant: "destructive",
        });
        setIsCommitting(false);
    }
  };

  const handleGoBack = () => {
    navigate('/conduct-analysis');
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Card className="max-w-7xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl">Review Captured Screenshots</CardTitle>
          <CardDescription>
            Verify these screenshots for <span className="font-semibold">{analysisParams.projectName}</span> before saving the project.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayScreenshots.map((screenshot) => (
              <div key={screenshot.id} className="border rounded-lg shadow-sm overflow-hidden group">
                <div className="w-full h-56 bg-slate-100 flex items-center justify-center">
                  {screenshot.isLoading ? (
                    <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
                  ) : screenshot.error || !screenshot.base64Image ? (
                    <div className="text-center p-2">
                      <ImageOff className="h-8 w-8 text-red-400 mx-auto mb-2" />
                      <p className="text-xs text-red-600">Could not load image.</p>
                    </div>
                  ) : (
                    <img
                      src={screenshot.base64Image}
                      alt={`Screenshot of ${screenshot.url}`}
                      className="w-full h-full object-cover object-top"
                    />
                  )}
                </div>
                <div className="p-3 bg-white">
                  <p className="text-sm text-slate-600 truncate" title={screenshot.url}>
                    {screenshot.url}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <Button variant="outline" onClick={handleGoBack}>
            <ArrowLeft size={18} className="mr-2" />
            Start Over
          </Button>
          <Button 
              onClick={handleConfirm}
              disabled={isCommitting || displayScreenshots.some(s => s.isLoading)}
            >
            {isCommitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle size={18} className="mr-2" />}
            {isCommitting ? 'Saving Project...' : 'Confirm and Save Project'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ReviewScreenshots;