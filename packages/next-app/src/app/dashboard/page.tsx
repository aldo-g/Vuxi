import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { UserNav } from "@/components/user-nav";
import { DashboardClient } from "@/components/dashboard-client";

// Simple auth check function
async function checkAuth() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }
  
  return true;
}

export default async function DashboardPage() {
  // Just check authentication, no need to fetch projects for a report-viewing app
  await checkAuth();

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 border-b bg-background sm:px-6">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-4">
          <UserNav />
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6">
        <DashboardClient />
      </main>
    </div>
  );
}