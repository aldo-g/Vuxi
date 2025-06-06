import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Import your page components
import Home from "./pages/Home";
import ReportList from "./pages/ReportList";
import Index from "./pages/Index";
import PageAnalysis from "./pages/PageAnalysis";
import ConductAnalysis from "./pages/ConductAnalysis";
import ReviewScreenshots from "./pages/ReviewScreenshots";
import NotFound from "./pages/NotFound";
import CreateAccount from './pages/CreateAccount';
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login"; // Import the new Login page

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Landing & Auth Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/create-account" element={<CreateAccount />} />
          <Route path="/login" element={<Login />} /> {/* Use the new Login component */}

          {/* Main App Routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/conduct-analysis" element={<ConductAnalysis />} />
          <Route path="/review-screenshots" element={<ReviewScreenshots />} />

          {/* Report Viewing Routes */}
          <Route path="/reports" element={<ReportList />} />
          <Route path="/report/:reportId" element={<Index />} />
          <Route path="/report/:reportId/page/:pageId" element={<PageAnalysis />} />
          
          {/* Catch-all route for 404 Not Found pages */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;