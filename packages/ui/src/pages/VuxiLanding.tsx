import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowRight, Bot, Search, FileText } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001/api';

const VuxiLanding = () => {
  const navigate = useNavigate();
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setLoginError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      if (data.token) {
        localStorage.setItem('token', data.token);
        navigate('/dashboard');
      }
    } catch (err) {
      setLoginError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="px-4 lg:px-6 h-16 flex items-center justify-between border-b bg-white">
        <Link to="/" className="flex items-center justify-center">
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
                    <p className="text-sm text-muted-foreground">
                      Access your project dashboard.
                    </p>
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
                  {loginError && (
                    <p className="text-sm text-red-600">{loginError}</p>
                  )}
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </div>
              </form>
            </PopoverContent>
          </Popover>
          <Link to="/create-account">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section with Updated Content */}
        <section className="w-full py-20 md:py-28 lg:py-36 text-center">
          <div className="container px-4 md:px-6">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
              Uncover the 'Why' Behind Your UX
            </h1>
            <p className="max-w-[700px] text-muted-foreground md:text-xl mx-auto my-6">
              Vuxi provides AI-driven analysis of your website's user experience, turning screenshots and user flows into actionable, expert-level reports.
            </p>
            <div className="flex justify-center">
              <Link to="/create-account">
                <Button size="lg">
                  Start Your First Analysis <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* "How it Works" Section */}
        <section className="w-full py-20 md:py-28 lg:py-36 bg-white border-t border-b">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 sm:grid-cols-1 md:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="p-3 rounded-full bg-primary/10 mb-4">
                  <Search className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">1. Crawl & Capture</h3>
                <p className="text-muted-foreground mt-2">
                  Vuxi automatically discovers and screenshots the pages of your website, creating a comprehensive visual inventory.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="p-3 rounded-full bg-primary/10 mb-4">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">2. AI-Powered Analysis</h3>
                <p className="text-muted-foreground mt-2">
                  Our advanced models analyze each page against UX best practices and your stated business goals.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="p-3 rounded-full bg-primary/10 mb-4">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">3. Actionable Reporting</h3>
                <p className="text-muted-foreground mt-2">
                  Receive comprehensive reports with prioritized recommendations and clear implementation guidance.
                </p>
              </div>
            </div>
            <div className="mt-16 text-center">
              <Link to="/reports">
                <Button variant="outline" size="lg">View Example Reports</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default VuxiLanding;