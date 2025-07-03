"use client";

import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Globe, 
  Building2, 
  Target, 
  Camera, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  Clock,
  ImageOff
} from 'lucide-react';

// Types
interface ScreenshotData {
  url?: string;
  filename?: string;
  path?: string;
  timestamp?: string;
  duration_ms?: number;
  viewport?: {
    width: number;
    height: number;
  };
  isCustom?: boolean;
  dataUrl?: string;
  customPageName?: string;
}

interface Screenshot {
  url: string;
  success: boolean;
  data?: ScreenshotData;
  error?: string | null;
}

interface CaptureJob {
  id: string;
  status: 'pending' | 'running' | 'url_discovery' | 'screenshot_capture' | 'completed' | 'failed';
  progress: {
    stage: string;
    percentage: number;
    message: string;
  };
  results?: {
    screenshots: Screenshot[];
    urls: string[];
    stats?: {
      screenshots?: {
        duration: number;
        successful: number;
        failed: number;
      };
    };
  };
  error?: string;
}

interface AnalysisJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: {
    stage: string;
    percentage: number;
    message: string;
  };
  results?: {
    reportPath?: string;
    lighthouse?: any;
    llmAnalysis?: any;
    formatting?: any;
    htmlReport?: any;
  };
  error?: string;
}

interface AnalysisData {
  websiteUrl: string;
  organizationName: string;
  sitePurpose: string;
  captureJobId?: string;
  screenshots?: Screenshot[];
}

const WIZARD_STEPS = [
  { id: 1, title: 'Website URL', icon: Globe },
  { id: 2, title: 'Organization', icon: Building2 },
  { id: 3, title: 'Site Purpose', icon: Target },
  { id: 4, title: 'Processing', icon: Camera },
  { id: 5, title: 'Review Captures', icon: CheckCircle2 },
  { id: 6, title: 'Analyzing', icon: Loader2 },
  { id: 7, title: 'Results', icon: CheckCircle2 }
];

// Helper function to safely construct screenshot URLs
const getScreenshotUrl = (screenshot: Screenshot, jobId: string): string => {
  const baseUrl = `http://localhost:3001/data/job_${jobId}`;
  
  console.log('Constructing screenshot URL for:', { screenshot, jobId });
  
  // The screenshot service returns results in format: {url, success, data, error}
  // where data contains the actual screenshot metadata
  const screenshotData = screenshot.success ? screenshot.data : null;
  
  if (!screenshotData) {
    console.log('No screenshot data available (capture failed)');
    return `${baseUrl}/screenshots/desktop/placeholder.png`;
  }

  // Check if this is a custom uploaded image
  if (screenshotData.isCustom && screenshotData.dataUrl) {
    console.log('Using custom uploaded image data URL');
    return screenshotData.dataUrl;
  }
  
  // Priority 1: Use the path directly from the service data
  if (screenshotData.path && typeof screenshotData.path === 'string') {
    // The path includes the subdirectory structure (e.g., "desktop/001_example.png")
    // We need to add "screenshots/" prefix since that's the actual directory structure
    const url = `${baseUrl}/screenshots/${screenshotData.path}`;
    console.log('Using path from service data:', url);
    return url;
  }
  
  // Priority 2: Use filename with the correct directory structure
  if (screenshotData.filename && typeof screenshotData.filename === 'string') {
    // Screenshots are stored in screenshots/desktop/ subdirectory
    const url = `${baseUrl}/screenshots/desktop/${screenshotData.filename}`;
    console.log('Using filename with desktop path:', url);
    return url;
  }
  
  // Priority 3: Fallback to placeholder
  console.log('Cannot construct reliable filename - insufficient data in screenshot.data');
  return `${baseUrl}/screenshots/desktop/placeholder.png`;
};

// Improved URL validation and normalization
const validateAndNormalizeUrl = (url: string): { isValid: boolean; normalizedUrl: string; error?: string } => {
  if (!url || !url.trim()) {
    return { isValid: false, normalizedUrl: url, error: 'Please enter a website URL' };
  }

  const trimmedUrl = url.trim();
  
  // Try the URL as-is first
  try {
    const testUrl = new URL(trimmedUrl);
    // Valid URL with protocol
    return { isValid: true, normalizedUrl: trimmedUrl };
  } catch {
    // Failed, try adding https://
  }
  
  // Try adding https:// prefix
  try {
    const withHttps = `https://${trimmedUrl}`;
    const testUrl = new URL(withHttps);
    
    // Additional validation to ensure it looks like a real domain
    const hostname = testUrl.hostname;
    
    // Basic domain validation - should have at least one dot and valid characters
    if (hostname.includes('.') && /^[a-zA-Z0-9.-]+$/.test(hostname)) {
      return { isValid: true, normalizedUrl: withHttps };
    } else {
      return { isValid: false, normalizedUrl: trimmedUrl, error: 'Please enter a valid website URL (e.g., example.com or https://example.com)' };
    }
  } catch {
    return { isValid: false, normalizedUrl: trimmedUrl, error: 'Please enter a valid website URL (e.g., example.com or https://example.com)' };
  }
};

// Separate Add Page Modal Component to prevent re-renders
const AddPageModal = memo(({ 
  isOpen, 
  newPageData, 
  onPageDataChange, 
  onCancel, 
  onConfirm 
}: {
  isOpen: boolean;
  newPageData: { name: string; url: string };
  onPageDataChange: (data: { name: string; url: string }) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  // Focus the name input when modal opens
  useEffect(() => {
    if (isOpen && nameInputRef.current) {
      // Small delay to ensure modal is fully rendered
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onPageDataChange({ ...newPageData, name: e.target.value });
  }, [newPageData, onPageDataChange]);

  const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onPageDataChange({ ...newPageData, url: e.target.value });
  }, [newPageData, onPageDataChange]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Add New Page</h3>
        <p className="text-sm text-slate-600 mb-6">
          Provide details for this new page screenshot.
        </p>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="modal-page-name" className="text-sm font-medium">
              Page Name *
            </Label>
            <Input
              ref={nameInputRef}
              id="modal-page-name"
              placeholder="e.g., About Us, Contact, Product Details"
              value={newPageData.name}
              onChange={handleNameChange}
              className="mt-1"
              autoFocus
            />
          </div>
          
          <div>
            <Label htmlFor="modal-page-url" className="text-sm font-medium">
              Page URL (optional)
            </Label>
            <Input
              id="modal-page-url"
              placeholder="https://example.com/about"
              value={newPageData.url}
              onChange={handleUrlChange}
              className="mt-1"
            />
            <p className="text-xs text-slate-500 mt-1">
              Leave blank to auto-generate
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button 
            onClick={onCancel}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={!newPageData.name.trim()}
            className="flex-1"
          >
            Add Screenshot
          </Button>
        </div>
      </div>
    </div>
  );
});

AddPageModal.displayName = 'AddPageModal';

// Separate component for capture status to isolate re-renders
const CaptureStatus = memo(({ captureJob, captureStarted }: { captureJob: CaptureJob | null, captureStarted: boolean }) => {
  if (!captureStarted || !captureJob) return null;

  if (captureJob.status === 'completed') {
    return (
      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2 text-green-700 text-sm">
          <CheckCircle2 className="w-4 h-4" />
          <span>Website analysis completed!</span>
        </div>
      </div>
    );
  }

  if (captureJob.status === 'failed') {
    return (
      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>Analysis failed: {captureJob.error || 'Unknown error'}</span>
        </div>
      </div>
    );
  }

  if (!['completed', 'failed'].includes(captureJob.status)) {
    return (
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 text-blue-700 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Website analysis running in background...</span>
          <Badge variant="secondary" className="text-xs">
            {captureJob.progress.percentage}%
          </Badge>
        </div>
      </div>
    );
  }

  return null;
});

CaptureStatus.displayName = 'CaptureStatus';

// Memoized form components that won't re-render unless their specific props change
const URLInputStep = memo(({ 
  websiteUrl, 
  onUrlChange, 
  onNext, 
  isLoading, 
  error 
}: {
  websiteUrl: string;
  onUrlChange: (url: string) => void;
  onNext: () => void;
  isLoading: boolean;
  error: string | null;
}) => (
  <Card className="border-slate-200 bg-white shadow-lg">
    <CardHeader className="text-center pb-6">
      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Globe className="w-8 h-8 text-white" />
      </div>
      <CardTitle className="text-2xl font-semibold">Enter Website URL</CardTitle>
      <p className="text-slate-600 mt-2">
        Which website would you like to analyze? We'll start capturing data while you provide additional details.
      </p>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="website-url" className="text-sm font-medium">
          Website URL
        </Label>
        <Input
          id="website-url"
          type="url"
          placeholder="example.com or https://example.com"
          value={websiteUrl}
          onChange={(e) => onUrlChange(e.target.value)}
          className="text-lg py-3"
        />
        <p className="text-xs text-slate-500">
          Enter a website URL (with or without https://)
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <Button 
        onClick={onNext}
        disabled={!websiteUrl || isLoading}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Starting Analysis...
          </>
        ) : (
          <>
            Continue
            <ArrowRight className="w-5 h-5 ml-2" />
          </>
        )}
      </Button>
    </CardContent>
  </Card>
));

URLInputStep.displayName = 'URLInputStep';

const OrganizationStep = memo(({ 
  organizationName, 
  onOrgChange, 
  onNext, 
  onBack, 
  captureJob, 
  captureStarted 
}: {
  organizationName: string;
  onOrgChange: (name: string) => void;
  onNext: () => void;
  onBack: () => void;
  captureJob: CaptureJob | null;
  captureStarted: boolean;
}) => (
  <Card className="border-slate-200 bg-white shadow-lg">
    <CardHeader className="text-center pb-6">
      <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Building2 className="w-8 h-8 text-white" />
      </div>
      <CardTitle className="text-2xl font-semibold">Organization Details</CardTitle>
      <p className="text-slate-600 mt-2">
        Tell us about the organization whose website we're analyzing.
      </p>
      
      <CaptureStatus captureJob={captureJob} captureStarted={captureStarted} />
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="org-name" className="text-sm font-medium">
          Organization Name
        </Label>
        <Input
          id="org-name"
          type="text"
          placeholder="e.g., Acme Corporation"
          value={organizationName}
          onChange={(e) => onOrgChange(e.target.value)}
          className="text-lg py-3"
        />
      </div>

      <div className="flex gap-3">
        <Button 
          onClick={onBack}
          variant="outline"
          className="flex-1"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button 
          onClick={onNext}
          disabled={!organizationName.trim()}
          className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </CardContent>
  </Card>
));

OrganizationStep.displayName = 'OrganizationStep';

const PurposeStep = memo(({ 
  sitePurpose, 
  onPurposeChange, 
  onNext, 
  onBack, 
  captureJob, 
  captureStarted 
}: {
  sitePurpose: string;
  onPurposeChange: (purpose: string) => void;
  onNext: () => void;
  onBack: () => void;
  captureJob: CaptureJob | null;
  captureStarted: boolean;
}) => (
  <Card className="border-slate-200 bg-white shadow-lg">
    <CardHeader className="text-center pb-6">
      <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Target className="w-8 h-8 text-white" />
      </div>
      <CardTitle className="text-2xl font-semibold">Website Purpose</CardTitle>
      <p className="text-slate-600 mt-2">
        What is the main purpose or goal of this website?
      </p>
      
      <CaptureStatus captureJob={captureJob} captureStarted={captureStarted} />
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="site-purpose" className="text-sm font-medium">
          Site Purpose & Goals
        </Label>
        <Textarea
          id="site-purpose"
          placeholder="e.g., E-commerce store selling sustainable products, Portfolio website for a design agency, Educational platform for online courses..."
          value={sitePurpose}
          onChange={(e) => onPurposeChange(e.target.value)}
          className="min-h-[120px] resize-none"
        />
        <p className="text-xs text-slate-500">
          Describe the website's main objectives, target audience, and key functions
        </p>
      </div>

      <div className="flex gap-3">
        <Button 
          onClick={onBack}
          variant="outline"
          className="flex-1"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button 
          onClick={onNext}
          disabled={!sitePurpose.trim()}
          className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </CardContent>
  </Card>
));

PurposeStep.displayName = 'PurposeStep';

export function AnalysisWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captureJob, setCaptureJob] = useState<CaptureJob | null>(null);
  const [captureStarted, setCaptureStarted] = useState(false);
  const [analysisJob, setAnalysisJob] = useState<AnalysisJob | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData>({
    websiteUrl: '',
    organizationName: '',
    sitePurpose: ''
  });
  const [selectedScreenshotIndex, setSelectedScreenshotIndex] = useState<number | null>(null);
  const [editingScreenshot, setEditingScreenshot] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPageData, setNewPageData] = useState({ name: '', url: '' });
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  
  // Refs for managing polling and state
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);
  const analysisPollingRef = useRef<NodeJS.Timeout | null>(null);
  const isAnalysisPollingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addFileInputRef = useRef<HTMLInputElement>(null);
  
  // Use refs to store current state values for file handlers
  const editingScreenshotRef = useRef<number | null>(null);
  const isAddingNewRef = useRef<boolean>(false);

  // Update refs when state changes
  useEffect(() => {
    editingScreenshotRef.current = editingScreenshot;
  }, [editingScreenshot]);

  useEffect(() => {
    isAddingNewRef.current = isAddingNew;
  }, [isAddingNew]);

  // Memoized callback for page data changes to prevent re-renders
  const handlePageDataChange = useCallback((data: { name: string; url: string }) => {
    setNewPageData(data);
  }, []);

  // Memoized callback for modal cancel
  const handleModalCancel = useCallback(() => {
    setShowAddForm(false);
    setNewPageData({ name: '', url: '' });
    setPendingFile(null);
    resetFileStates();
  }, []);

  // Poll for capture job status
  const pollCaptureJobStatus = useCallback(async () => {
    if (!captureJob?.id || isPollingRef.current) return;
    
    isPollingRef.current = true;
    
    try {
      const response = await fetch(`http://localhost:3001/api/capture/${captureJob.id}`);
      if (response.ok) {
        const jobData = await response.json();
        setCaptureJob(jobData);
        
        if (jobData.status === 'completed') {
          setAnalysisData(prev => ({ ...prev, screenshots: jobData.results?.screenshots || [] }));
          setCurrentStep(5);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        } else if (jobData.status === 'failed') {
          setError(jobData.error || 'Capture process failed');
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        }
      }
    } catch (err) {
      console.error('Error polling job status:', err);
    } finally {
      isPollingRef.current = false;
    }
  }, [captureJob?.id]);

  // Poll for analysis job status
  const pollAnalysisJobStatus = useCallback(async () => {
    if (!analysisJob?.id || isAnalysisPollingRef.current) return;
    
    isAnalysisPollingRef.current = true;
    
    try {
      const response = await fetch(`/api/start-analysis?jobId=${analysisJob.id}`);
      if (response.ok) {
        const jobData = await response.json();
        setAnalysisJob(jobData);
        
        if (jobData.status === 'completed') {
          setIsAnalyzing(false);
          setCurrentStep(7); // Analysis results step
          if (analysisPollingRef.current) {
            clearInterval(analysisPollingRef.current);
            analysisPollingRef.current = null;
          }
        } else if (jobData.status === 'failed') {
          setError(jobData.error || 'Analysis failed');
          setIsAnalyzing(false);
          if (analysisPollingRef.current) {
            clearInterval(analysisPollingRef.current);
            analysisPollingRef.current = null;
          }
        }
      }
    } catch (err) {
      console.error('Error polling analysis status:', err);
    } finally {
      isAnalysisPollingRef.current = false;
    }
  }, [analysisJob?.id]);

  // Start analysis function
  const startAnalysis = async () => {
    if (!analysisData.captureJobId || !analysisData.screenshots?.length) {
      setError('No screenshots available for analysis');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setCurrentStep(6); // Analysis waiting step

    try {
      const response = await fetch('/api/start-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisData,
          captureJobId: analysisData.captureJobId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to start analysis: ${errorText}`);
      }

      const result = await response.json();
      setAnalysisJob({
        id: result.analysisJobId,
        status: result.status,
        progress: { stage: 'starting', percentage: 0, message: 'Starting analysis...' }
      });

      // Start polling for analysis progress
      analysisPollingRef.current = setInterval(pollAnalysisJobStatus, 2000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start analysis';
      setError(errorMessage);
      setIsAnalyzing(false);
      setCurrentStep(5); // Back to review step
    }
  };

  // Start polling when step 4 is reached and job exists
  useEffect(() => {
    // Capture job polling
    if (currentStep === 4 && captureJob?.id && !['completed', 'failed'].includes(captureJob.status)) {
      const startPolling = () => {
        if (pollingIntervalRef.current) return;
        pollingIntervalRef.current = setInterval(pollCaptureJobStatus, 2000);
      };
      startPolling();
    }
    
    // Analysis job polling
    if (currentStep === 6 && analysisJob?.id && !['completed', 'failed'].includes(analysisJob.status)) {
      const startAnalysisPolling = () => {
        if (analysisPollingRef.current) return;
        analysisPollingRef.current = setInterval(pollAnalysisJobStatus, 2000);
      };
      startAnalysisPolling();
    }

    // Cleanup function
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (analysisPollingRef.current) {
        clearInterval(analysisPollingRef.current);
        analysisPollingRef.current = null;
      }
      isPollingRef.current = false;
      isAnalysisPollingRef.current = false;
    };
  }, [captureJob?.id, captureJob?.status, analysisJob?.id, analysisJob?.status, currentStep, pollCaptureJobStatus, pollAnalysisJobStatus]);

  // Handle file upload for screenshot replacement/addition
  const handleFileUpload = (file: File, screenshotIndex: number) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string;
      if (!imageDataUrl) {
        alert('Failed to read the image file');
        return;
      }
      
      // Update the screenshot in our data while preserving original URL and page info
      setAnalysisData(prev => {
        if (!prev.screenshots) return prev;
        
        const newScreenshots = [...prev.screenshots];
        const originalScreenshot = newScreenshots[screenshotIndex];
        
        newScreenshots[screenshotIndex] = {
          ...originalScreenshot, // Keep original URL and page info
          success: true,
          data: {
            ...originalScreenshot.data,
            filename: file.name,
            path: `custom/${file.name}`,
            timestamp: new Date().toISOString(),
            isCustom: true,
            dataUrl: imageDataUrl
          }
        };
        
        return {
          ...prev,
          screenshots: newScreenshots
        };
      });
    };
    
    reader.onerror = () => {
      alert('Failed to read the image file');
    };
    
    reader.readAsDataURL(file);
  };

  // Handle deleting a screenshot
  const handleDeleteScreenshot = (screenshotIndex: number) => {
    const screenshot = analysisData.screenshots?.[screenshotIndex];
    if (!screenshot) return;

    const pageName = screenshot.data?.customPageName || 
                    (screenshot.data?.isCustom ? 'Custom Page' :
                     new URL(screenshot.url).pathname === '/' ? 'Homepage' : 
                     new URL(screenshot.url).pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ')?.replace(/\b\w/g, l => l.toUpperCase()) || 'Page');

    if (confirm(`Are you sure you want to delete the screenshot for "${pageName}"?`)) {
      setAnalysisData(prev => {
        if (!prev.screenshots) return prev;
        
        const newScreenshots = prev.screenshots.filter((_, index) => index !== screenshotIndex);
        
        return {
          ...prev,
          screenshots: newScreenshots
        };
      });

      // If we're viewing this screenshot in the modal, close the modal
      if (selectedScreenshotIndex === screenshotIndex) {
        setSelectedScreenshotIndex(null);
      } else if (selectedScreenshotIndex !== null && selectedScreenshotIndex > screenshotIndex) {
        // Adjust the selected index if we deleted a screenshot before the currently selected one
        setSelectedScreenshotIndex(prev => prev !== null ? prev - 1 : null);
      }
    }
  };

  // Handle adding a new screenshot - now with form
  const handleAddNewScreenshot = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Store the file and show the form
    setPendingFile(file);
    setShowAddForm(true);
  };

  // Complete adding new screenshot with page info
  const completeAddNewScreenshot = useCallback(() => {
    if (!pendingFile || !newPageData.name.trim()) {
      alert('Please provide a page name');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string;
      if (!imageDataUrl) {
        alert('Failed to read the image file');
        return;
      }
      
      // Create URL if not provided
      const pageUrl = newPageData.url.trim() || `https://custom-page-${Date.now()}.com`;
      
      const newScreenshot: Screenshot = {
        url: pageUrl,
        success: true,
        data: {
          filename: pendingFile.name,
          path: `custom/${pendingFile.name}`,
          timestamp: new Date().toISOString(),
          isCustom: true,
          dataUrl: imageDataUrl,
          customPageName: newPageData.name.trim()
        },
        error: null
      };

      setAnalysisData(prev => ({
        ...prev,
        screenshots: [...(prev.screenshots || []), newScreenshot]
      }));

      // Reset form
      setShowAddForm(false);
      setNewPageData({ name: '', url: '' });
      setPendingFile(null);
    };
    
    reader.onerror = () => {
      alert('Failed to read the image file');
    };
    
    reader.readAsDataURL(pendingFile);
  }, [pendingFile, newPageData]);

  // Handle edit button click
  const handleEditClick = (index: number) => {
    setEditingScreenshot(index);
    editingScreenshotRef.current = index;
    // Small delay to ensure state is set before triggering file input
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 10);
  };

  // Handle add button click
  const handleAddClick = () => {
    setIsAddingNew(true);
    isAddingNewRef.current = true;
    // Small delay to ensure state is set before triggering file input
    setTimeout(() => {
      addFileInputRef.current?.click();
    }, 10);
  };

  // Reset states after file operations
  const resetFileStates = () => {
    setEditingScreenshot(null);
    setIsAddingNew(false);
    editingScreenshotRef.current = null;
    isAddingNewRef.current = false;
    
    // Clear file input values
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (addFileInputRef.current) {
      addFileInputRef.current.value = '';
    }
  };

  // Handle keyboard navigation for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedScreenshotIndex === null || !analysisData.screenshots) return;
      
      switch (e.key) {
        case 'Escape':
          setSelectedScreenshotIndex(null);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setSelectedScreenshotIndex(prev => 
            prev !== null && prev > 0 ? prev - 1 : prev
          );
          break;
        case 'ArrowRight':
          e.preventDefault();
          setSelectedScreenshotIndex(prev => 
            prev !== null && prev < analysisData.screenshots!.length - 1 ? prev + 1 : prev
          );
          break;
      }
    };

    if (selectedScreenshotIndex !== null) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [selectedScreenshotIndex, analysisData.screenshots]);

  // Screenshot Modal Component
  const ScreenshotModal = ({ index, screenshots, jobId, onClose, onNext, onPrev }: {
    index: number;
    screenshots: Screenshot[];
    jobId: string;
    onClose: () => void;
    onNext: () => void;
    onPrev: () => void;
  }) => {
    const screenshot = screenshots[index];
    const imageUrl = getScreenshotUrl(screenshot, jobId);
    const canGoPrev = index > 0;
    const canGoNext = index < screenshots.length - 1;

    return (
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div 
          className="relative bg-white rounded-lg shadow-2xl max-w-7xl max-h-[90vh] w-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 truncate">
                {screenshot.data?.customPageName || screenshot.url}
              </h3>
              <p className="text-sm text-slate-600">
                Screenshot {index + 1} of {screenshots.length}
                {screenshot.success && screenshot.data && (
                  <span className="ml-2 text-slate-400">
                    • {screenshot.data.isCustom ? 'Custom Upload' : screenshot.data.filename}
                    {screenshot.data.isCustom && (
                      <span className="ml-1 text-green-600">✓</span>
                    )}
                  </span>
                )}
              </p>
            </div>
            
            {/* Navigation and Close */}
            <div className="flex items-center gap-2 ml-4">
              <Button
                onClick={onPrev}
                disabled={!canGoPrev}
                variant="outline"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <Button
                onClick={onNext}
                disabled={!canGoNext}
                variant="outline"
                size="sm"
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => handleDeleteScreenshot(index)}
                variant="outline"
                size="sm"
                className="ml-2 border-red-200 text-red-600 hover:bg-red-50"
                title="Delete screenshot"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                size="sm"
                className="ml-2"
              >
                ✕
              </Button>
            </div>
          </div>

          {/* Image Container */}
          <div className="relative overflow-auto max-h-[calc(90vh-120px)]">
            {imageUrl ? (
              <img 
                src={imageUrl}
                alt={`Full screenshot of ${screenshot.url}`}
                className="w-full h-auto"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div class="flex flex-col items-center justify-center h-64 text-slate-400 p-8">
                        <svg class="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        <p class="text-lg font-medium text-center">Image Not Available</p>
                        <p class="text-sm text-center mt-1">Failed to load screenshot</p>
                      </div>
                    `;
                  }
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 p-8">
                <ImageOff className="w-16 h-16 mb-4" />
                <p className="text-lg font-medium text-center">Image Not Available</p>
                <p className="text-sm text-center mt-1">No screenshot data available</p>
              </div>
            )}
          </div>

          {/* Footer with metadata */}
          {screenshot.success && screenshot.data && (
            <div className="border-t border-slate-200 bg-slate-50 p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {screenshot.data.timestamp && (
                  <div>
                    <span className="font-medium text-slate-700">
                      {screenshot.data.isCustom ? 'Uploaded:' : 'Captured:'}
                    </span>
                    <p className="text-slate-600">
                      {new Date(screenshot.data.timestamp).toLocaleString()}
                    </p>
                  </div>
                )}
                {screenshot.data.duration_ms && !screenshot.data.isCustom && (
                  <div>
                    <span className="font-medium text-slate-700">Duration:</span>
                    <p className="text-slate-600">
                      {(screenshot.data.duration_ms / 1000).toFixed(2)}s
                    </p>
                  </div>
                )}
                {screenshot.data.viewport && !screenshot.data.isCustom && (
                  <div>
                    <span className="font-medium text-slate-700">Viewport:</span>
                    <p className="text-slate-600">
                      {screenshot.data.viewport.width} × {screenshot.data.viewport.height}
                    </p>
                  </div>
                )}
                <div>
                  <span className="font-medium text-slate-700">Type:</span>
                  <p className={`font-medium ${screenshot.data.isCustom ? 'text-green-600' : 'text-blue-600'}`}>
                    {screenshot.data.isCustom ? 'Custom Upload' : 'Auto Captured'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Memoized handlers to prevent re-renders
  const handleUrlChange = useCallback((url: string) => {
    setAnalysisData(prev => ({ ...prev, websiteUrl: url }));
  }, []);

  const handleOrgChange = useCallback((name: string) => {
    setAnalysisData(prev => ({ ...prev, organizationName: name }));
  }, []);

  const handlePurposeChange = useCallback((purpose: string) => {
    setAnalysisData(prev => ({ ...prev, sitePurpose: purpose }));
  }, []);

  const startCapture = async (url: string) => {
    const validation = validateAndNormalizeUrl(url);
    
    if (!validation.isValid) {
      setError(validation.error || 'Please enter a valid website URL');
      return false;
    }

    // Update the URL in state if it was normalized (had https:// added)
    if (validation.normalizedUrl !== url) {
      setAnalysisData(prev => ({ ...prev, websiteUrl: validation.normalizedUrl }));
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl: validation.normalizedUrl,
          options: {
            maxPages: 10,
            timeout: 15000,
            concurrency: 3,
            fastMode: true
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to start capture process: ${errorText}`);
      }

      const result = await response.json();
      setAnalysisData(prev => ({ ...prev, captureJobId: result.jobId }));
      setCaptureJob({ 
        id: result.jobId, 
        status: result.status,
        progress: { stage: 'starting', percentage: 0, message: 'Starting capture...' }
      });
      setCaptureStarted(true);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start capture';
      console.error('Capture start error:', errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextFromURL = async () => {
    const success = await startCapture(analysisData.websiteUrl);
    if (success) {
      setCurrentStep(2);
    }
  };

  const handleNextFromOrg = () => {
    if (analysisData.organizationName.trim()) {
      setCurrentStep(3);
    }
  };

  const handleNextFromPurpose = () => {
    if (analysisData.sitePurpose.trim()) {
      if (captureJob?.status === 'completed') {
        setCurrentStep(5);
      } else if (captureJob?.status === 'failed') {
        setError(captureJob.error || 'Capture process failed');
      } else {
        setCurrentStep(4);
      }
    }
  };

  const ProcessingStep = () => (
    <Card className="border-slate-200 bg-white shadow-lg">
      <CardHeader className="text-center pb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Camera className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-semibold">Capturing Screenshots</CardTitle>
        <p className="text-slate-600 mt-2">
          We're just finishing up the website capture process. This should only take a moment more.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {captureJob && (
          <>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700">Progress</span>
                <span className="text-sm text-slate-500">{captureJob.progress.percentage}%</span>
              </div>
              <Progress value={captureJob.progress.percentage} className="h-2" />
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-2">
                  {captureJob.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : captureJob.status === 'failed' ? (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  ) : (
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  )}
                  <Badge variant={
                    captureJob.status === 'completed' ? 'default' :
                    captureJob.status === 'failed' ? 'destructive' : 'secondary'
                  }>
                    {captureJob.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-slate-600">{captureJob.progress.message}</p>
            </div>

            {captureJob.status === 'failed' && captureJob.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{captureJob.error}</p>
                <Button 
                  onClick={() => setCurrentStep(1)}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                onClick={() => setCurrentStep(3)}
                variant="outline"
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={() => setCurrentStep(5)}
                disabled={captureJob.status !== 'completed'}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {captureJob.status === 'completed' ? (
                  <>
                    View Results
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 mr-2" />
                    Please Wait...
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  const ScreenshotReviewStep = () => (
    <Card className="border-slate-200 bg-white shadow-lg w-full">
      <CardHeader className="text-center pb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-semibold">Review & Edit Screenshots</CardTitle>
        <p className="text-slate-600 mt-2">
          Review the captured screenshots and customize them as needed. Click any screenshot to view full size, click the link icon to open the URL, or use the edit/delete buttons in each card's footer.
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Use arrow keys to navigate between screenshots, ESC to close modal
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {analysisData.screenshots && analysisData.screenshots.length > 0 ? (
          <>
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-slate-900">Analysis Summary</h4>
              <div className="text-sm text-slate-600 space-y-1">
                <p><strong>Website:</strong> {analysisData.websiteUrl}</p>
                <p><strong>Organization:</strong> {analysisData.organizationName}</p>
                <p><strong>Purpose:</strong> {analysisData.sitePurpose}</p>
                <p><strong>Pages Captured:</strong> {analysisData.screenshots.length}</p>
              </div>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {analysisData.screenshots.map((screenshot, index) => {
                const screenshotUrl = screenshot.url || `Page ${index + 1}`;
                const imageUrl = analysisData.captureJobId ? getScreenshotUrl(screenshot, analysisData.captureJobId) : '';
                
                return (
                  <div 
                    key={index} 
                    className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow group relative"
                  >
                    {/* URL Title */}
                    <div className="p-4 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Open the URL for both regular and custom screenshots
                            if (screenshotUrl.startsWith('http')) {
                              window.open(screenshotUrl, '_blank', 'noopener,noreferrer');
                            }
                          }}
                          disabled={!screenshotUrl.startsWith('http')}
                          className={`flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center transition-all ${
                            screenshotUrl.startsWith('http')
                              ? 'hover:bg-blue-200 hover:scale-105 cursor-pointer' 
                              : 'opacity-50 cursor-not-allowed'
                          }`}
                          title={
                            screenshotUrl.startsWith('http')
                              ? `Open ${screenshotUrl} in new tab`
                              : 'No valid URL available'
                          }
                        >
                          <ExternalLink className="w-4 h-4 text-blue-600" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-slate-900 text-sm leading-tight">
                            {screenshot.data?.isCustom ? 'Custom Page' :
                             new URL(screenshotUrl).pathname === '/' ? 'Homepage' : 
                             new URL(screenshotUrl).pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ')?.replace(/\b\w/g, l => l.toUpperCase()) || 'Page'
                            }
                          </h3>
                        </div>
                      </div>
                    </div>

                    {/* Screenshot Image */}
                    <div 
                      className="aspect-video bg-slate-100 relative flex items-center justify-center cursor-pointer"
                      onClick={() => setSelectedScreenshotIndex(index)}
                    >
                      {imageUrl ? (
                        <>
                          <img 
                            src={imageUrl}
                            alt={`Screenshot of ${screenshotUrl}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              console.error('Image failed to load:', {
                                originalSrc: target.src,
                                screenshot: screenshot,
                                screenshotData: screenshot.success ? screenshot.data : null,
                                jobId: analysisData.captureJobId
                              });
                              
                              // Show placeholder immediately without retries
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `
                                  <div class="flex flex-col items-center justify-center h-full text-slate-400 p-4">
                                    <svg class="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                    <span class="text-sm text-center">Image Not Available</span>
                                  </div>
                                `;
                              }
                            }}
                            onLoad={() => {
                              console.log('Image loaded successfully:', imageUrl);
                            }}
                          />
                          {/* View overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2">
                              <span className="text-sm font-medium text-slate-700">Click to view full size</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                          <ImageOff className="w-12 h-12 mb-2" />
                          <span className="text-sm">No preview available</span>
                        </div>
                      )}

                      {/* Custom indicator */}
                      {screenshot.success && screenshot.data?.isCustom && (
                        <div className="absolute top-3 left-3 bg-green-100 border border-green-200 rounded-full px-2 py-1 flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-green-700 font-medium">Custom</span>
                        </div>
                      )}
                    </div>

                    {/* Footer with URL and Actions */}
                    <div className="p-3 bg-slate-50 border-t border-slate-100">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <Globe className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
                          <span className="text-xs text-slate-600 font-mono break-all leading-relaxed">
                            {screenshotUrl}
                          </span>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(index);
                            }}
                            className="w-7 h-7 bg-white border border-slate-200 rounded-md flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 transition-all"
                            title="Replace screenshot"
                          >
                            <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteScreenshot(index);
                            }}
                            className="w-7 h-7 bg-white border border-red-200 rounded-md flex items-center justify-center hover:bg-red-50 hover:border-red-300 transition-all"
                            title="Delete screenshot"
                          >
                            <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Add Screenshot Card */}
              <div 
                className="border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 hover:border-slate-400 transition-colors cursor-pointer group"
                onClick={handleAddClick}
              >
                {/* Add Title */}
                <div className="p-4 pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-slate-200 group-hover:bg-slate-300 rounded-lg flex items-center justify-center transition-colors">
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-600 group-hover:text-slate-700 text-sm leading-tight transition-colors">
                        Add Screenshot
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Add Content */}
                <div className="aspect-video flex items-center justify-center">
                  <div className="flex flex-col items-center text-slate-400 group-hover:text-slate-500 transition-colors">
                    <svg className="w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-sm font-medium">Upload Screenshot</span>
                    <span className="text-xs mt-1">Click to select image</span>
                  </div>
                </div>

                {/* Footer for consistency */}
                <div className="p-3 bg-slate-50 border-t border-slate-100">
                  <div className="flex items-start gap-2">
                    <Globe className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-500 font-mono break-all leading-relaxed">
                      Add new page...
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                const currentEditingIndex = editingScreenshotRef.current;
                
                if (file && currentEditingIndex !== null) {
                  handleFileUpload(file, currentEditingIndex);
                }
                // Reset states and clear input
                resetFileStates();
              }}
            />

            <input
              ref={addFileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                const currentIsAddingNew = isAddingNewRef.current;
                
                if (file && currentIsAddingNew) {
                  handleAddNewScreenshot(file);
                }
                // Reset states and clear input
                resetFileStates();
              }}
            />

            <div className="flex gap-3">
              <Button 
                onClick={() => setCurrentStep(3)}
                variant="outline"
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={startAnalysis}
                disabled={!analysisData.screenshots || analysisData.screenshots.length === 0 || isAnalyzing}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-slate-400 disabled:to-slate-400"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting Analysis...
                  </>
                ) : (
                  <>
                    Start LLM Analysis
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Screenshots Available</h3>
            <p className="text-slate-600 mb-4">
              {analysisData.screenshots?.length === 0 ? 
                'All screenshots have been removed. Add new screenshots to continue with the analysis.' :
                'The capture process may have failed or is still in progress.'
              }
            </p>
            <div className="flex gap-3 justify-center">
              <Button 
                onClick={handleAddClick}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Add Screenshot
              </Button>
              <Button onClick={() => setCurrentStep(1)} variant="outline">
                Start Over
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Analysis Waiting Step Component
  const AnalysisWaitingStep = () => (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="text-center pb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
        <CardTitle className="text-2xl text-slate-900 mb-2">Analyzing Your Website</CardTitle>
        <p className="text-slate-600">
          Our AI is analyzing your website screenshots and running comprehensive audits. This may take a few minutes.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {analysisJob && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700">
                {analysisJob.progress?.stage?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Processing'}
              </span>
              <span className="text-sm text-slate-500">
                {analysisJob.progress?.percentage || 0}%
              </span>
            </div>
            <Progress value={analysisJob.progress?.percentage || 0} className="h-2" />
            <p className="text-sm text-slate-600 text-center">
              {analysisJob.progress?.message || 'Processing...'}
            </p>
          </div>
        )}

        <div className="bg-slate-50 rounded-lg p-4 space-y-2">
          <h4 className="font-medium text-slate-900">What we're analyzing:</h4>
          <div className="text-sm text-slate-600 space-y-1">
            <p><strong>Website:</strong> {analysisData.websiteUrl}</p>
            <p><strong>Organization:</strong> {analysisData.organizationName}</p>
            <p><strong>Screenshots:</strong> {analysisData.screenshots?.length || 0} pages</p>
          </div>
        </div>

        <div className="text-center">
          <Button 
            onClick={() => setCurrentStep(5)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Screenshots
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Analysis Results Step Component
  const AnalysisResultsStep = () => (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="text-center pb-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <CardTitle className="text-2xl text-slate-900 mb-2">Analysis Complete!</CardTitle>
        <p className="text-slate-600">
          Your website analysis has been completed successfully. View your comprehensive report below.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {analysisJob?.results && (
          <div className="space-y-4">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h4 className="font-medium text-green-900 mb-2">✅ Analysis Summary</h4>
              <div className="text-sm text-green-800 space-y-1">
                <p><strong>Website:</strong> {analysisData.websiteUrl}</p>
                <p><strong>Organization:</strong> {analysisData.organizationName}</p>
                <p><strong>Pages Analyzed:</strong> {analysisData.screenshots?.length || 0}</p>
                <p><strong>Report Generated:</strong> {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {analysisJob.results.reportPath && (
              <div className="text-center">
                <Button 
                  onClick={() => {
                    // Open the HTML report
                    const reportUrl = analysisJob.results!.reportPath!.replace(/\\/g, '/');
                    window.open(`file://${reportUrl}`, '_blank');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Complete Report
                </Button>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-slate-50 rounded-lg p-4">
                <h5 className="font-medium text-slate-900 mb-2">Lighthouse Audit</h5>
                <p className="text-sm text-slate-600">
                  {analysisJob.results.lighthouse?.success ? '✅ Completed' : '❌ Failed'}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <h5 className="font-medium text-slate-900 mb-2">AI Analysis</h5>
                <p className="text-sm text-slate-600">
                  {analysisJob.results.llmAnalysis?.success ? '✅ Completed' : '❌ Failed'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button 
            onClick={() => setCurrentStep(5)}
            variant="outline"
            className="flex-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Screenshots
          </Button>
          <Button 
            onClick={() => {
              // Reset wizard for new analysis
              setCurrentStep(1);
              setAnalysisData({
                websiteUrl: '',
                organizationName: '',
                sitePurpose: ''
              });
              setCaptureJob(null);
              setAnalysisJob(null);
              setCaptureStarted(false);
              setIsAnalyzing(false);
              setError(null);
            }}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            Start New Analysis
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <URLInputStep
            websiteUrl={analysisData.websiteUrl}
            onUrlChange={handleUrlChange}
            onNext={handleNextFromURL}
            isLoading={isLoading}
            error={error}
          />
        );
      case 2:
        return (
          <OrganizationStep
            organizationName={analysisData.organizationName}
            onOrgChange={handleOrgChange}
            onNext={handleNextFromOrg}
            onBack={() => setCurrentStep(1)}
            captureJob={captureJob}
            captureStarted={captureStarted}
          />
        );
      case 3:
        return (
          <PurposeStep
            sitePurpose={analysisData.sitePurpose}
            onPurposeChange={handlePurposeChange}
            onNext={handleNextFromPurpose}
            onBack={() => setCurrentStep(2)}
            captureJob={captureJob}
            captureStarted={captureStarted}
          />
        );
      case 4:
        return <ProcessingStep />;
      case 5:
        return <ScreenshotReviewStep />;
      case 6:
        return <AnalysisWaitingStep />;
      case 7:
        return <AnalysisResultsStep />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between overflow-x-auto">
          {WIZARD_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            const isAccessible = currentStep >= step.id;

            return (
              <div key={step.id} className="flex flex-col items-center relative min-w-0 flex-1">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-green-600 text-white' 
                      : isActive 
                        ? 'bg-blue-600 text-white' 
                        : isAccessible
                          ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Icon className={`w-5 h-5 ${isActive && (step.id === 4 || step.id === 6) ? 'animate-spin' : ''}`} />
                  )}
                </div>
                <span className={`text-xs mt-2 font-medium text-center px-1 ${
                  isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-slate-500'
                }`}>
                  {step.title}
                </span>
                {index < WIZARD_STEPS.length - 1 && (
                  <div className={`absolute top-5 left-12 w-full h-0.5 ${
                    currentStep > step.id ? 'bg-green-600' : 'bg-slate-200'
                  }`} style={{ width: 'calc(100% - 1.5rem)' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="transition-all duration-300 ease-in-out">
        {renderStepContent()}
      </div>

      {/* Add Page Modal */}
      <AddPageModal
        isOpen={showAddForm}
        newPageData={newPageData}
        onPageDataChange={handlePageDataChange}
        onCancel={handleModalCancel}
        onConfirm={completeAddNewScreenshot}
      />

      {/* Screenshot Modal */}
      {selectedScreenshotIndex !== null && analysisData.screenshots && analysisData.captureJobId && (
        <ScreenshotModal
          index={selectedScreenshotIndex}
          screenshots={analysisData.screenshots}
          jobId={analysisData.captureJobId}
          onClose={() => setSelectedScreenshotIndex(null)}
          onNext={() => setSelectedScreenshotIndex(prev => 
            prev !== null && prev < analysisData.screenshots!.length - 1 ? prev + 1 : prev
          )}
          onPrev={() => setSelectedScreenshotIndex(prev => 
            prev !== null && prev > 0 ? prev - 1 : prev
          )}
        />
      )}
    </div>
  );
}