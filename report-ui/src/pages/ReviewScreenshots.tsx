import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, Edit3, AlertTriangle } from 'lucide-react';

// Placeholder for screenshot data structure
interface ScreenshotInfo {
  id: string;
  url: string; // URL of the page screenshotted
  path: string; // Path to the image file
  altText: string;
}

const ReviewScreenshots = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // In a real app, analysisParams and screenshotData would come from a state management solution,
  // an API call based on an analysisId, or passed via route state after backend processing.
  // For this example, we'll try to get it from location state or use placeholders.
  const { analysisParams, screenshots } = location.state || { 
    analysisParams: { targetUrl: "N/A", orgName: "N/A" }, 
    screenshots: [] 
  };

  // Generate placeholder screenshots if none are passed
  const displayScreenshots: ScreenshotInfo[] = screenshots.length > 0 
    ? screenshots 
    : Array.from({ length: 10 }, (_, i) => ({
        id: `placeholder-${i + 1}`,
        url: `http://example.com/page-${i + 1}`,
        // Using a placeholder image service
        path: `https://via.placeholder.com/400x300.png?text=Screenshot+${i + 1}`,
        altText: `Placeholder Screenshot ${i + 1} for ${analysisParams.targetUrl || 'example.com'}`,
      }));

  const handleConfirm = () => {
    console.log('Screenshots confirmed. Proceeding to full analysis with params:', analysisParams);
    // Here you would trigger the next step of your analysis pipeline (Lighthouse, LLM, etc.)
    // For now, we'll just show an alert and navigate to a conceptual "processing" page or back to reports.
    alert('Analysis confirmed! (Placeholder - Next steps would be triggered here)');
    navigate('/reports'); // Or a new status page: /analysis-status/:analysisId
  };

  const handleGoBack = () => {
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
              Please verify that these screenshots represent the key pages of <span className="font-semibold text-slate-700">{analysisParams.orgName} ({analysisParams.targetUrl})</span> you want to analyze.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 sm:p-8">
            {displayScreenshots.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                    <AlertTriangle size={48} className="mx-auto text-amber-500 mb-4" />
                    <p className="text-xl font-semibold text-slate-700 mb-2">No Screenshots Available</p>
                    <p className="text-slate-500">The screenshot generation process might have failed or returned no images.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                {displayScreenshots.map((screenshot) => (
                    <div key={screenshot.id} className="border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 group bg-slate-50">
                    <img
                        src={screenshot.path}
                        alt={screenshot.altText}
                        className="w-full h-48 object-cover object-top"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300.png?text=Image+Error'; }}
                    />
                    <div className="p-3 text-center">
                        <p className="text-xs text-slate-600 truncate group-hover:whitespace-normal" title={screenshot.url}>
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
                disabled={displayScreenshots.length === 0}
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