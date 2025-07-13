import Link from "next/link";
import { AlertTriangle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageErrorProps {
  title?: string;
  message?: string;
  showHomeButton?: boolean;
  error?: string;
}

export function PageError({ 
  title = "Error", 
  message = "Something went wrong", 
  showHomeButton = true,
  error 
}: PageErrorProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100/30">
      <div className="text-center p-8 bg-white shadow-xl rounded-2xl max-w-lg">
        <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-4">{title}</h1>
        <p className="text-slate-600 mb-8 text-lg">{message}</p>
        {error && (
          <pre className="text-xs text-red-700 bg-red-50 p-4 rounded-md text-left mt-4 overflow-auto">
            {error}
          </pre>
        )}
        {showHomeButton && (
          <Link href="/">
            <Button className="mt-8 inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              <Home className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}