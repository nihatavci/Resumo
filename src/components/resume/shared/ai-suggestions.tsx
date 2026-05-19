'use client';

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, X } from "lucide-react";
import Tiptap from "@/components/ui/tiptap";

interface AISuggestion {
  id: string;
  point: string;
}

interface AISuggestionsProps {
  suggestions: AISuggestion[];
  onApprove: (suggestion: AISuggestion) => void;
  onDelete: (suggestionId: string) => void;
}

export function AISuggestions({ suggestions, onApprove, onDelete }: AISuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className={cn(
      "relative group/suggestions",
      "p-6 mt-4",
      "rounded-dia",
      "bg-muted/80",
      "border border-dia-divider",
      "shadow-dia",
      "transition-all duration-500",
      "hover:shadow-md",
      "overflow-hidden"
    )}>
      {/* Content */}
      <div className="relative">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-dia-sm bg-dia-button/50 text-muted-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-medium text-foreground">AI Suggestions</span>
        </div>

        <div className="space-y-4">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className={cn(
                "group/item relative",
                "animate-in fade-in-50 duration-500",
                "transition-all"
              )}
            >
              <div className="flex gap-3">
                <div className="flex-1">
                  <Tiptap
                    content={suggestion.point}
                    onChange={() => {}}
                    readOnly={true}
                    className={cn(
                      "min-h-[80px] text-sm",
                      "bg-white/60",
                      "border-dia-divider",
                      "text-foreground",
                      "focus:border-dia-tertiary focus:ring-2 focus:ring-dia-tertiary/20",
                      "placeholder:text-dia-tertiary",
                      "transition-all duration-300",
                      "hover:bg-white/80"
                    )}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onApprove(suggestion)}
                    className={cn(
                      "h-9 w-9",
                      "bg-muted hover:bg-dia-button/60",
                      "text-foreground hover:text-foreground",
                      "border border-dia-divider",
                      "shadow-dia",
                      "transition-all duration-300",
                      "hover:scale-105 hover:shadow-md",
                      "hover:-translate-y-0.5"
                    )}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(suggestion.id)}
                    className={cn(
                      "h-9 w-9",
                      "bg-muted hover:bg-dia-button/60",
                      "text-muted-foreground hover:text-foreground",
                      "border border-dia-divider",
                      "shadow-dia",
                      "transition-all duration-300",
                      "hover:scale-105 hover:shadow-md",
                      "hover:-translate-y-0.5"
                    )}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 