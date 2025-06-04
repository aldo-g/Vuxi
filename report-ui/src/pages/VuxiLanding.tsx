import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Eye, Search, Zap } from "lucide-react";

const VuxiLanding = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-white p-8">
      <header className="text-center mb-16">
        <div className="inline-flex items-center gap-4 mb-6">
          <Eye size={64} className="text-indigo-400" />
          <h1 className="text-6xl sm:text-7xl font-bold tracking-tight">
            Vuxi
          </h1>
        </div>
        <p className="text-2xl sm:text-3xl text-slate-300 font-light">
          Visual UX Inspector
        </p>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mt-6">
          Unlock actionable insights from your web pages with AI-powered analysis, screenshots, and Lighthouse audits.
        </p>
      </header>

      <main className="flex flex-col sm:flex-row items-center gap-8 mb-16">
        <div className="flex flex-col items-center p-6 bg-slate-800/50 rounded-xl shadow-lg border border-slate-700 max-w-xs text-center">
          <Search size={40} className="text-indigo-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Detailed Analysis</h2>
          <p className="text-sm text-slate-300">
            Go beyond the surface with AI-driven UX/UI feedback and page-specific reports.
          </p>
        </div>
        <div className="flex flex-col items-center p-6 bg-slate-800/50 rounded-xl shadow-lg border border-slate-700 max-w-xs text-center">
          <Zap size={40} className="text-indigo-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Actionable Insights</h2>
          <p className="text-sm text-slate-300">
            Get clear recommendations to improve user experience and website performance.
          </p>
        </div>
      </main>

      <Link to="/reports">
        <Button size="lg" className="bg-indigo-600 hover:bg-indigo-500 text-white text-lg px-10 py-6 rounded-lg shadow-lg transition-transform hover:scale-105">
          View Analysis Reports
        </Button>
      </Link>

      <footer className="mt-24 text-center text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Vuxi - Visual UX Inspector. All rights reserved.</p>
        <p className="mt-1">Powered by advanced AI and web analysis technologies.</p>
      </footer>
    </div>
  );
};

export default VuxiLanding;