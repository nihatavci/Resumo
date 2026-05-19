'use client';

import { Resume } from "@/lib/types";
import { Logo } from "@/components/ui/logo";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface ResumeEditorHeaderProps {
  resume: Resume;
  hasUnsavedChanges: boolean;
}

export function ResumeEditorHeader({
  resume,
  hasUnsavedChanges,
}: ResumeEditorHeaderProps) {
  const router = useRouter();
  const capitalizeWords = (str: string) => {
    return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const handleBackClick = () => {
    if (!hasUnsavedChanges) {
      router.push('/');
    }
  };

  return (
    <div className={cn(
      "h-20 border-b backdrop-blur-xl fixed left-0 right-0 z-40 shadow-dia",
      "border-border",
      "bg-white/95",
    )}>
      {/* Content Container */}
      <div className="max-w-[2000px] mx-auto h-full px-6 flex items-center justify-between relative">
        {/* Left Section - Logo, Title  */}
        <div className="flex items-center gap-6">
          {hasUnsavedChanges ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <div>
                  <Logo className="text-xl cursor-pointer" asLink={false} />
                </div>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
                  <AlertDialogDescription>
                    You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => router.push('/')}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Leave
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <div onClick={handleBackClick}>
              <Logo className="text-xl cursor-pointer" asLink={false} />
            </div>
          )}
          <div className="h-8 w-px bg-border hidden sm:block" />
          <div className="flex flex-col justify-center gap-1">
            {/* Resume Title Section */}
            <div className="flex flex-col ">
              <h1 className="text-xl font-light">
                <span className="text-foreground">
                  {resume.is_base_resume ? capitalizeWords(resume.target_role) : resume.name}
                </span>
              </h1>
              <div className="flex text-sm text-dia-tertiary">
                {resume.is_base_resume ? (
                  <div className="flex items-center">
                    <span className="text-xs font-medium">Base Resume</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">Tailored Resume</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
