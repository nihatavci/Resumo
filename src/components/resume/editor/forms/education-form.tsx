'use client';

import { Education, Profile } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { ImportFromProfileDialog } from "../../management/dialogs/import-from-profile-dialog";
import { memo } from 'react';
import { cn } from "@/lib/utils";
import Tiptap from "@/components/ui/tiptap";


interface EducationFormProps {
  education: Education[];
  onChange: (education: Education[]) => void;
  profile: Profile;
}

function areEducationPropsEqual(
  prevProps: EducationFormProps,
  nextProps: EducationFormProps
) {
  return (
    JSON.stringify(prevProps.education) === JSON.stringify(nextProps.education) &&
    prevProps.profile.id === nextProps.profile.id
  );
}

export const EducationForm = memo(function EducationFormComponent({
  education,
  onChange,
  profile
}: EducationFormProps) {
  const addEducation = () => {
    onChange([{
      school: "",
      degree: "",
      field: "",
      location: "",
      date: "",
      gpa: undefined,
      achievements: []
    }, ...education]);
  };

  const updateEducation = (index: number, field: keyof Education, value: Education[keyof Education]) => {
    const updated = [...education];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeEducation = (index: number) => {
    onChange(education.filter((_, i) => i !== index));
  };

  const moveEducation = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= education.length) return;

    const updated = [...education];
    const [item] = updated.splice(index, 1);
    updated.splice(newIndex, 0, item);
    onChange(updated);
  };

  const handleImportFromProfile = (importedEducation: Education[]) => {
    onChange([...importedEducation, ...education]);
  };

  return (
    <div className="space-y-2 sm:space-y-3">
      <div className="@container">
        <div className={cn(
          "flex flex-col @[400px]:flex-row gap-2",
          "transition-all duration-300 ease-in-out"
        )}>
          <Button
            variant="outline"
            className={cn(
              "flex-1 h-9 min-w-[120px]",
              "bg-muted/50",
              "hover:bg-muted",
              "border-2 border-dashed border-dia-divider hover:border-dia-tertiary",
              "text-foreground hover:text-foreground",
              "transition-all duration-300",
              "rounded-dia-btn",
              "whitespace-nowrap text-[11px] @[300px]:text-sm"
            )}
            onClick={addEducation}
          >
            <Plus className="h-4 w-4 mr-2 shrink-0" />
            Add Education
          </Button>

          <ImportFromProfileDialog<Education>
            profile={profile}
            onImport={handleImportFromProfile}
            type="education"
            buttonClassName={cn(
              "flex-1 mb-0 h-9 min-w-[120px]",
              "whitespace-nowrap text-[11px] @[300px]:text-sm",
              "bg-muted/50",
              "hover:bg-muted",
              "border-2 border-dashed border-dia-divider hover:border-dia-tertiary",
              "text-foreground hover:text-foreground"
            )}
          />
        </div>
      </div>

      {education.map((edu, index) => (
        <Card 
          key={index} 
          className={cn(
            "relative group transition-all duration-300",
            "bg-muted/30",
            "backdrop-blur-md border border-dia-divider",
            "shadow-dia rounded-dia"
          )}
        >
          <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            <div className="space-y-2 sm:space-y-3">
              {/* School Name and Delete Button Row */}
              <div className="flex items-center justify-between gap-2 sm:gap-3">
                <div className="relative group flex-1 min-w-0">
                  <Input
                    value={edu.school}
                    onChange={(e) => updateEducation(index, 'school', e.target.value)}
                    className={cn(
                      "text-sm font-medium h-9",
                      "bg-white/50 border-dia-divider rounded-dia-sm",
                      "focus:border-dia-tertiary focus:ring-2 focus:ring-dia-tertiary/20",
                      "hover:border-dia-tertiary hover:bg-white/60 transition-colors",
                      "placeholder:text-dia-tertiary"
                    )}
                    placeholder="Institution Name"
                  />
                  <div className="absolute -top-2 left-2 px-1 bg-white/80 text-[7px] sm:text-[9px] font-medium text-muted-foreground">
                    INSTITUTION
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => removeEducation(index)}
                  className="text-dia-tertiary hover:text-foreground transition-colors duration-300"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Location */}
              <div className="relative group">
                <Input
                  value={edu.location}
                  onChange={(e) => updateEducation(index, 'location', e.target.value)}
                  className={cn(
                    "h-9 bg-white/50 border-dia-divider rounded-dia-sm",
                    "focus:border-dia-tertiary focus:ring-2 focus:ring-dia-tertiary/20",
                    "hover:border-dia-tertiary hover:bg-white/60 transition-colors",
                    "placeholder:text-dia-tertiary",
                    "text-[10px] sm:text-xs"
                  )}
                  placeholder="City, Country"
                />
                <div className="absolute -top-2 left-2 px-1 bg-white/80 text-[7px] sm:text-[9px] font-medium text-muted-foreground">
                  LOCATION
                </div>
              </div>

              {/* Degree and Field Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div className="relative group">
                  <Input
                    value={edu.degree}
                    onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                    className={cn(
                      "h-9 bg-white/50 border-dia-divider rounded-dia-sm",
                      "focus:border-dia-tertiary focus:ring-2 focus:ring-dia-tertiary/20",
                      "hover:border-dia-tertiary hover:bg-white/60 transition-colors",
                      "placeholder:text-dia-tertiary",
                      "text-[10px] sm:text-xs"
                    )}
                    placeholder="Bachelor's, Master's, etc."
                  />
                  <div className="absolute -top-2 left-2 px-1 bg-white/80 text-[7px] sm:text-[9px] font-medium text-muted-foreground">
                    DEGREE
                  </div>
                </div>
                <div className="relative group">
                  <Input
                    value={edu.field}
                    onChange={(e) => updateEducation(index, 'field', e.target.value)}
                    className={cn(
                      "h-9 bg-white/50 border-dia-divider rounded-dia-sm",
                      "focus:border-dia-tertiary focus:ring-2 focus:ring-dia-tertiary/20",
                      "hover:border-dia-tertiary hover:bg-white/60 transition-colors",
                      "placeholder:text-dia-tertiary",
                      "text-[10px] sm:text-xs"
                    )}
                    placeholder="Field of Study"
                  />
                  <div className="absolute -top-2 left-2 px-1 bg-white/80 text-[7px] sm:text-[9px] font-medium text-muted-foreground">
                    FIELD OF STUDY
                  </div>
                </div>
              </div>

              {/* Dates Row */}
              <div className="relative group">
                <Input
                  type="text"
                  value={edu.date}
                  onChange={(e) => updateEducation(index, 'date', e.target.value)}
                  className={cn(
                    "w-full h-9 bg-white/50 border-dia-divider rounded-dia-sm",
                    "focus:border-dia-tertiary focus:ring-2 focus:ring-dia-tertiary/20",
                    "hover:border-dia-tertiary hover:bg-white/60 transition-colors",
                    "text-[10px] sm:text-xs"
                  )}
                  placeholder="e.g., &apos;2019 - 2023&apos; or &apos;2020 - Present&apos;"
                />
                <div className="absolute -top-2 left-2 px-1 bg-white/80 text-[7px] sm:text-[9px] font-medium text-muted-foreground">
                  DATE
                </div>
              </div>

              {/* Current Status Note */}
              <div className="flex items-center space-x-2 -mt-1">
                <span className="text-[8px] sm:text-[10px] text-dia-tertiary">Use &apos;Present&apos; in the date field for current education</span>
              </div>

              {/* GPA */}
              <div className="relative group w-full sm:w-1/2 lg:w-1/3">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4.0"
                  value={edu.gpa || ''}
                  onChange={(e) => updateEducation(index, 'gpa', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className={cn(
                    "h-9 bg-white/50 border-dia-divider rounded-dia-sm",
                    "focus:border-dia-tertiary focus:ring-2 focus:ring-dia-tertiary/20",
                    "hover:border-dia-tertiary hover:bg-white/60 transition-colors",
                    "placeholder:text-dia-tertiary",
                    "text-[10px] sm:text-xs"
                  )}
                  placeholder="0.00"
                />
                <div className="absolute -top-2 left-2 px-1 bg-white/80 text-[7px] sm:text-[9px] font-medium text-muted-foreground">
                  GPA (OPTIONAL)
                </div>
              </div>

              {/* Achievements */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <Label className="text-[10px] sm:text-xs font-medium text-muted-foreground">Achievements & Activities</Label>
                  <span className="text-[8px] sm:text-[10px] text-dia-tertiary">One achievement per line</span>
                </div>
                <Tiptap
                  content={(edu.achievements || []).join('\n')}
                  onChange={(newContent) => updateEducation(index, 'achievements', 
                    newContent.split('\n').filter(Boolean)
                  )}
                  editorProps={{
                    attributes: {
                      placeholder: "• Dean's List 2020-2021\n• President of Computer Science Club\n• First Place in Hackathon 2022"
                    }
                  }}
                  className={cn(
                    "min-h-[120px] bg-white/50 border-dia-divider rounded-dia-sm",
                    "focus:border-dia-tertiary focus:ring-2 focus:ring-dia-tertiary/20",
                    "hover:border-dia-tertiary hover:bg-white/60 transition-colors",
                    "placeholder:text-dia-tertiary",
                    "text-[10px] sm:text-xs"
                  )}
                />
              </div>
            </div>
          </CardContent>
          <div className="flex justify-end gap-2 pb-1 pr-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => moveEducation(index, -1)}
              disabled={index === 0}
              className={cn(
                "h-6 w-8 text-muted-foreground hover:text-foreground",
                "bg-white/70 hover:bg-white",
                "border border-dia-divider",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => moveEducation(index, 1)}
              disabled={index === education.length - 1}
              className={cn(
                "h-6 w-8 text-muted-foreground hover:text-foreground",
                "bg-white/70 hover:bg-white",
                "border border-dia-divider",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}, areEducationPropsEqual); 