'use client';

import { Trash2, Copy, FileText, Sparkles, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { MiniResumePreview } from '@/components/resume/shared/mini-resume-preview';
import { CreateResumeDialog } from '@/components/resume/management/dialogs/create-resume-dialog';
import { ResumeSortControls, type SortOption, type SortDirection } from '@/components/resume/management/resume-sort-controls';
import type { Profile, ResumeSummary } from '@/lib/types';
import { deleteResume, copyResume } from '@/utils/actions/resumes/actions';
import { Pagination, PaginationContent, PaginationItem } from '@/components/ui/pagination';
import { useState, useOptimistic, useTransition } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { toast } from 'sonner';

// Extended Resume type for optimistic updates
interface OptimisticResume extends ResumeSummary {
  isOptimistic?: boolean;
  originalId?: string;
}

interface ResumesSectionProps {
  type: 'base' | 'tailored';
  resumes: ResumeSummary[];
  profile: Profile;
  sortParam: string;
  directionParam: string;
  currentSort: SortOption;
  currentDirection: SortDirection;
  baseResumes?: ResumeSummary[]; // Only needed for tailored type
}

interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
}

export function ResumesSection({ 
  type,
  resumes,
  profile,
  sortParam,
  directionParam,
  currentSort,
  currentDirection,
  baseResumes = [],
}: ResumesSectionProps) {
  // Optimistic state for deletions
  const [optimisticResumes, removeOptimisticResume] = useOptimistic(
    resumes as OptimisticResume[],
    (state, deletedResumeId: string) => 
      state.filter(resume => resume.id !== deletedResumeId)
  );

  // Optimistic state for copying
  const [optimisticCopiedResumes, addOptimisticCopy] = useOptimistic(
    optimisticResumes,
    (state, newResume: OptimisticResume) => {
      // Always add new resume at the beginning (leftmost position)
      return [newResume, ...state];
    }
  );

  const [, startTransition] = useTransition();
  const [deletingResumes, setDeletingResumes] = useState<Set<string>>(new Set());
  const [copyingResumes, setCopyingResumes] = useState<Set<string>>(new Set());

  const config = {
    base: {
      gradient: '',
      border: 'border-dia-divider',
      bg: 'bg-muted',
      text: 'text-foreground',
      icon: FileText,
      accent: {
        bg: 'muted',
        hover: 'muted/50'
      }
    },
    tailored: {
      gradient: '',
      border: 'border-dia-divider',
      bg: 'bg-muted',
      text: 'text-foreground',
      icon: Sparkles,
      accent: {
        bg: 'muted',
        hover: 'muted/50'
      }
    }
  }[type];

  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    itemsPerPage: 7
  });

  // Handle optimistic deletion
  const handleDeleteResume = async (resumeId: string, resumeName: string) => {
    // Add to deleting set for visual feedback
    setDeletingResumes(prev => new Set(prev).add(resumeId));
    
    // Optimistically remove from UI immediately
    removeOptimisticResume(resumeId);
    
    // Show immediate feedback
    toast.loading(`Deleting "${resumeName}"...`, { id: resumeId });
    
    try {
      // Call server action in background
      await deleteResume(resumeId);
      
      // Success feedback
      toast.success(`"${resumeName}" deleted successfully`, { id: resumeId });
    } catch (error) {
      // On error, the optimistic update will automatically rollback
      console.error('Failed to delete resume:', error);
      toast.error(`Failed to delete "${resumeName}". Please try again.`, { id: resumeId });
    } finally {
      // Remove from deleting set
      setDeletingResumes(prev => {
        const newSet = new Set(prev);
        newSet.delete(resumeId);
        return newSet;
      });
    }
  };

  // Handle optimistic copying
  const handleCopyResume = async (sourceResume: OptimisticResume) => {
    // Add to copying set for visual feedback
    setCopyingResumes(prev => new Set(prev).add(sourceResume.id));
    
    // Create optimistic copy
    const optimisticCopy: OptimisticResume = {
      ...sourceResume,
      id: `temp-${Date.now()}-${Math.random()}`, // Temporary unique ID
      name: `${sourceResume.name} (Copy)`,
      isOptimistic: true,
      originalId: sourceResume.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Optimistically add to UI immediately
    addOptimisticCopy(optimisticCopy);
    
    // Show immediate feedback
    toast.loading(`Copying "${sourceResume.name}"...`, { id: `copy-${sourceResume.id}` });
    
    try {
      // Call server action in background
      await copyResume(sourceResume.id);
      
      // Success feedback - the real resume will appear via revalidation
      toast.success(`"${sourceResume.name}" copied successfully`, { id: `copy-${sourceResume.id}` });
    } catch (error) {
      // On error, the optimistic update will automatically rollback
      console.error('Failed to copy resume:', error);
      toast.error(`Failed to copy "${sourceResume.name}". Please try again.`, { id: `copy-${sourceResume.id}` });
    } finally {
      // Remove from copying set
      setCopyingResumes(prev => {
        const newSet = new Set(prev);
        newSet.delete(sourceResume.id);
        return newSet;
      });
    }
  };

  const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
  const endIndex = startIndex + pagination.itemsPerPage;
  const paginatedResumes = optimisticCopiedResumes.slice(startIndex, endIndex);

  function handlePageChange(page: number) {
    setPagination(prev => ({
      ...prev,
      currentPage: page
    }));
  }

  // Create Resume Card Component
  const CreateResumeCard = () => (
    <CreateResumeDialog
      type={type}
      profile={profile}
      {...(type === 'tailored' && { baseResumes })}
    >
      <button className={cn(
        "aspect-[8.5/11] rounded-dia-sm",
        "relative overflow-hidden",
        "border-2 border-dashed border-dia-divider transition-all duration-300",
        "group/new-resume flex flex-col items-center justify-center gap-4",
        "bg-white/60 hover:bg-white/90",
        "hover:shadow-dia hover:-translate-y-1",
        "w-full sm:w-auto mr-8 sm:mr-0"
      )}>
        <div className={cn(
          "relative z-10 flex flex-col items-center",
          "transform transition-all duration-300",
          "group-hover/new-resume:scale-105"
        )}>
          <div className={cn(
            "h-12 w-12 rounded-dia-btn",
            "flex items-center justify-center",
            "bg-muted shadow-dia",
            "transition-all duration-300"
          )}>
            <config.icon className="h-5 w-5 text-dia-body" />
          </div>

          <span className="mt-4 text-sm font-medium text-foreground">
            Create {type === 'base' ? 'Base' : 'Tailored'} Resume
          </span>

          <span className={cn(
            "mt-2 text-xs text-dia-tertiary",
            "transition-opacity duration-300 opacity-0",
            "group-hover/new-resume:opacity-100"
          )}>
            Click to start
          </span>
        </div>
      </button>
    </CreateResumeDialog>
  );

  // Resume Card Component with optimistic states
  const ResumeCard = ({ resume }: { resume: OptimisticResume }) => {
    const isDeleting = deletingResumes.has(resume.id);
    const isCopying = copyingResumes.has(resume.originalId || resume.id);

    return (
      <div className={cn(
        "group relative transition-all duration-300",
        isDeleting && "opacity-50 pointer-events-none",
        resume.isOptimistic && "animate-in slide-in-from-top-1 duration-300"
      )}>
        <AlertDialog>
          <div className="relative">
            {/* Resume Preview - Conditional Link */}
            {resume.isOptimistic ? (
              // Not clickable during processing
              <div className={cn(
                "cursor-wait",
                "relative"
              )}>
                <MiniResumePreview
                  name={resume.name}
                  type={type}
                  target_role={resume.target_role}
                  createdAt={resume.created_at}
                  className={cn(
                    "transition-all duration-300 opacity-60",
                    "pointer-events-none"
                  )}
                />
                {/* Loading Overlay */}
                <div className="absolute inset-0 bg-white/90 backdrop-blur-[24px] rounded-dia-sm flex items-center justify-center z-10">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-dia-body" />
                    <span className="text-xs font-medium text-dia-body">Copying...</span>
                  </div>
                </div>
              </div>
            ) : (
              // Normal clickable resume
              <Link href={`/resumes/${resume.id}`}>
                <MiniResumePreview
                  name={resume.name}
                  type={type}
                  target_role={resume.target_role}
                  createdAt={resume.created_at}
                  className="hover:-translate-y-1 transition-transform duration-300"
                />
              </Link>
            )}

            {/* Action Buttons */}
            {!resume.isOptimistic && (
              <div className="absolute bottom-2 left-2 flex gap-2">
                <AlertDialogTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={isDeleting}
                    className={cn(
                      "h-8 w-8 rounded-dia-btn",
                      "bg-white/80 hover:bg-white",
                      "text-dia-tertiary hover:text-destructive",
                      "border border-dia-divider",
                      "shadow-dia",
                      "transition-all duration-200",
                      isDeleting && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                
                {/* Copy Button */}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    startTransition(() => {
                      handleCopyResume(resume);
                    });
                  }}
                  disabled={isDeleting || isCopying}
                  className={cn(
                    "h-8 w-8 rounded-dia-btn",
                    "bg-white/80 hover:bg-white",
                    "text-dia-tertiary hover:text-foreground",
                    "border border-dia-divider",
                    "shadow-dia",
                    "transition-all duration-200",
                    (isDeleting || isCopying) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isCopying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </div>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Resume</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{resume.name}&quot;? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  startTransition(() => {
                    handleDeleteResume(resume.id, resume.name);
                  });
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  };

  return (
    <div className="relative ">
      <div className="flex flex-col gap-4 w-full">
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-foreground">
            {type === 'base' ? 'Base' : 'Tailored'} Resumes
          </h2>
          <div className="flex items-center gap-2 mb-4">
            <ResumeSortControls 
              sortParam={sortParam}
              directionParam={directionParam}
              currentSort={currentSort}
              currentDirection={currentDirection}
            />
          </div>
        </div>

        {/* Desktop Pagination (hidden on mobile) */}
        {optimisticCopiedResumes.length > pagination.itemsPerPage && (
          <div className="hidden md:flex w-full items-start justify-start -mt-4">
            <Pagination className="flex justify-end">
              <PaginationContent className="gap-1">
                <PaginationItem>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </PaginationItem>
                
                {Array.from({ length: Math.ceil(optimisticCopiedResumes.length / pagination.itemsPerPage) }).map((_, index) => {
                  const pageNumber = index + 1;
                  const totalPages = Math.ceil(optimisticCopiedResumes.length / pagination.itemsPerPage);
                  
                  if (
                    pageNumber === 1 || 
                    pageNumber === totalPages || 
                    (pageNumber >= pagination.currentPage - 1 && pageNumber <= pagination.currentPage + 1)
                  ) {
                    return (
                      <PaginationItem key={index}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePageChange(pageNumber)}
                          className={cn(
                            "h-8 w-8 p-0",
                            "text-muted-foreground hover:text-foreground",
                            pagination.currentPage === pageNumber && "font-medium text-foreground"
                          )}
                        >
                          {pageNumber}
                        </Button>
                      </PaginationItem>
                    );
                  }

                  if (
                    pageNumber === 2 && pagination.currentPage > 3 ||
                    pageNumber === totalPages - 1 && pagination.currentPage < totalPages - 2
                  ) {
                    return (
                      <PaginationItem key={index}>
                        <span className="text-muted-foreground px-2">...</span>
                      </PaginationItem>
                    );
                  }

                  return null;
                })}

                <PaginationItem>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === Math.ceil(optimisticCopiedResumes.length / pagination.itemsPerPage)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      <div className="relative pb-6">
        {/* Mobile View */}
        <div className="md:hidden w-full space-y-6">
          {/* Mobile Create Resume Button Row */}
          <div className="px-2 w-full  flex">
            <CreateResumeCard />
          </div>

          {/* Mobile Resumes Carousel */}
          {paginatedResumes.length > 0 && (
            <div className="w-full">
              <Carousel className="w-full">
                <CarouselContent>
                  {paginatedResumes.map((resume) => (
                    <CarouselItem key={resume.id} className="basis-[85%] pl-4">
                      <ResumeCard resume={resume} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="hidden sm:block">
                  <CarouselPrevious className="absolute -left-12 top-1/2" />
                  <CarouselNext className="absolute -right-12 top-1/2" />
                </div>
              </Carousel>
            </div>
          )}
        </div>

        {/* Desktop Grid View */}
        <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          <CreateResumeCard />

          {paginatedResumes.map((resume) => (
            <ResumeCard key={resume.id} resume={resume} />
          ))}
          {optimisticCopiedResumes.length === 0 && optimisticCopiedResumes.length + 1 < 4 && (
            <div className="col-span-2 md:col-span-1" />
          )}
        </div>
      </div>
    </div>
  );
} 
