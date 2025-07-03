"use client";

import React from 'react';
import Link from 'next/link';
import { AnalysisWizard } from '@/components/analysis-wizard';
import { ArrowLeft, TestTube } from 'lucide-react';

export default function TestAnalysisPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with back link */}
        <div className="mb-8">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors duration-200 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
        </div>

        {/* Page Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <TestTube className="w-4 h-4" />
            Test Environment
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Test Analysis Wizard
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Test the complete analysis workflow with screenshot capture and AI analysis
          </p>
        </div>

        {/* Information Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">🧪 Testing Instructions</h3>
          <div className="text-blue-800 space-y-2">
            <p><strong>Prerequisites:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Capture service running on port 3001</li>
              <li>ANTHROPIC_API_KEY set in environment variables</li>
              <li>Analysis service properly configured</li>
            </ul>
            <p className="mt-4"><strong>What this tests:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>URL validation and capture job creation</li>
              <li>Screenshot capture process with real-time progress</li>
              <li>Analysis triggering and progress tracking</li>
              <li>Complete end-to-end workflow</li>
            </ul>
          </div>
        </div>

        {/* Wizard Component */}
        <AnalysisWizard />
      </div>
    </div>
  );
}