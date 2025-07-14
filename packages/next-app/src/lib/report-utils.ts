/**
 * Report Utilities - Data Processing and Display Helpers
 * 
 * Utility functions for processing and displaying report data
 * including score calculations, styling classes, screenshot
 * URL generation, and text formatting.
 * 
 * @responsibilities
 * - Generates score-based styling classes and colors
 * - Calculates progress indicators and status text
 * - Constructs screenshot URLs from job data
 * - Formats section names and page display names
 * - Provides consistent data presentation helpers
 */

import type { Screenshot, CaptureJob } from '@/types';

// Score-related utilities
export const getScoreBoxClasses = (score: number): string => {
  if (score >= 9) return "bg-emerald-100 text-emerald-800 border-emerald-300";
  if (score >= 7) return "bg-green-100 text-green-800 border-green-300";
  if (score >= 6) return "bg-lime-100 text-lime-800 border-lime-300";
  if (score >= 5) return "bg-yellow-100 text-yellow-800 border-yellow-300";
  if (score >= 4) return "bg-orange-100 text-orange-800 border-orange-300";
  if (score >= 2) return "bg-red-100 text-red-700 border-red-300";
  return "bg-red-200 text-red-900 border-red-400";
};

export const getOverallScoreStatusText = (score: number): string => {
  if (score >= 8) return "Excellent";
  if (score >= 6) return "Good";
  return "Needs Improvement";
};

export const getProgressColorClass = (score: number): string => {
  if (score >= 8) return "bg-emerald-500";
  if (score >= 6) return "bg-green-500";
  if (score >= 4) return "bg-amber-500";
  return "bg-red-500";
};

export const getScoreColorTextClass = (score: number): string => {
  if (score >= 8) return "text-emerald-600";
  if (score >= 6) return "text-green-600";
  if (score >= 4) return "text-amber-600";
  return "text-red-600";
};

// Screenshot utilities
export const getScreenshotUrl = (screenshot: Screenshot, jobId: string): string => {
  const baseUrl = `http://localhost:3001/data/job_${jobId}`;
  
  const screenshotData = screenshot.success ? screenshot.data : null;
  
  if (!screenshotData) {
    return `${baseUrl}/screenshots/desktop/placeholder.png`;
  }

  // Check if this is a custom uploaded image
  if (screenshotData.isCustom && screenshotData.dataUrl) {
    return screenshotData.dataUrl;
  }
  
  // Priority 1: Use the path directly from the service data
  if (screenshotData.path && typeof screenshotData.path === 'string') {
    const url = `${baseUrl}/screenshots/${screenshotData.path}`;
    return url;
  }
  
  // Priority 2: Use filename with the correct directory structure
  if (screenshotData.filename && typeof screenshotData.filename === 'string') {
    const url = `${baseUrl}/screenshots/desktop/${screenshotData.filename}`;
    return url;
  }
  
  // Priority 3: Fallback to placeholder
  return `${baseUrl}/screenshots/desktop/placeholder.png`;
};

// Text formatting utilities
export const formatSectionName = (key: string): string => {
  return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export const getPageDisplayName = (url: string, customName?: string): string => {
  if (customName) return customName;
  
  try {
    const urlObj = new URL(url);
    if (urlObj.pathname === '/') return 'Homepage';
    
    return urlObj.pathname
      .split('/')
      .filter(Boolean)
      .pop()
      ?.replace(/-/g, ' ')
      ?.replace(/\b\w/g, l => l.toUpperCase()) || 'Page';
  } catch {
    return 'Page';
  }
};

// Report data utilities
export const extractPageRoleAnalysis = (content: string | undefined): string | null => {
  if (!content) return null;
  
  const lines = content.split('\n');
  let pageRoleContent: string[] = [];
  let inPageRoleSection = false;
  const pageRoleKeywords = ['PAGE ROLE ANALYSIS', 'PAGE ROLE:', 'ROLE OF THIS PAGE:'];

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    const upperLine = trimmedLine.toUpperCase();
    
    if (pageRoleKeywords.some(keyword => upperLine.startsWith(keyword))) {
      inPageRoleSection = true;
      const contentAfterKeyword = trimmedLine.substring(upperLine.indexOf(':') + 1).trim();
      if (contentAfterKeyword) pageRoleContent.push(contentAfterKeyword);
    } else if (trimmedLine.startsWith('## ') && inPageRoleSection) {
      if (!pageRoleKeywords.some(keyword => upperLine.startsWith(keyword))) {
        inPageRoleSection = false;
      }
    } else if (inPageRoleSection && trimmedLine && !trimmedLine.toUpperCase().includes('EVIDENCE:')) {
      pageRoleContent.push(trimmedLine);
    }
  });
  
  const result = pageRoleContent.join(' ').trim();
  return result || null;
};