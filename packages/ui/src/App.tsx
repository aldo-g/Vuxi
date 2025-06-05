import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Import your page components
import VuxiLanding from "./pages/VuxiLanding";         // Vuxi Landing Page
import ReportList from "./pages/ReportList";           // Lists all reports
import Index from "./pages/Index";                     // Report Detail Overview
import PageAnalysis from "./pages/PageAnalysis";       // Individual Page Analysis
import ConductAnalysis from "./pages/ConductAnalysis";   // Form to start new analysis
import ReviewScreenshots from "./pages/ReviewScreenshots"; // New: Page to review screenshots
import NotFound from "./pages/NotFound";                 // For handling 404 errors

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Route for the new Vuxi Landing Page */}
          <Route path="/" element={<VuxiLanding />} />

          {/* Route to list all available reports */}
          <Route path="/reports" element={<ReportList />} />

          {/* Route to display the overview of a specific report run */}
          <Route path="/report/:reportId" element={<Index />} />

          {/* Route to display the detailed analysis of a specific page within a specific report run */}
          <Route path="/report/:reportId/page/:pageId" element={<PageAnalysis />} />

          {/* Route for the new Conduct Analysis page (form) */}
          <Route path="/conduct-analysis" element={<ConductAnalysis />} />

          {/* Route for reviewing screenshots after URL discovery and capture */}
          <Route path="/review-screenshots" element={<ReviewScreenshots />} />

          {/* Catch-all route for 404 Not Found pages */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;