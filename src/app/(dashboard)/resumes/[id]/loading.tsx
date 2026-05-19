import { Skeleton } from "@/components/ui/skeleton";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

export default function ResumeEditorLoading() {
  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden relative">
      <div className="max-w-[2000px] mx-auto h-[calc(100vh-120px)] pt-4 px-6 md:px-8 lg:px-12">
        <ResizablePanelGroup direction="horizontal" className="h-full rounded-dia-sm border-dia-divider">
          {/* Editor Panel */}
          <ResizablePanel defaultSize={40}>
            <div className="flex flex-col h-full mr-4">
              {/* Editor Header Skeleton */}
              <div className="sticky top-0 z-20 space-y-4 backdrop-blur-sm bg-dia-canvas p-4 rounded-t-dia-sm">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-8 w-48" />
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-24" />
                  </div>
                </div>
                <div className="flex gap-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-9 w-20" />
                  ))}
                </div>
              </div>

              {/* Form Fields Skeleton */}
              <div className="flex-1 overflow-hidden mt-4 space-y-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-4 bg-muted/30 p-4 rounded-dia-sm">
                    <Skeleton className="h-6 w-32" />
                    <div className="space-y-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Chatbot Skeleton */}
              <div className="mt-auto mb-4 bg-muted/50 border border-dia-divider rounded-dia-sm p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>
            </div>
          </ResizablePanel>

          {/* Resize Handle */}
          <ResizableHandle withHandle className="bg-dia-divider hover:bg-border" />

          {/* Preview Panel */}
          <ResizablePanel defaultSize={60}>
            <div className="h-full pr-4">
              <div className="relative pb-[129.4%] w-full">
                <div className="absolute inset-0 bg-muted/30 rounded-dia-sm">
                  {/* Resume Preview Skeleton */}
                  <div className="h-full p-8 space-y-6">
                    {/* Header */}
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-64 mx-auto" />
                      <div className="flex justify-center gap-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>

                    {/* Sections */}
                    <div className="space-y-8">
                      {/* Experience */}
                      <div className="space-y-4">
                        <Skeleton className="h-6 w-32" />
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="space-y-2">
                            <div className="flex justify-between">
                              <Skeleton className="h-4 w-48" />
                              <Skeleton className="h-4 w-24" />
                            </div>
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                          </div>
                        ))}
                      </div>

                      {/* Education */}
                      <div className="space-y-4">
                        <Skeleton className="h-6 w-32" />
                        {[...Array(2)].map((_, i) => (
                          <div key={i} className="space-y-2">
                            <div className="flex justify-between">
                              <Skeleton className="h-4 w-40" />
                              <Skeleton className="h-4 w-24" />
                            </div>
                            <Skeleton className="h-4 w-3/4" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}