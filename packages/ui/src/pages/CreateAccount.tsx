import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowLeft, UserPlus, Loader2, AlertTriangle } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001/api';

const CreateAccount = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [notificationEmail, setNotificationEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, notificationEmail, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account.');
      }

      // Success! Redirect to login page with a success message.
      navigate('/login', { state: { successMessage: 'Account created successfully! Please log in.' } });

    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Main container with a subtle gradient background
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Vuxi Logo/Title */}
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white">Vuxi</h1>
            <p className="text-slate-400">AI-Powered UX Analysis</p>
        </div>

        {/* The main form card with improved styling */}
        <Card className="bg-slate-800/60 border-slate-700 shadow-2xl shadow-black/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              Create an Account
            </CardTitle>
            <CardDescription className="text-slate-400 pt-1">
              Join to start your first analysis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" type="text" value={fullName} onChange={e => setFullName(e.target.value)} required disabled={isLoading} className="bg-slate-900/80 border-slate-600 focus:ring-indigo-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Login Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={isLoading} className="bg-slate-900/80 border-slate-600 focus:ring-indigo-500"/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notificationEmail">Notification Email (Optional)</Label>
                <Input id="notificationEmail" type="email" value={notificationEmail} onChange={e => setNotificationEmail(e.target.value)} placeholder="Leave blank to use login email" disabled={isLoading} className="bg-slate-900/80 border-slate-600 focus:ring-indigo-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required disabled={isLoading} className="bg-slate-900/80 border-slate-600 focus:ring-indigo-500" />
              </div>
              
              {error && (
                  <div className="p-3 bg-red-900/30 text-red-300 border border-red-500/50 rounded-md text-sm flex items-center gap-2">
                    <AlertTriangle size={18} /> {error}
                  </div>
              )}

              <Button type="submit" size="lg" className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 font-semibold text-base" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : 'Create Account'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center py-4">
            <p className="text-sm text-slate-400">
              Already have an account? <Link to="/login" className="font-medium text-indigo-400 hover:underline">Log In</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default CreateAccount;