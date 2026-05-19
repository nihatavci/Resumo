'use client';

import Tiptap from "@/components/ui/tiptap";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sparkles, Loader2, Trash2, Check, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { AIImprovementPrompt } from "./ai-improvement-prompt";

interface DescriptionPointProps {
  value: string;
  onChange: (value: string) => void;
  onDelete: () => void;
  onImprove: () => void;
  onAcceptImprovement?: () => void;
  onUndoImprovement?: () => void;
  isImproved?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  improvementPrompt?: string;
  onImprovementPromptChange?: (value: string) => void;
  improvementPromptPlaceholder?: string;
}

export function DescriptionPoint({
  value,
  onChange,
  onDelete,
  onImprove,
  onAcceptImprovement,
  onUndoImprovement,
  isImproved,
  isLoading,
  placeholder = "Start with a strong action verb",
  improvementPrompt = "",
  onImprovementPromptChange,
  improvementPromptPlaceholder = "e.g., Focus on technical implementation details and performance metrics"
}: DescriptionPointProps) {
  return (
    <div className="flex gap-1 items-start group/item">
      <div className="flex-1">
        <Tiptap
          content={value}
          onChange={onChange}
          editorProps={{
            attributes: {
              placeholder,
              class: cn(
                "min-h-[80px] text-xs md:text-sm bg-white/50 border-dia-divider rounded-dia-sm",
                "focus:border-dia-tertiary focus:ring-2 focus:ring-dia-tertiary/20",
                "hover:border-dia-tertiary hover:bg-white/60 transition-colors",
                "placeholder:text-dia-tertiary",
                isImproved && [
                  "border-foreground/30",
                  "bg-muted/60",
                  "shadow-dia",
                  "hover:bg-muted/80"
                ]
              )
            }
          }}
        />
        {isImproved && (
          <div className="absolute -top-2.5 right-12 px-2 py-0.5 bg-muted rounded-full">
            <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              AI Suggestion
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1">
        {isImproved ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={onAcceptImprovement}
              className={cn(
                "p-0 group-hover/item:opacity-100",
                "h-8 w-8 rounded-dia-sm",
                "bg-muted/80 hover:bg-muted",
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
              onClick={onUndoImprovement}
              className={cn(
                "p-0 group-hover/item:opacity-100",
                "h-8 w-8 rounded-dia-sm",
                "bg-muted/80 hover:bg-muted",
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
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="p-0 group-hover/item:opacity-100 text-dia-tertiary hover:text-foreground transition-all duration-300"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onImprove}
                    disabled={isLoading}
                    className={cn(
                      "p-0 group-hover/item:opacity-100",
                      "h-8 w-8 rounded-dia-sm",
                      "bg-muted/80 hover:bg-muted",
                      "text-muted-foreground hover:text-foreground",
                      "border border-dia-divider",
                      "shadow-dia",
                      "transition-all duration-300",
                      "hover:scale-105 hover:shadow-md",
                      "hover:-translate-y-0.5"
                    )}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                {onImprovementPromptChange && (
                  <TooltipContent
                    side="bottom"
                    align="start"
                    sideOffset={2}
                    className={cn(
                      "w-72 p-3.5",
                      "bg-muted",
                      "border border-dia-divider",
                      "shadow-dia",
                      "rounded-dia-sm"
                    )}
                  >
                    <AIImprovementPrompt
                      value={improvementPrompt}
                      onChange={onImprovementPromptChange}
                      placeholder={improvementPromptPlaceholder}
                      onSubmit={onImprove}
                      isLoading={isLoading}
                    />
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </>
        )}
      </div>
    </div>
  );
} 