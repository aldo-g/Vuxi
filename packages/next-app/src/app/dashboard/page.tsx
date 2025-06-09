import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/user-nav";
// Corrected: Use a named import for DashboardClient
import { DashboardClient } from "@/components/dashboard-client";

// This function will be called on the server to fetch data
async function getProjects() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }
  
  const host = process.env.NODE_ENV === 'production' 
    ? 'https://your-production-domain.com' 
    : 'http://localhost:3000';

  try {
    const response = await fetch(`${host}/api/projects`, {
      headers: {
        'Cookie': `token=${token}`
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 401) {
        redirect('/login');
      }
      throw new Error('Failed to fetch projects');
    }

    const projects = await response.json();
    return projects;

  } catch (error) {
    console.error("Failed to fetch projects:", error);
    redirect('/login');
  }
}

export default async function DashboardPage() {
  const projects = await getProjects();

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 border-b bg-background sm:px-6">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-4">
          <Button>New Project</Button>
          <UserNav />
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6">
        {/* The DashboardClient component is now correctly imported */}
        <DashboardClient projects={projects} />
      </main>
    </div>
  );
}