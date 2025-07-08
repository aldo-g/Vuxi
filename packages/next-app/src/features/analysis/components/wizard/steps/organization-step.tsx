"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Building2, ArrowRight, ArrowLeft } from 'lucide-react';
import type { OrganizationStepProps } from '../../../types';
import { CaptureStatus } from '../capture-status';

export function OrganizationStep({ 
  organizationName, 
  onOrgChange, 
  onNext, 
  onBack, 
  captureJob, 
  captureStarted 
}: OrganizationStepProps) {
  return (
    <Card className="border-slate-200 bg-white shadow-lg">
      <CardHeader className="text-center pb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-semibold">Organization Details</CardTitle>
        <p className="text-slate-600 mt-2">
          Tell us about the organization whose website we're analyzing.
        </p>
        
        <CaptureStatus captureJob={captureJob} captureStarted={captureStarted} />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="org-name" className="text-sm font-medium">
            Organization Name
          </Label>
          <Input
            id="org-name"
            type="text"
            placeholder="e.g., Acme Corporation"
            value={organizationName}
            onChange={(e) => onOrgChange(e.target.value)}
            className="text-lg py-3"
          />
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={onBack}
            variant="outline"
            className="flex-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button 
            onClick={onNext}
            disabled={!organizationName.trim()}
            className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
          >
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}