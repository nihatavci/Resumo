import { cn } from "@/lib/utils";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ReactNode, useRef, useState, useEffect } from "react";

interface ResizablePanelsProps {
  isBaseResume: boolean;
  editorPanel: ReactNode;
  previewPanel: (width: number) => ReactNode;
}

export function ResizablePanels({
  editorPanel,
  previewPanel
}: ResizablePanelsProps) {
  const [previewSize, setPreviewSize] = useState(60);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPercentageRef = useRef(60); // Store last percentage

  // Add function to calculate pixel width
  const updatePixelWidth = () => {
    const containerWidth = containerRef.current?.clientWidth || 0;
    const pixelWidth = Math.floor((containerWidth * lastPercentageRef.current) / 100);
    setPreviewSize(pixelWidth);
  };

  useEffect(() => {
    // Handle window resize
    const handleResize = () => updatePixelWidth();
    window.addEventListener('resize', handleResize);

    // Initial calculation
    updatePixelWidth();

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div ref={containerRef} className="h-full relative">
      <ResizablePanelGroup
        direction="horizontal"
        className={cn(
          "relative h-full rounded-dia-sm",
          "border-border"
        )}
      >
        {/* Editor Panel */}
        <ResizablePanel defaultSize={40} minSize={30} maxSize={70}>
          {editorPanel}
        </ResizablePanel>

        {/* Resize Handle */}
        <ResizableHandle
          withHandle
          className="bg-dia-divider hover:bg-dia-button"
        />

        {/* Preview Panel */}
        <ResizablePanel
          defaultSize={60}
          minSize={30}
          maxSize={70}
          onResize={(size) => {
            lastPercentageRef.current = size; // Store current percentage
            updatePixelWidth();
          }}
          className={cn(
            "shadow-dia overflow-y-scroll"
          )}
        >
          {previewPanel(previewSize)}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
