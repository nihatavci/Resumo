import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useState, useCallback, useRef, useEffect } from "react";

interface ChatInputProps {
  isLoading: boolean;
  onSubmit: (message: string) => void;
  onStop: () => void;
}

export default function ChatInput({
    isLoading,
    onSubmit,
    onStop,
  }: ChatInputProps) {
    const [inputValue, setInputValue] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustTextareaHeight = useCallback(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';

      // Calculate new height (capped at 6 lines ~ 144px)
      const newHeight = Math.min(textarea.scrollHeight, 144);
      textarea.style.height = `${newHeight}px`;
    }, []);

    // Adjust height whenever input value changes
    useEffect(() => {
      adjustTextareaHeight();
    }, [inputValue, adjustTextareaHeight]);

    const handleSubmit = useCallback((e: React.FormEvent) => {
      e.preventDefault();
      if (inputValue.trim()) {
        const cleanedMessage = inputValue.replace(/\n+$/, '').trim();
        onSubmit(cleanedMessage);
        setInputValue("");
      }
    }, [inputValue, onSubmit]);

    return (
      <form onSubmit={handleSubmit} className={cn(
        "relative z-10",
        "p-1 border-t border-border",
        "bg-white",
        "flex gap-1.5"
      )}>
        <Textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (!e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              } else {
                // Ensure height is adjusted after Shift+Enter
                requestAnimationFrame(adjustTextareaHeight);
              }
            }
          }}
          placeholder="Ask me anything about your resume..."
          rows={1}
          className={cn(
            "flex-1",
            "bg-dia-canvas",
            "border-border",
            "focus:border-foreground/30",
            "focus:ring-2 focus:ring-foreground/10",
            "placeholder:text-dia-tertiary",
            "text-sm",
            "min-h-[32px]",
            "max-h-[144px]", // Approximately 6 lines
            "resize-none",
            "overflow-y-auto",
            "px-2 py-1.5",
            "transition-height duration-200",
            "rounded-dia-btn"
          )}
        />
        <Button
          type={isLoading ? "button" : "submit"}
          onClick={isLoading ? onStop : undefined}
          size="sm"
          className={cn(
            isLoading ? [
              "bg-red-600",
              "hover:bg-red-700",
            ] : [
              "bg-foreground",
              "hover:bg-foreground/90",
            ],
            "text-white",
            "border-none",
            "shadow-dia",
            "transition-all duration-300",
            "hover:scale-105 hover:shadow-md",
            "hover:-translate-y-0.5",
            "px-2 h-8",
            "rounded-dia-btn"
          )}
        >
          {isLoading ? (
            <X className="h-3.5 w-3.5" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
        </Button>
      </form>
    );
}
