// src/pages/VuxiLanding.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlayCircle, Zap, Scale, BarChart2, ArrowRight } from 'lucide-react';

const VuxiLanding = () => {
  // In a real app, this would come from a context or auth hook.
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Header */}
      <header className="py-6 px-6 sm:px-10 flex justify-between items-center w-full">
        <div className="text-3xl font-bold text-slate-900">
          Vuxi
        </div>
        <nav>
          {!isLoggedIn && (
            <Link 
              to="/login"
              className="text-slate-600 hover:text-indigo-700 font-medium transition-colors duration-200"
            >
              Log In
            </Link>
          )}
        </nav>
      </header>

      {/* Main content area */}
      <main className="flex-grow flex flex-col justify-center text-center px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="mb-20">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-6 py-3 rounded-2xl text-sm font-semibold mb-8 border border-blue-100 shadow-sm">
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></div>
              AI-Powered UX Analysis
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 tracking-tight leading-tight">
              Uncover the 'Why' Behind Your UX
            </h1>
            
            <p className="mt-6 max-w-3xl mx-auto text-xl text-slate-600 leading-relaxed">
              Vuxi provides AI-driven analysis of your website's user experience,
              turning screenshots and user flows into actionable, expert-level reports.
            </p>
            
            <div className="mt-10">
              {isLoggedIn ? (
                <Link to="/conduct-analysis">
                  <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 px-8 text-lg shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
                    <PlayCircle className="mr-2 h-5 w-5" />
                    Start New Analysis
                  </Button>
                </Link>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Link to="/create-account">
                    <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 px-8 text-lg shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
                      Create Account
                    </Button>
                  </Link>
                  <Link to="/reports" className="group inline-flex items-center justify-center text-slate-600 hover:text-indigo-700 transition-colors duration-200 font-medium">
                    <span>or view example reports</span>
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/70 p-8 shadow-lg hover:shadow-xl transition-all duration-300 text-center">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">1. Crawl & Capture</h3>
                <p className="text-slate-600 leading-relaxed">
                  Vuxi automatically discovers and screenshots the pages of your website, creating a comprehensive visual inventory.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/70 p-8 shadow-lg hover:shadow-xl transition-all duration-300 text-center">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Scale className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">2. AI-Powered Analysis</h3>
                <p className="text-slate-600 leading-relaxed">
                  Our advanced models analyze each page against UX best practices and your stated business goals.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/70 p-8 shadow-lg hover:shadow-xl transition-all duration-300 text-center">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <BarChart2 className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">3. Actionable Reporting</h3>
                <p className="text-slate-600 leading-relaxed">
                  Receive comprehensive reports with prioritized recommendations and clear implementation guidance.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VuxiLanding;