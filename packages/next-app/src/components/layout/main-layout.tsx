/**
 * Main Layout Component - Application Shell
 * 
 * Primary layout wrapper that provides consistent page structure
 * across the application. Includes header navigation and main
 * content area with responsive design.
 * 
 * @responsibilities
 * - Provides consistent page structure (header + main content)
 * - Manages responsive layout and spacing
 * - Conditionally shows/hides user navigation
 * - Establishes flex-based layout system
 * - Handles title display and navigation state
 */

import { Header } from "./header";

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  showUserNav?: boolean;
}

export function MainLayout({ 
  children, 
  title, 
  showUserNav = true 
}: MainLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header title={title} showUserNav={showUserNav} />
      <main className="flex-1 p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
}