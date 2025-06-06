import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VuxiLanding from './VuxiLanding';

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // If a token exists, immediately replace the current page 
      // with the dashboard, so the user can't go "back" to the landing page.
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  // Render nothing while the redirect is processed, or render the landing page.
  // The check is fast, so the user will likely not see the landing page at all.
  return <VuxiLanding />;
};

export default Home;