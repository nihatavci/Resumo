import { cn } from "@/lib/utils";

interface MiniResumePreviewProps {
  name: string;
  type: 'base' | 'tailored';
  updatedAt?: string;
  createdAt?: string;
  target_role?: string;
  className?: string;
}

export function MiniResumePreview({
  name,
  type,
  createdAt,
  className
}: MiniResumePreviewProps) {

  function formatDate(dateString?: string) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  }

  return (
    <div className={cn(
      "relative w-full aspect-[8.5/11]",
      "rounded-dia-sm overflow-hidden",
      "border border-dia-divider shadow-dia",
      "bg-white",
      "transition-all duration-200",
      "hover:shadow-md",
      "group",
      className
    )}>
      <div className="relative h-full p-4 flex flex-col">
        {/* Header */}
        <div className="text-center mb-3 pb-2 border-b border-dia-divider">
          <h3 className="font-normal text-foreground mb-1 line-clamp-2 text-sm">
            {name}
          </h3>
          <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-dia-body">
            {type === 'base' ? 'Base Resume' : 'Tailored Resume'}
          </div>
        </div>

        {/* Mock Resume Content */}
        <div className="flex-1 space-y-4">
          <div className="flex justify-center gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={`contact-${i}`} className="h-1 rounded-full bg-dia-divider w-12" />
            ))}
          </div>

          <div className="space-y-1">
            <div className="h-1.5 w-16 rounded-full bg-dia-button" />
            <div className="space-y-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={`summary-${i}`}
                  className={cn(
                    "h-1 rounded-full bg-dia-divider",
                    i === 0 && "w-[95%]",
                    i === 1 && "w-[85%]",
                    i === 2 && "w-[90%]"
                  )}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <div className="h-1.5 w-20 rounded-full bg-dia-button" />
            {[...Array(2)].map((_, groupIndex) => (
              <div key={`exp-group-${groupIndex}`} className="py-1 space-y-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-1 w-24 rounded-full bg-dia-button" />
                  <div className="h-1 w-16 rounded-full bg-dia-divider" />
                </div>
                {[...Array(2)].map((_, i) => (
                  <div
                    key={`exp-${groupIndex}-${i}`}
                    className={cn(
                      "h-1 rounded-full bg-dia-divider",
                      groupIndex === 0 && i === 0 && "w-[85%]",
                      groupIndex === 0 && i === 1 && "w-[90%]",
                      groupIndex === 1 && i === 0 && "w-[95%]",
                      groupIndex === 1 && i === 1 && "w-[80%]"
                    )}
                  />
                ))}
              </div>
            ))}
          </div>

          <div className="space-y-1">
            <div className="h-1.5 w-14 rounded-full bg-dia-button" />
            <div className="flex flex-wrap gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={`skill-${i}`} className="h-1 rounded-full bg-dia-divider w-16" />
              ))}
            </div>
          </div>
        </div>

        {createdAt && (
          <div className="absolute bottom-2 right-2 text-[10px] text-dia-tertiary">
            {formatDate(createdAt)}
          </div>
        )}
      </div>
    </div>
  );
}
