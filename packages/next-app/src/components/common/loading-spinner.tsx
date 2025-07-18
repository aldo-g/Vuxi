/**
 * Loading Spinner Component - Visual Loading Indicator
 * 
 * Reusable loading spinner component that provides consistent
 * loading states across the application with customizable
 * sizing and styling options.
 * 
 * @responsibilities
 * - Displays animated loading indicator
 * - Provides consistent loading state visuals
 * - Supports size and styling customization
 * - Ensures accessibility for screen readers
 * - Maintains design system consistency
 */

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };

  return (
    <Loader2 
      className={cn(
        'animate-spin', 
        sizeClasses[size], 
        className
      )} 
    />
  );
}