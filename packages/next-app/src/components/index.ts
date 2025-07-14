/**
 * Component Barrel Exports - Centralized Component Access
 * 
 * Main entry point for all application components providing
 * organized access to layout, common, form, dashboard, and UI
 * components through a single import path.
 * 
 * @responsibilities
 * - Exports all layout components (header, main-layout, user-nav)
 * - Provides access to common utilities (loading, error handling)
 * - Exports form components for user interactions
 * - Makes dashboard components available
 * - Re-exports UI component library
 * - Maintains legacy exports during migration
 */

// Layout Components
export * from './layout';

// Common Components  
export * from './common';

// Form Components
export * from './forms';

// Dashboard Components
export * from './dashboard';

// UI Components (re-export from ui directory)
export * from './ui';

// Legacy exports (will be removed after migration)
export { DashboardClient } from './dashboard-client';