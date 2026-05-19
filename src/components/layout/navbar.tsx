'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

import { LogoutButton } from "@/components/auth/logout-button";

export function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <nav className="h-16 border-b border-dia-divider bg-white/50 backdrop-blur-lg sticky top-0 w-full z-50">
      <div className="max-w-[2000px] mx-auto h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-8">
          {/* Logo/Brand */}
          <Link href="/home" className="text-xl font-light text-foreground">
            Resume.AI
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link
              href="/home"
              className={cn(
                "text-sm transition-colors hover:text-foreground",
                isActive('/home') ? "text-foreground" : "text-muted-foreground"
              )}
            >
              Dashboard
            </Link>
            <Link
              href="/jobs"
              className={cn(
                "text-sm transition-colors hover:text-foreground",
                isActive('/jobs') ? "text-foreground" : "text-muted-foreground"
              )}
            >
              Jobs
            </Link>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}