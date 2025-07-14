/**
 * Login Page - User Authentication Entry Point
 * 
 * Simple page component that renders the login form for user
 * authentication. Provides entry point to the application.
 * 
 * @responsibilities
 * - Renders login form component
 * - Serves as authentication entry point
 * - Handles user login flow initiation
 */

import { LoginForm } from '@/features/auth';

export default function LoginPage() {
  return <LoginForm />;
}