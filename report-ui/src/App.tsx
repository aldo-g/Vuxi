import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner"; // Keep your existing Sonner import
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Import your page components
import ReportList from "./pages/ReportList"; // New: Page to list all reports
import Index from "./pages/Index";           // Existing: Will become the Report Detail Overview page
import PageAnalysis from "./pages/PageAnalysis"; // Existing: For individual page analysis view
import NotFound from "./pages/NotFound";       // Existing: For handling 404 errors

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner /> {/* Ensure this is your intended Sonner component */}
      <BrowserRouter>
        <Routes>
          {/* Route to list all available reports */}
          <Route path="/" element={<ReportList />} />

          {/* Route to display the overview of a specific report run */}
          {/* The Index component will need to be modified to use `reportId` from URL params */}
          <Route path="/report/:reportId" element={<Index />} />

          {/* Route to display the detailed analysis of a specific page within a specific report run */}
          {/* The PageAnalysis component will need to be modified to use `reportId` and `pageId` from URL params */}
          <Route path="/report/:reportId/page/:pageId" element={<PageAnalysis />} />

          {/* Catch-all route for 404 Not Found pages */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;