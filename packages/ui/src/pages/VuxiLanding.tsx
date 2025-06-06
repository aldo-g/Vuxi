// src/pages/VuxiLanding.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlayCircle, Zap, Scale, BarChart2, ArrowRight } from 'lucide-react';

const VuxiLanding = () => {
  // In a real app, this would come from a context or auth hook.
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    // --- STYLE CHANGE: Dark theme background and white text ---
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <header className="py-4 px-6 sm:px-10 flex justify-between items-center w-full">
        <div className="text-2xl font-bold">
          Vuxi
        </div>
        <nav>
          {!isLoggedIn && (
            <Link 
              to="/login" 
              // --- STYLE CHANGE: Lighter text for dark background ---
              className="text-slate-300 hover:text-white font-medium transition-colors duration-200"
            >
              Log In
            </Link>
          )}
        </nav>
      </header>

      {/* Main content area */}
      {/* --- LAYOUT CHANGE: Reduced vertical padding to prevent scrolling --- */}
      <main className="flex-grow flex flex-col justify-center text-center px-4">
        <h1 className="text-5xl md:text-6xl font-extrabold">
          Uncover the 'Why' Behind Your UX
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg text-slate-400">
          Vuxi provides AI-driven analysis of your website's user experience,
          turning screenshots and user flows into actionable, expert-level reports.
        </p>
        <div className="mt-10">
          {isLoggedIn ? (
            <Link to="/conduct-analysis">
              {/* --- STYLE CHANGE: Using original gradient button style --- */}
              <Button size="lg" className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-3 px-8 text-lg shadow-lg hover:shadow-indigo-500/50 transition-shadow">
                <PlayCircle className="mr-2 h-5 w-5" />
                Start New Analysis
              </Button>
            </Link>
          ) : (
            <Link to="/create-account">
              <Button size="lg" className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-3 px-8 text-lg shadow-lg hover:shadow-indigo-500/50 transition-shadow">
                Create Account to Start
              </Button>
            </Link>
          )}
        </div>

        {/* Features Section */}
        {/* --- LAYOUT CHANGE: Reduced vertical padding --- */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <div className="grid md:grid-cols-3 gap-10 text-center">
            <div className="feature-item">
              <div className="mb-4 inline-block p-3 bg-slate-800 rounded-full border border-slate-700">
                <Zap className="h-6 w-6 text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">1. Crawl & Capture</h3>
              <p className="text-slate-400 text-sm">Vuxi automatically discovers and screenshots the pages of your website.</p>
            </div>
            <div className="feature-item">
              <div className="mb-4 inline-block p-3 bg-slate-800 rounded-full border border-slate-700">
                <Scale className="h-6 w-6 text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">2. AI-Powered Analysis</h3>
              <p className="text-slate-400 text-sm">Our models analyze each page against UX best practices and your stated goals.</p>
            </div>
            <div className="feature-item">
              <div className="mb-4 inline-block p-3 bg-slate-800 rounded-full border border-slate-700">
                <BarChart2 className="h-6 w-6 text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">3. Actionable Reporting</h3>
              <p className="text-slate-400 text-sm">Receive a comprehensive report with prioritized recommendations.</p>
            </div>
          </div>
          
          {/* --- LAYOUT CHANGE: "See Example" link moved here --- */}
          <div className="mt-12">
              <Link to="/reports" className="group inline-flex items-center justify-center text-slate-400 hover:text-white transition-colors duration-200">
                  <span>or see an example report</span>
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VuxiLanding;