'use client';

import { Profile } from "@/lib/types";
import { User, Briefcase, GraduationCap, Code, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ProfileRowProps {
  profile: Profile;
}

export function ProfileRow({ profile }: ProfileRowProps) {
  return (
    <div className="group relative">
      <div className="relative bg-white/90 backdrop-blur-[24px] border-b border-dia-divider transition-all duration-300">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 max-w-[1200px] mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1 min-w-0">
              <div className="flex items-center gap-4">
                <div className="shrink-0 h-10 w-10 rounded-full bg-dia-button flex items-center justify-center">
                  <User className="h-5 w-5 text-dia-body" />
                </div>
                <h3 className="text-lg font-normal text-foreground whitespace-nowrap">
                  {profile.first_name} {profile.last_name}
                </h3>
              </div>

              <div className="hidden sm:flex items-center gap-3">
                {[
                  { icon: Briefcase, label: "Experience", count: profile.work_experience.length },
                  { icon: GraduationCap, label: "Education", count: profile.education.length },
                  { icon: Code, label: "Projects", count: profile.projects.length },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1 rounded-full",
                      "bg-muted border border-dia-divider",
                      "transition-all duration-200"
                    )}
                  >
                    <stat.icon className="h-3 w-3 text-dia-tertiary" />
                    <span className="text-sm whitespace-nowrap">
                      <span className="font-medium text-foreground">{stat.count}</span>
                      <span className="text-dia-body ml-1.5">{stat.label}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Link href="/profile" className="shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
              >
                <Pencil className="h-3.5 w-3.5 mr-2" />
                Edit Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
