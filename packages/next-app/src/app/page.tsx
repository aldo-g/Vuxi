"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowRight, Bot, FileText, Users } from 'lucide-react';

// Main UI Component for the landing page
function VuxiLandingPage() {
  const router = useRouter();
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setLoginError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Login failed');
      }
      
      // On success, the cookie is set by the server. We just need to navigate.
      router.push('/dashboard');
    } catch (err) {
      setLoginError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="px-4 lg:px-6 h-16 flex items-center justify-between border-b bg-white">
        <Link href="/" className="flex items-center justify-center">
          <span className="text-2xl font-bold">Vuxi</span>
        </Link>
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost">Login</Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <form onSubmit={handleLogin}>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Sign In</h4>
                    <p className="text-sm text-muted-foreground">Access your dashboard.</p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="your@email.com" 
                      value={loginEmail} 
                      onChange={(e) => setLoginEmail(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="••••••••" 
                      value={loginPassword} 
                      onChange={(e) => setLoginPassword(e.target.value)} 
                      required 
                    />
                  </div>
                  {loginError && <p className="text-sm text-red-600">{loginError}</p>}
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </div>
              </form>
            </PopoverContent>
          </Popover>
          <Link href="/create-account">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-20 md:py-28 lg:py-36 text-center">
          <div className="container px-4 md:px-6">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
              Uncover the 'Why' Behind Your UX
            </h1>
            <p className="max-w-[700px] text-muted-foreground md:text-xl mx-auto my-6">
              Vuxi provides AI-driven analysis of website user experience, turning insights into actionable, expert-level reports.
            </p>
            
            <div className="flex justify-center gap-4 mt-8">
              <Link href="/create-account">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/reports">
                <Button variant="outline" size="lg">
                  View Sample Reports
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-20 md:py-28 lg:py-36 bg-white border-t border-b">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Professional UX Analysis
              </h2>
              <p className="max-w-[600px] text-muted-foreground md:text-xl mx-auto mt-4">
                Access comprehensive UX reports and insights from our expert analysis platform.
              </p>
            </div>
            
            <div className="grid gap-10 sm:grid-cols-1 md:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="p-3 rounded-full bg-primary/10 mb-4">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">AI-Powered Insights</h3>
                <p className="text-muted-foreground mt-2">
                  Advanced AI models analyze user experience against industry best practices and proven methodologies.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="p-3 rounded-full bg-primary/10 mb-4">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Detailed Reports</h3>
                <p className="text-muted-foreground mt-2">
                  Comprehensive reports with prioritized recommendations and clear implementation guidance.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="p-3 rounded-full bg-primary/10 mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Expert Analysis</h3>
                <p className="text-muted-foreground mt-2">
                  Professional-grade UX evaluation backed by years of user experience research and best practices.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function Home() {
  return <VuxiLandingPage />;
}