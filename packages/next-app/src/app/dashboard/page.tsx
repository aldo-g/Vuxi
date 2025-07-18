import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { MainLayout } from "@/components/layout";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

interface Project {
  id: number;
  name: string;
  baseUrl: string;
  orgName?: string;
  orgPurpose?: string;
  createdAt: string;
  analysisRuns?: Array<{
    id: number;
    status: string;
    overallScore?: number;
    createdAt: string;
  }>;
}

async function checkAuth() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }
  
  return token;
}

async function fetchUserProjects(token: string): Promise<Project[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/projects`, {
      headers: {
        'Cookie': `token=${token}`,
      },
      cache: 'no-store', // Always fetch fresh data
    });

    if (!response.ok) {
      console.error('Failed to fetch projects:', response.status);
      return [];
    }

    const projects = await response.json();
    return projects;
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
}

export default async function DashboardPage() {
  const token = await checkAuth();
  const projects = await fetchUserProjects(token);

  return (
    <MainLayout title="Dashboard">
      <DashboardClient projects={projects} />
    </MainLayout>
  );
}