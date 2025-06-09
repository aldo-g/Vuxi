import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DashboardClient } from "@/components/dashboard-client";

// This function will be called on the server to fetch data
async function getProjects() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  // If there's no token, the user isn't logged in, so redirect them.
  if (!token) {
    redirect('/login'); // Assuming you have a /login page
  }
  
  // We need to get the absolute URL for the API route.
  // In production, this would be your domain. In development, it's localhost.
  const host = process.env.NODE_ENV === 'production' 
    ? 'https://your-production-domain.com' 
    : 'http://localhost:3000';

  try {
    const response = await fetch(`${host}/api/projects`, {
      // Pass the user's cookies to the API route for authentication
      headers: {
        'Cookie': `token=${token}`
      },
      // Optional: Use cache: 'no-store' to ensure data is always fresh
      cache: 'no-store',
    });

    if (!response.ok) {
      // If the token is invalid or expired, the API will return a 401
      if (response.status === 401) {
        redirect('/login');
      }
      throw new Error('Failed to fetch projects');
    }

    const projects = await response.json();
    return projects;

  } catch (error) {
    console.error("Failed to fetch projects:", error);
    // On error, redirect to login as a fallback
    redirect('/login');
  }
}

export default async function DashboardPage() {
  const projects = await getProjects();
  return <DashboardClient projects={projects} />;
}