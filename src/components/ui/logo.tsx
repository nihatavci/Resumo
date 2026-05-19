'use client';

import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  asLink?: boolean;
}

export function Logo({ className, asLink = true }: LogoProps) {
  const logoContent = (
    <span
      className={cn(
        "text-2xl font-light tracking-tight text-foreground transition-opacity duration-200 hover:opacity-70 cursor-pointer",
        className
      )}
    >
      Resumo
    </span>
  );

  if (asLink) {
    return <Link href="/">{logoContent}</Link>;
  }

  return logoContent;
}
