"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Globe, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import type { UrlStepProps } from '../../../types';

export function UrlInputStep({ 
  websiteUrl, 
  onUrlChange, 
  onNext, 
  isLoading, 
  error 
}: UrlStepProps) {
  return (
    <Card className="border-slate-200 bg-white shadow-lg">
      <CardHeader className="text-center pb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Globe className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-semibold">Enter Website URL</CardTitle>
        <p className="text-slate-600 mt-2">
          Which website would you like to analyze? We'll start capturing data while you provide additional details.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="website-url" className="text-sm font-medium">
            Website URL
          </Label>
          <Input
            id="website-url"
            type="url"
            placeholder="example.com or https://example.com"
            value={websiteUrl}
            onChange={(e) => onUrlChange(e.target.value)}
            className="text-lg py-3"
          />
          <p className="text-xs text-slate-500">
            Enter a website URL (with or without https://)
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <Button 
          onClick={onNext}
          disabled={!websiteUrl || isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Starting Analysis...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}