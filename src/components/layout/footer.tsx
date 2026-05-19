import Link from "next/link";
import { Github } from "lucide-react";

interface FooterProps {
  variant?: 'fixed' | 'static';
}

export function Footer({ variant = 'fixed' }: FooterProps) {
  return (
    <footer className={`h-12 w-full border-t border-dia-divider bg-[#EFEFEF]/60 backdrop-blur-[24px] z-50 ${variant === 'fixed' ? 'fixed bottom-0 left-0 right-0' : 'static'}`}>
      <div className="max-w-[1200px] mx-auto px-4 flex h-12 items-center justify-between">
        <p className="text-sm text-dia-tertiary font-light">
          Resumo
        </p>
        <nav className="flex items-center gap-4">
          <Link
            href="https://github.com/olyaiy/resume-lm"
            target="_blank"
            rel="noopener noreferrer"
            className="text-dia-tertiary hover:text-foreground transition-colors"
          >
            <Github className="h-4 w-4" />
          </Link>
        </nav>
      </div>
    </footer>
  );
}
