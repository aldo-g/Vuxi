// src/pages/ConductAnalysis.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // Assuming you have a Textarea component
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowLeft, PlayCircle } from 'lucide-react';

const ConductAnalysis = () => {
  const [targetUrl, setTargetUrl] = useState('');
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState('');
  const [orgPurpose, setOrgPurpose] = useState('');
  // Add more states for other parameters if needed, e.g., maxPages

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // For now, just log the data.
    // Later, you would trigger your analysis pipeline here.
    console.log({
      targetUrl,
      orgName,
      orgType,
      orgPurpose,
    });
    alert('Analysis parameters submitted! Check the console for data. (This is a placeholder)');
    // Potentially redirect or show a loading state
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-100 to-slate-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-700 transition-colors duration-200 group"
          >
            <ArrowLeft size={18} className="transform transition-transform duration-200 group-hover:-translate-x-1" />
            Back to Vuxi Home
          </Link>
        </div>

        <Card className="bg-white shadow-2xl rounded-xl border-slate-200/80">
          <CardHeader className="p-6 sm:p-8 bg-slate-50/70 rounded-t-xl border-b border-slate-200/70">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-lg flex items-center justify-center shadow-md">
                    <PlayCircle size={24} />
                </div>
                <div>
                    <CardTitle className="text-2xl sm:text-3xl font-bold text-slate-800">
                    Conduct New Website Analysis
                    </CardTitle>
                    <CardDescription className="text-slate-500 mt-1 text-sm sm:text-base">
                    Enter the details below to start a new UX/UI inspection.
                    </CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="targetUrl" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Target Website URL
                </Label>
                <Input
                  id="targetUrl"
                  type="url"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://example.com"
                  required
                  className="w-full border-slate-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                />
              </div>

              <div>
                <Label htmlFor="orgName" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Organization Name
                </Label>
                <Input
                  id="orgName"
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g., Acme Corp"
                  required
                  className="w-full border-slate-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                />
              </div>

              <div>
                <Label htmlFor="orgType" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Organization Type
                </Label>
                <Input
                  id="orgType"
                  type="text"
                  value={orgType}
                  onChange={(e) => setOrgType(e.target.value)}
                  placeholder="e.g., E-commerce, Non-profit, SaaS"
                  required
                  className="w-full border-slate-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                />
              </div>

              <div>
                <Label htmlFor="orgPurpose" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Organizational Purpose / Website Goal
                </Label>
                <Textarea
                  id="orgPurpose"
                  value={orgPurpose}
                  onChange={(e) => setOrgPurpose(e.target.value)}
                  rows={3}
                  placeholder="e.g., To sell products online and increase brand awareness."
                  required
                  className="w-full border-slate-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                />
                 <p className="mt-1.5 text-xs text-slate-500">
                  Describe the main goal of the website (e.g., convert visitors, generate leads, provide information).
                </p>
              </div>

              {/* You can add more fields here based on ANALYSIS_OPTIONS from batch_analyzer.js */}
              {/* For example:
              <div>
                <Label htmlFor="maxPages" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Max Pages to Crawl (Optional)
                </Label>
                <Input
                  id="maxPages"
                  type="number"
                  // value={maxPages}
                  // onChange={(e) => setMaxPages(parseInt(e.target.value))}
                  placeholder="e.g., 10 (default is 50)"
                  className="w-full border-slate-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                />
              </div>
              */}
             <CardFooter className="p-0 pt-6">
                <Button type="submit" className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-base">
                  <PlayCircle size={20} className="mr-2" />
                  Start Analysis
                </Button>
             </CardFooter>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConductAnalysis;