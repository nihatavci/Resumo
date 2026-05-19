'use client';

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIImprovementPromptProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  isLoading?: boolean;
  placeholder?: string;
  hideSubmitButton?: boolean;
}

export function AIImprovementPrompt({
  value,
  onChange,
  onSubmit,
  isLoading,
  placeholder = "e.g., Make it more impactful and quantifiable",
  hideSubmitButton = false
}: AIImprovementPromptProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-[11px] font-medium text-muted-foreground">Prompt for AI (Optional)</Label>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "h-14 mt-0.5 text-xs",
            "bg-white",
            "border-dia-divider",
            "focus:border-dia-tertiary focus:ring-1 focus:ring-dia-tertiary/30",
            "hover:bg-white",
            "resize-none",
            "text-foreground placeholder:text-dia-tertiary"
          )}
        />
      </div>
      {!hideSubmitButton && onSubmit && (
        <Button
          variant="outline"
          size="sm"
          onClick={onSubmit}
          disabled={isLoading}
          className={cn(
            "w-full h-8",
            "bg-muted/80 hover:bg-muted",
            "text-muted-foreground hover:text-foreground",
            "border border-dia-divider",
            "shadow-dia",
            "transition-all duration-300",
            "hover:scale-[1.02] hover:shadow-md",
            "hover:-translate-y-0.5",
            "text-xs"
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              Improving...
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Improve with AI
            </>
          )}
        </Button>
      )}
    </div>
  );
} 