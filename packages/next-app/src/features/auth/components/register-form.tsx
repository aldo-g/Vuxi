'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowLeft, UserPlus, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/use-auth';

export function RegisterForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const { register, isLoading, error } = useAuth();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await register(formData);
  };

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-100 to-slate-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-700 transition-colors duration-200 group"
          >
            <ArrowLeft size={18} className="transform transition-transform duration-200 group-hover:-translate-x-1" />
            Back to Vuxi Home
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Vuxi</h1>
          <p className="text-slate-600">AI-Powered UX Analysis</p>
        </div>

        <Card className="bg-white shadow-2xl rounded-xl border-slate-200/80">
          <CardHeader className="p-6 sm:p-8 bg-slate-50/70 rounded-t-xl border-b border-slate-200/70">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-lg flex items-center justify-center shadow-md">
                <UserPlus size={24} />
              </div>
              <div>
                <CardTitle className="text-2xl sm:text-3xl font-bold text-slate-800">
                  Create Account
                </CardTitle>
                <CardDescription className="text-slate-500 mt-1 text-sm sm:text-base">
                  Join to start your first UX analysis
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Name
                </Label>
                <Input 
                  id="name" 
                  type="text" 
                  value={formData.name} 
                  onChange={handleInputChange('name')} 
                  placeholder="e.g., John Smith"
                  required 
                  disabled={isLoading}
                  className="w-full border-slate-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                />
              </div>
              
              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email Address
                </Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={formData.email} 
                  onChange={handleInputChange('email')} 
                  placeholder="your@email.com"
                  required 
                  disabled={isLoading}
                  className="w-full border-slate-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                />
              </div>
              
              <div>
                <Label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password
                </Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={formData.password} 
                  onChange={handleInputChange('password')} 
                  placeholder="Create a secure password"
                  required 
                  disabled={isLoading}
                  className="w-full border-slate-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                />
              </div>
              
              {error && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm flex items-center gap-2">
                  <AlertTriangle size={18} /> {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 size={20} className="mr-2 animate-spin" />
                ) : (
                  <UserPlus size={20} className="mr-2" />
                )}
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="p-6 sm:p-8 border-t border-slate-200/70 bg-slate-50/30">
            <div className="w-full text-center">
              <p className="text-sm text-slate-600">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline transition-colors duration-200">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}