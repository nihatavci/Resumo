import { cn } from "@/lib/utils";

interface BackgroundEffectsProps {
  className?: string;
  isBaseResume?: boolean;
}

export function BackgroundEffects({ className }: BackgroundEffectsProps) {
  return (
    <div className={cn("fixed inset-0 z-0  overflow-hidden  h-[calc(100vh)]", className)}>
      {/* Base solid background */}
      <div className="absolute inset-0 bg-dia-canvas" />

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:14px_24px] opacity-[0.3]" />
    </div>
  );
}
