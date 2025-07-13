import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { MainLayout } from "@/components/layout";
import { DashboardClient } from "@/components/dashboard-client";

async function checkAuth() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }
  
  return true;
}

export default async function DashboardPage() {
  await checkAuth();

  return (
    <MainLayout title="Dashboard">
      <DashboardClient />
    </MainLayout>
  );
}