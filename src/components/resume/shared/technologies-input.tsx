'use client';

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TechnologiesInputProps {
  value: string[];
  onChange: (technologies: string[]) => void;
  label?: string;
  placeholder?: string;
}

export function TechnologiesInput({
  value,
  onChange,
  label = "Technologies & Tools Used",
  placeholder = "React, TypeScript, Node.js, etc."
}: TechnologiesInputProps) {
  return (
    <div className="space-y-3 pt-2">
      <div className="flex justify-between items-baseline">
        <Label className="text-[11px] md:text-xs font-medium text-muted-foreground">{label}</Label>
        <span className="text-[7px] md:text-[9px] text-dia-tertiary">Separate with commas</span>
      </div>
      <Input
        value={value.join(', ')}
        onChange={(e) => onChange(
          e.target.value.split(',').map(t => t.trim()).filter(Boolean)
        )}
        placeholder={placeholder}
        className={cn(
          "bg-white/50 border-dia-divider rounded-dia-sm",
          "focus:border-dia-tertiary focus:ring-2 focus:ring-dia-tertiary/20",
          "hover:border-dia-tertiary hover:bg-white/60 transition-colors",
          "placeholder:text-dia-tertiary"
        )}
      />
    </div>
  );
} 