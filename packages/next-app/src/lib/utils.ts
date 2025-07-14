/**
 * Utility Functions - Core Application Helpers
 * 
 * Collection of utility functions for common operations including
 * class name merging, formatting, data transformation, and
 * shared logic used across components.
 * 
 * @responsibilities
 * - Provides className merging with Tailwind CSS support
 * - Implements data formatting and transformation utilities
 * - Offers date and time formatting functions
 * - Contains string manipulation and validation helpers
 * - Provides consistent utility patterns across the app
 */


import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
