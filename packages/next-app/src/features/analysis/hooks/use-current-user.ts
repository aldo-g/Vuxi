'use client';

import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '@/lib/constants';

interface User {
  id: number;
  Name: string;
  email: string;
}

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await fetch(API_ENDPOINTS.AUTH.ME);
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData.user);
        } else {
          setError('Failed to fetch user data');
        }
      } catch (err) {
        setError('Error fetching user data');
        console.error('Failed to fetch user:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading, error };
}