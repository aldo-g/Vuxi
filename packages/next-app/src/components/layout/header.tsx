"use client";

import Link from "next/link";
import { UserNav } from "./user-nav";

interface HeaderProps {
  title?: string;
  showUserNav?: boolean;
}

export function Header({ title = "Dashboard", showUserNav = true }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 border-b bg-background sm:px-6">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-xl font-bold">
          Vuxi
        </Link>
        {title && (
          <>
            <div className="w-px h-6 bg-border" />
            <h1 className="text-xl font-semibold">{title}</h1>
          </>
        )}
      </div>
      <div className="flex items-center gap-4">
        {showUserNav && <UserNav />}
      </div>
    </header>
  );
}