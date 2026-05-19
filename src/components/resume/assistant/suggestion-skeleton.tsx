'use client';

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

export function SuggestionSkeleton() {
  return (
    <Card className={cn(
      "group relative overflow-hidden",
      "p-4",
      "bg-white border-border",
      "shadow-dia",
      "rounded-dia-sm"
    )}>
      {/* Content */}
      <div className="relative space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-dia-btn bg-muted">
            <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
        </div>

        {/* Main Content */}
        <div className="bg-dia-canvas rounded-dia-btn p-3 border border-border space-y-3">
          {/* Title Area */}
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="h-5 w-48 bg-muted rounded animate-pulse" />
              <div className="h-3 w-32 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-3 w-16 bg-muted rounded animate-pulse" />
          </div>

          {/* Description Lines */}
          <div className="space-y-2 pt-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="h-2 w-2 mt-1.5 rounded-full bg-muted" />
                <div className="h-4 flex-1 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-5 w-16 rounded-full bg-muted animate-pulse"
              />
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-0.5">
          <div className="h-8 w-20 rounded-dia-btn bg-muted animate-pulse" />
          <div className="h-8 w-20 rounded-dia-btn bg-muted animate-pulse" />
        </div>
      </div>
    </Card>
  );
}
