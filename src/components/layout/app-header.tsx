'use client';

import { LogoutButton } from "@/components/auth/logout-button";
import { SettingsButton } from "@/components/settings/settings-button";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Menu, User } from "lucide-react";
import { PageTitle } from "./page-title";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
interface AppHeaderProps {
  children?: React.ReactNode;
}

export function AppHeader({
  children,
}: AppHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleProfileClick = () => {
    setIsOpen(false);
  };

  return (
    <header className="h-14 border-b border-dia-divider backdrop-blur-[24px] fixed top-0 left-0 right-0 z-40 bg-[#EFEFEF]/80">
      <div className="max-w-[1200px] mx-auto h-full px-4 flex items-center justify-between">
        {/* Left — Logo and Title */}
        <div className="flex items-center gap-3 min-w-0 flex-shrink">
          <Logo className="text-xl flex-shrink-0" />
          <div className="h-5 w-px bg-dia-divider hidden sm:block flex-shrink-0" />
          <div className="flex items-center min-w-0 max-w-[140px] sm:max-w-[300px] lg:max-w-[600px]">
            <div className="truncate max-w-[80ch] overflow-hidden text-ellipsis">
              <PageTitle />
            </div>
          </div>
        </div>

        {/* Right — Navigation */}
        <div className="flex items-center flex-shrink-0">
          {children ? (
            children
          ) : (
            <>
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-2">
                <div className="flex items-center px-2 py-1">
                  <Link
                    href="/memory"
                    onClick={handleProfileClick}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1",
                      "text-sm font-normal text-dia-body hover:text-foreground",
                      "transition-colors duration-200"
                    )}
                  >
                    <User className="h-4 w-4" />
                    <span className="hidden lg:inline">Profile</span>
                  </Link>
                  <div className="mx-2 h-4 w-px bg-dia-divider" />
                  <SettingsButton />
                  <div className="mx-2 h-4 w-px bg-dia-divider" />
                  <LogoutButton />
                </div>
              </nav>

              {/* Mobile Menu */}
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] sm:w-[320px] bg-white/90 backdrop-blur-[24px]">
                  <SheetHeader>
                    <SheetTitle className="font-normal text-foreground">Menu</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-4 pt-6">
                    <Link
                      href="/memory"
                      onClick={handleProfileClick}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-dia-btn",
                        "text-sm font-normal text-dia-body hover:text-foreground",
                        "hover:bg-muted transition-colors duration-200"
                      )}
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                    <div className="px-4">
                      <SettingsButton
                        className="w-full justify-start"
                        onAllowedNavigation={() => setIsOpen(false)}
                      />
                    </div>
                    <div className="px-4">
                      <LogoutButton className="w-full justify-start" />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
