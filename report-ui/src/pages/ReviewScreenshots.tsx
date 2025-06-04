// src/pages/ReviewScreenshots.tsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, Edit3, AlertTriangle, ImageOff, Loader2 } from 'lucide-react'; // Added ImageOff, Loader2

const API_BASE_URL = 'http://localhost:3001/api';

interface ScreenshotInfoFromAPI {
  url: string;    // URL of the page screenshotted
  filename: string; // e.g., "000_example.com_index.png"
  path: string;   // e.g., "desktop/000_example.com_index.png" - may not be directly used if fetching base64
  timestamp: string;
}

interface ScreenshotDisplayInfo extends ScreenshotInfoFromAPI {
  id: string; // Can be filename or a generated ID
  base64Image?: string; // To store fetched base64 image
  altText: string;
  isLoading: boolean;
  error?: string;
}


const ReviewScreenshots = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { analysisParams, screenshots: screenshotsFromState, jobId } = location.state || {
    analysisParams: { targetUrl: "N/A", orgName: "N/A" },
    screenshots: [],
    jobId: null,
  };
  
  const [displayScreenshots, setDisplayScreenshots] = useState<ScreenshotDisplayInfo[]>([]);

  useEffect(() => {
    if (!jobId || !screenshotsFromState || screenshotsFromState.length === 0) {
        // If no screenshots from state, create placeholder or show error
        const placeholderScreenshots = Array.from({ length: Math.min(analysisParams.maxUrls || 0, 5) || 3 }, (_, i) => ({
            id: `placeholder-${i + 1}`,
            url: `${analysisParams.targetUrl || 'http://example.com'}/page-${i + 1}`,
            path: '', // No real path for placeholder
            filename: `placeholder_${i}.png`,
            timestamp: new Date().toISOString(),
            base64Image: `https://via.placeholder.com/400x300.png?text=Review+Screenshot+${i + 1}`,
            altText: `Placeholder Screenshot ${i + 1}`,
            isLoading: false,
            error: screenshotsFromState.length === 0 && !jobId ? "No screenshots were captured or job data missing." : undefined
        }));
        setDisplayScreenshots(placeholderScreenshots);
        if (screenshotsFromState.length === 0 && !jobId) {
            console.warn("ReviewScreenshots: No jobId or screenshot data received via location.state.");
        }
        return;
    }

    const initialDisplayData: ScreenshotDisplayInfo[] = screenshotsFromState.map((ss: ScreenshotInfoFromAPI) => ({
      ...ss,
      id: ss.filename, // Use filename as a unique ID
      altText: `Screenshot of ${ss.url}`,
      isLoading: true, // Initially true, will fetch
    }));
    setDisplayScreenshots(initialDisplayData);

    // Fetch all screenshots
    initialDisplayData.forEach((ss) => {
      fetch(`${API_BASE_URL}/capture/${jobId}/screenshot/${ss.filename}`)
        .then(response => {
          if (!response.ok) throw new Error(`Failed to fetch ${ss.filename}`);
          return response.json();
        })
        .then(data => {
          setDisplayScreenshots(prev => prev.map(prevSs => 
            prevSs.id === ss.id ? { ...prevSs, base64Image: data.image, isLoading: false } : prevSs
          ));
        })
        .catch(error => {
          console.error(`Error fetching screenshot ${ss.filename}:`, error);
          setDisplayScreenshots(prev => prev.map(prevSs => 
            prevSs.id === ss.id ? { ...prevSs, isLoading: false, error: error.message, base64Image: 'https://via.placeholder.com/400x300.png?text=Load+Error' } : prevSs
          ));
        });
    });
  }, [jobId, screenshotsFromState, analysisParams]);


  const handleConfirm = () => {
    console.log('Screenshots reviewed. Analysis parameters:', analysisParams);
    console.log('Job ID for this capture:', jobId);
    // Potentially trigger next analysis steps using jobId and analysisParams
    alert('Screenshots reviewed. (Placeholder - Next steps like Lighthouse/LLM analysis would be triggered here, using the captured data associated with Job ID: ' + jobId + ')');
    navigate('/reports'); // Navigate to reports list or a new status page
  };

  const handleGoBack = () => {
    // Pass back the original params so the form can be pre-filled if user wants to edit
    navigate('/conduct-analysis', { state: { previousParams: analysisParams } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-100 to-slate-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={handleGoBack}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-700 transition-colors duration-200 group border-slate-300 hover:border-indigo-400"
          >
            <Edit3 size={18} className="transform transition-transform duration-200 group-hover:-rotate-12" />
            Edit Parameters or Re-Crawl
          </Button>
        </div>

        <Card className="bg-white shadow-2xl rounded-xl border-slate-200/80">
          <CardHeader className="p-6 sm:p-8 bg-slate-50/70 rounded-t-xl border-b border-slate-200/70">
            <CardTitle className="text-2xl sm:text-3xl font-bold text-slate-800">
              Review Captured Screenshots
            </CardTitle>
            <CardDescription className="text-slate-500 mt-1 text-sm sm:text-base">
              Verify these screenshots for <span className="font-semibold text-slate-700">{analysisParams.orgName} ({analysisParams.targetUrl})</span> before proceeding. Job ID: {jobId || "N/A"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 sm:p-8">
            {displayScreenshots.length === 0 && !jobId ? (
                <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                    <AlertTriangle size={48} className="mx-auto text-amber-500 mb-4" />
                    <p className="text-xl font-semibold text-slate-700 mb-2">No Screenshot Data</p>
                    <p className="text-slate-500">Could not load screenshot information. Please try starting a new analysis.</p>
                </div>
            ) : displayScreenshots.length === 0 && jobId ? (
                 <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                    <Loader2 size={48} className="mx-auto text-blue-500 mb-4 animate-spin" />
                    <p className="text-xl font-semibold text-slate-700 mb-2">Loading Screenshots...</p>
                    <p className="text-slate-500">Fetching captured images for Job ID: {jobId}.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                {displayScreenshots.map((screenshot) => (
                    <div key={screenshot.id} className="border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 group bg-slate-50 flex flex-col">
                        {screenshot.isLoading ? (
                            <div className="w-full h-48 bg-slate-200 flex items-center justify-center">
                                <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
                            </div>
                        ) : screenshot.error ? (
                             <div className="w-full h-48 bg-red-50 flex flex-col items-center justify-center p-2">
                                <ImageOff className="h-8 w-8 text-red-400 mb-2" />
                                <p className="text-xs text-red-600 text-center">Error loading image: {screenshot.filename}</p>
                            </div>
                        ) : (
                            <img
                                src={screenshot.base64Image}
                                alt={screenshot.altText}
                                className="w-full h-48 object-cover object-top"
                            />
                        )}
                        <div className="p-3 text-center mt-auto bg-white border-t border-slate-200">
                            <p className="text-xs text-slate-600 truncate group-hover:whitespace-normal group-hover:overflow-visible" title={screenshot.url}>
                            {screenshot.url.replace(/^https?:\/\//, '')}
                            </p>
                        </div>
                    </div>
                ))}
                </div>
            )}
          </CardContent>
          <CardFooter className="p-6 sm:p-8 border-t border-slate-200/70 flex flex-col sm:flex-row justify-end gap-4">
            <Button 
                variant="outline" 
                onClick={handleGoBack}
                className="w-full sm:w-auto border-slate-400 text-slate-700 hover:bg-slate-100"
            >
              <ArrowLeft size={18} className="mr-2" /> Go Back & Edit
            </Button>
            <Button 
                onClick={handleConfirm}
                className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold"
                disabled={displayScreenshots.length === 0 || displayScreenshots.some(s => s.isLoading) || !jobId}
            >
              <CheckCircle size={18} className="mr-2" /> Confirm & Proceed with Full Analysis
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ReviewScreenshots;