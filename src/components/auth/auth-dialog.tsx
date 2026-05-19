'use client';

import { cloneElement, isValidElement } from "react";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AuthTab, useAuthDialog } from "@/components/auth/auth-dialog-provider";

const buttonClasses = {
  base: "bg-foreground",
  hover: "hover:bg-foreground/90",
  animation: "transition-all duration-300",
};

interface AuthDialogProps {
  children?: React.ReactNode;
  defaultTab?: AuthTab;
}

export function AuthDialog({ children, defaultTab = "signup" }: AuthDialogProps) {
  const { openDialog } = useAuthDialog();

  const handleOpen = () => {
    openDialog(defaultTab);
  };

  if (!children) {
    return (
      <Button
        size="lg"
        onClick={handleOpen}
        className={`${buttonClasses.base} ${buttonClasses.hover} text-white font-medium
          text-lg py-6 px-10 ${buttonClasses.animation} group
          shadow-dia
          scale-105 hover:scale-110 transition-all duration-300
          rounded-dia-btn relative overflow-hidden`}
        aria-label="Open authentication dialog"
      >
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <span className="relative z-10 flex items-center justify-center">
          Start Now
          <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </span>
      </Button>
    );
  }

  if (typeof children === "string") {
    return (
      <button type="button" onClick={handleOpen}>
        {children}
      </button>
    );
  }

  if (isValidElement(children)) {
    const child = children as React.ReactElement<{ onClick?: React.MouseEventHandler }>;

    return cloneElement(child, {
      ...child.props,
      onClick: (event: React.MouseEvent) => {
        child.props.onClick?.(event);
        if (!event.defaultPrevented) {
          handleOpen();
        }
      },
    });
  }

  return (
    <span role="button" tabIndex={0} onClick={handleOpen} onKeyDown={(event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleOpen();
      }
    }}>
      {children}
    </span>
  );
}
