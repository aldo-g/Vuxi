import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers, ErrorBoundary } from "@/components/common";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vuxi - AI-Powered UX Analysis",
  description: "Professional UX analysis powered by AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <Providers>{children}</Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}