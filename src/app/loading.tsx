import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { FileText, Sparkles } from "lucide-react";

export default function Loading() {
  return (
    <main className="min-h-screen relative">
      {/* Background Layer */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-dia-canvas" />
      </div>

      {/* Main Content Layer */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Dashboard Header */}
        <header className="sticky top-0 z-20 py-6 px-4 md:px-6 lg:px-8 border-b border-dia-divider bg-white/90 backdrop-blur-[24px]">
          <div className="max-w-[1800px] mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <Skeleton className="h-9 w-64 sm:w-72" />
                <Skeleton className="h-5 w-48 sm:w-56" />
              </div>
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-10" />
              </div>
            </div>
          </div>
        </header>

        {/* Main Dashboard Content */}
        <div className="flex-1 px-4 md:px-6 lg:px-8 py-6 md:py-8">
          <div className="relative max-w-[1800px] mx-auto space-y-6 md:space-y-8">
            {/* Main Row - Profile and Base Resumes side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
              {/* Profile Card */}
              <div className="lg:col-span-3 ">
                <Card className="p-6 bg-white/90 backdrop-blur-[24px] border-dia-divider shadow-dia rounded-dia-sm h-full">
                  {/* Profile Header */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-8 w-32" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                    <div className="flex flex-col items-center gap-3 py-4">
                      <Skeleton className="h-24 w-24 rounded-full" />
                      <Skeleton className="h-6 w-40" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                  </div>

                  {/* Profile Stats */}
                  <div className="mt-6 space-y-4">
                    <Skeleton className="h-8 w-32" />
                    <div className="grid grid-cols-2 gap-4">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-8 w-full" />
                          <Skeleton className="h-4 w-16 mx-auto" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Profile Completion */}
                  <div className="mt-6 space-y-3">
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-5 w-12" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                </Card>
              </div>

              {/* Base Resumes */}
              <div className="lg:col-span-9">
                <Card className="p-6 bg-white/90 backdrop-blur-[24px] border-dia-divider shadow-dia rounded-dia-sm">
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-dia-sm bg-muted">
                          <FileText className="h-5 w-5 text-dia-body" />
                        </div>
                        <div className="space-y-1">
                          <Skeleton className="h-6 w-32" />
                          <Skeleton className="h-4 w-40" />
                        </div>
                      </div>
                      <Skeleton className="h-10 w-32" />
                    </div>

                    {/* Resume Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[...Array(3)].map((_, i) => (
                        <Card key={i} className="p-4 space-y-4 bg-white/90 border-dia-divider rounded-dia-sm">
                          <div className="space-y-2">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-4 w-4" />
                              <Skeleton className="h-4 w-24" />
                            </div>
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-4 w-4" />
                              <Skeleton className="h-4 w-32" />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-8 flex-1" />
                            <Skeleton className="h-8 w-8" />
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Tailored Resumes */}
            <Card className="p-6 bg-white/90 backdrop-blur-[24px] border-dia-divider shadow-dia rounded-dia-sm">
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-dia-sm bg-muted">
                      <Sparkles className="h-5 w-5 text-dia-body" />
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-6 w-36" />
                      <Skeleton className="h-4 w-44" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-32" />
                </div>

                {/* Resume Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="p-4 space-y-4 bg-white/90 border-dia-divider rounded-dia-sm">
                      <div className="space-y-2">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-8 flex-1" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
} 