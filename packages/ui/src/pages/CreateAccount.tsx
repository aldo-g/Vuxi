import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowLeft, UserPlus, Loader2, AlertTriangle, Home } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-100 to-slate-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Back to Home Link */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-700 transition-colors duration-200 group"
          >
            <ArrowLeft size={18} className="transform transition-transform duration-200 group-hover:-translate-x-1" />
            Back to Vuxi Home
          </Link>
        </div>

        {/* Vuxi Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Vuxi</h1>
          <p className="text-slate-600">AI-Powered UX Analysis</p>
        </div>

        {/* Main form card */}
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
                <Label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Full Name
                </Label>
                <Input 
                  id="fullName" 
                  type="text" 
                  value={fullName} 
                  onChange={e => setFullName(e.target.value)} 
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
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="your@email.com"
                  required 
                  disabled={isLoading}
                  className="w-full border-slate-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                />
              </div>
              
              <div>
                <Label htmlFor="notificationEmail" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Notification Email (Optional)
                </Label>
                <Input 
                  id="notificationEmail" 
                  type="email" 
                  value={notificationEmail} 
                  onChange={e => setNotificationEmail(e.target.value)} 
                  placeholder="Leave blank to use login email"
                  disabled={isLoading}
                  className="w-full border-slate-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  Where should we send analysis completion notifications?
                </p>
              </div>
              
              <div>
                <Label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password
                </Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
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
                <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline transition-colors duration-200">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default CreateAccount;