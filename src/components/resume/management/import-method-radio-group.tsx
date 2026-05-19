import { cn } from "@/lib/utils";
import { Copy } from "lucide-react";
import { Brain } from "lucide-react";
import { ComponentPropsWithoutRef } from "react";

interface ImportMethodRadioItemProps extends ComponentPropsWithoutRef<'input'> {
  title: string;
  description: string;
  icon: React.ReactNode;
  checked?: boolean;
  id: string;
}

function ImportMethodRadioItem({
  title,
  description,
  icon,
  id,
  ...props
}: ImportMethodRadioItemProps) {
  return (
    <label htmlFor={id} className="h-full cursor-pointer">
      <input
        type="radio"
        className="sr-only peer"
        id={id}
        {...props}
      />
      <div
        tabIndex={0}
        className={cn(
          "flex flex-col items-center justify-center rounded-dia-sm p-3",
          "bg-white border-2 shadow-dia h-full",
          "hover:border-foreground/30 hover:bg-dia-canvas",
          "transition-all duration-300",
          "peer-checked:border-foreground peer-checked:bg-dia-canvas",
          "peer-checked:shadow-md",
          "focus:outline-none focus:ring-2 focus:ring-foreground/20"
        )}
      >
        <div className="flex flex-col items-center text-center">
          <div className="h-8 w-8 rounded-dia-btn bg-muted border border-border flex items-center justify-center mb-2">
            <div className="scale-75">
              {icon}
            </div>
          </div>
          <div className="font-medium text-xs text-foreground mb-1">{title}</div>
          <span className="text-xs leading-tight text-muted-foreground">{description}</span>
        </div>
      </div>
    </label>
  );
}

interface ImportMethodRadioGroupProps {
  value: 'import-profile' | 'ai';
  onChange: (value: 'import-profile' | 'ai') => void;
}

export function ImportMethodRadioGroup({ value, onChange }: ImportMethodRadioGroupProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <ImportMethodRadioItem
        name="tailorOption"
        value="ai"
        id="ai-tailor"
        checked={value === 'ai'}
        onChange={() => onChange('ai')}
        title="Tailor with AI"
        description="Let AI analyze the job description and optimize your resume for the best match"
        icon={<Brain className="h-6 w-6 text-muted-foreground" />}
      />

      <ImportMethodRadioItem
        name="tailorOption"
        value="import-profile"
        id="manual-tailor"
        checked={value === 'import-profile'}
        onChange={() => onChange('import-profile')}
        title="Copy Base Resume"
        description="Create a copy of your base resume. Add a job description to link it to a specific position."
        icon={<Copy className="h-6 w-6 text-muted-foreground" />}
      />
    </div>
  );
}
