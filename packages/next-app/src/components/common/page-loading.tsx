/**
 * Page Loading Component - Full Page Loading State
 * 
 * Full-page loading component that displays during page transitions
 * and initial data loading. Provides user feedback during longer
 * loading operations.
 * 
 * @responsibilities
 * - Shows full-page loading overlay
 * - Provides loading text and progress indication
 * - Maintains layout during loading states
 * - Ensures smooth loading transitions
 * - Handles accessibility during loading
 */

import { Loader2 } from "lucide-react";

interface PageLoadingProps {
  message?: string;
}

export function PageLoading({ message = "Loading..." }: PageLoadingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xl text-slate-700">{message}</p>
      </div>
    </div>
  );
}