import { Header } from "./header";

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  showUserNav?: boolean;
}

export function MainLayout({ 
  children, 
  title, 
  showUserNav = true 
}: MainLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header title={title} showUserNav={showUserNav} />
      <main className="flex-1 p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
}