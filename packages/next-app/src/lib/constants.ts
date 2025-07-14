/**
 * Application Constants - Configuration and API Endpoints
 * 
 * Centralized configuration file containing API endpoints,
 * polling intervals, wizard steps, and other application
 * constants used throughout the codebase.
 * 
 * @responsibilities
 * - Defines API endpoint URLs for all services
 * - Sets polling intervals for job status checking
 * - Configures wizard step definitions
 * - Provides timeout and retry configurations
 * - Centralizes environment-dependent settings
 */

import { 
  Globe, 
  Building2, 
  Target, 
  Camera, 
  Loader2, 
  CheckCircle2 
} from 'lucide-react';

// API Endpoints
export const API_ENDPOINTS = {
  CAPTURE: 'http://localhost:3001/api/capture',
  ANALYSIS: 'http://localhost:3002/api/analysis',
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
  },
} as const;

// Wizard Steps with Icon Components
export const WIZARD_STEPS = [
  { id: 1, title: 'Website URL', icon: Globe },
  { id: 2, title: 'Organization', icon: Building2 },
  { id: 3, title: 'Site Purpose', icon: Target },
  { id: 4, title: 'Processing', icon: Camera },
  { id: 5, title: 'Review Captures', icon: CheckCircle2 },
  { id: 6, title: 'Analyzing', icon: Loader2 },
  { id: 7, title: 'Results', icon: CheckCircle2 }
] as const;

// Validation
export const URL_VALIDATION = {
  DOMAIN_REGEX: /^[a-zA-Z0-9.-]+$/,
  MIN_DOMAIN_PARTS: 2,
} as const;

// Polling Intervals
export const POLLING_INTERVALS = {
  CAPTURE_JOB: 2000,
  ANALYSIS_JOB: 2000,
} as const;

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ACCEPTED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
} as const;