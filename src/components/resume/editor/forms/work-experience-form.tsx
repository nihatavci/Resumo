'use client';

import { WorkExperience, Profile } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, GripVertical, Check, X, Loader2, Sparkles, ChevronUp, ChevronDown } from "lucide-react";
import { cn, withBasePath } from "@/lib/utils";
import { ImportFromProfileDialog } from "../../management/dialogs/import-from-profile-dialog";
import { ApiErrorDialog } from "@/components/ui/api-error-dialog";

import { useState, useRef, useEffect, memo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import Tiptap from "@/components/ui/tiptap";
import { generateWorkExperiencePoints, improveWorkExperience } from "@/utils/actions/resumes/ai";
import { AIImprovementPrompt } from "../../shared/ai-improvement-prompt";
import { AIGenerationSettingsTooltip } from "../components/ai-generation-tooltip";
import { AISuggestions } from "../../shared/ai-suggestions";


interface AISuggestion {
  id: string;
  point: string;
}

interface WorkExperienceFormProps {
  experiences: WorkExperience[];
  onChange: (experiences: WorkExperience[]) => void;
  profile: Profile;
  targetRole?: string;
}

interface ImprovedPoint {
  original: string;
  improved: string;
}

interface ImprovementConfig {
  [key: number]: { [key: number]: string }; // expIndex -> pointIndex -> prompt
}

// Create a comparison function
function areWorkExperiencePropsEqual(
  prevProps: WorkExperienceFormProps,
  nextProps: WorkExperienceFormProps
) {
  return (
    prevProps.targetRole === nextProps.targetRole &&
    JSON.stringify(prevProps.experiences) === JSON.stringify(nextProps.experiences) &&
    prevProps.profile.id === nextProps.profile.id
  );
}

// Export the memoized component
export const WorkExperienceForm = memo(function WorkExperienceFormComponent({ 
  experiences, 
  onChange, 
  profile, 
  targetRole = "Software Engineer" 
}: WorkExperienceFormProps) {
  const [aiSuggestions, setAiSuggestions] = useState<{ [key: number]: AISuggestion[] }>({});
  const [loadingAI, setLoadingAI] = useState<{ [key: number]: boolean }>({});
  const [loadingPointAI, setLoadingPointAI] = useState<{ [key: number]: { [key: number]: boolean } }>({});
  const [aiConfig, setAiConfig] = useState<{ [key: number]: { numPoints: number; customPrompt: string } }>({});
  const [popoverOpen, setPopoverOpen] = useState<{ [key: number]: boolean }>({});
  const textareaRefs = useRef<{ [key: number]: HTMLTextAreaElement }>({});
  const [improvedPoints, setImprovedPoints] = useState<{ [key: number]: { [key: number]: ImprovedPoint } }>({});
  const [improvementConfig, setImprovementConfig] = useState<ImprovementConfig>({});
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState({ title: '', description: '' });

  const reorderIndexMap = <T,>(map: Record<number, T>, from: number, to: number): Record<number, T> => {
    const updated: Record<number, T> = {};

    Object.entries(map).forEach(([key, value]) => {
      const idx = Number(key);

      if (idx === from) {
        updated[to] = value;
      } else if (from < to && idx > from && idx <= to) {
        updated[idx - 1] = value;
      } else if (from > to && idx >= to && idx < from) {
        updated[idx + 1] = value;
      } else {
        updated[idx] = value;
      }
    });

    return updated;
  };

  // Effect to focus textarea when popover opens
  useEffect(() => {
    Object.entries(popoverOpen).forEach(([index, isOpen]) => {
      if (isOpen && textareaRefs.current[Number(index)]) {
        // Small delay to ensure the popover is fully rendered
        setTimeout(() => {
          textareaRefs.current[Number(index)]?.focus();
        }, 100);
      }
    });
  }, [popoverOpen]);

  const addExperience = () => {
    onChange([{
      company: "",
      position: "",
      location: "",
      date: "",
      description: [],
      technologies: []
    }, ...experiences]);
  };

  const updateExperience = (index: number, field: keyof WorkExperience, value: string | string[]) => {
    const updated = [...experiences];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeExperience = (index: number) => {
    onChange(experiences.filter((_, i) => i !== index));
  };

  const moveExperience = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= experiences.length) return;

    const reorder = <T,>(map: Record<number, T>) => reorderIndexMap(map, index, newIndex);

    const updated = [...experiences];
    const [item] = updated.splice(index, 1);
    updated.splice(newIndex, 0, item);

    setAiSuggestions((prev) => reorder(prev));
    setLoadingAI((prev) => reorder(prev));
    setLoadingPointAI((prev) => reorder(prev));
    setAiConfig((prev) => reorder(prev));
    setPopoverOpen((prev) => reorder(prev));
    setImprovedPoints((prev) => reorder(prev));
    setImprovementConfig((prev) => reorder(prev));
    textareaRefs.current = reorder(textareaRefs.current);

    onChange(updated);
  };

  const handleImportFromProfile = (importedExperiences: WorkExperience[]) => {
    onChange([...importedExperiences, ...experiences]);
  };

  const generateAIPoints = async (index: number) => {
    const exp = experiences[index];
    const config = aiConfig[index] || { numPoints: 3, customPrompt: '' };
    setLoadingAI(prev => ({ ...prev, [index]: true }));
    setPopoverOpen(prev => ({ ...prev, [index]: false }));
    
    try {
      // Get model and API key from local storage
      const MODEL_STORAGE_KEY = 'resumelm-default-model';
      const LOCAL_STORAGE_KEY = 'resumelm-api-keys';

      const selectedModel = localStorage.getItem(MODEL_STORAGE_KEY);
      const storedKeys = localStorage.getItem(LOCAL_STORAGE_KEY);
      let apiKeys = [];

      try {
        apiKeys = storedKeys ? JSON.parse(storedKeys) : [];
      } catch (error) {
        console.error('Error parsing API keys:', error);
      }

      const result = await generateWorkExperiencePoints(
        exp.position,
        exp.company,
        exp.technologies || [],
        targetRole,
        config.numPoints,
        config.customPrompt,
        {
          model: selectedModel || '',
          apiKeys
        }
      );
      
      const suggestions = result.points.map((point: string) => ({
        id: Math.random().toString(36).substr(2, 9),
        point
      }));
      
      setAiSuggestions(prev => ({
        ...prev,
        [index]: suggestions
      }));
    } catch (error: Error | unknown) {
      if (error instanceof Error && (
          error.message.toLowerCase().includes('api key') || 
          error.message.toLowerCase().includes('unauthorized') ||
          error.message.toLowerCase().includes('invalid key') ||
          error.message.toLowerCase().includes('invalid x-api-key'))
      ) {
        setErrorMessage({
          title: "API Key Error",
          description: "There was an issue with your API key. Please check your settings and try again."
        });
      } else {
        setErrorMessage({
          title: "Error",
          description: "Failed to generate AI points. Please try again."
        });
      }
      setShowErrorDialog(true);
    } finally {
      setLoadingAI(prev => ({ ...prev, [index]: false }));
    }
  };

  const approveSuggestion = (expIndex: number, suggestion: AISuggestion) => {
    const updated = [...experiences];
    updated[expIndex].description = [...updated[expIndex].description, suggestion.point];
    onChange(updated);
    
    // Remove the suggestion after approval
    setAiSuggestions(prev => ({
      ...prev,
      [expIndex]: prev[expIndex].filter(s => s.id !== suggestion.id)
    }));
  };

  const deleteSuggestion = (expIndex: number, suggestionId: string) => {
    setAiSuggestions(prev => ({
      ...prev,
      [expIndex]: prev[expIndex].filter(s => s.id !== suggestionId)
    }));
  };

  const rewritePoint = async (expIndex: number, pointIndex: number) => {
    const exp = experiences[expIndex];
    const point = exp.description[pointIndex];
    const customPrompt = improvementConfig[expIndex]?.[pointIndex];
    
    setLoadingPointAI(prev => ({
      ...prev,
      [expIndex]: { ...(prev[expIndex] || {}), [pointIndex]: true }
    }));
    
    try {
      // Get model and API key from local storage
      const MODEL_STORAGE_KEY = 'resumelm-default-model';
      const LOCAL_STORAGE_KEY = 'resumelm-api-keys';

      const selectedModel = localStorage.getItem(MODEL_STORAGE_KEY);
      const storedKeys = localStorage.getItem(LOCAL_STORAGE_KEY);
      let apiKeys = [];

      try {
        apiKeys = storedKeys ? JSON.parse(storedKeys) : [];
      } catch (error) {
        console.error('Error parsing API keys:', error);
      }

      const improvedPoint = await improveWorkExperience(point, customPrompt, {
        model: selectedModel || '',
        apiKeys
      });

      // Store both original and improved versions
      setImprovedPoints(prev => ({
        ...prev,
        [expIndex]: {
          ...(prev[expIndex] || {}),
          [pointIndex]: {
            original: point,
            improved: improvedPoint
          }
        }
      }));

      // Update the experience with the improved version
      const updated = [...experiences];
      updated[expIndex].description[pointIndex] = improvedPoint;
      onChange(updated);
    } catch (error: Error | unknown) {
      if (error instanceof Error && (
          error.message.toLowerCase().includes('api key') || 
          error.message.toLowerCase().includes('unauthorized') ||
          error.message.toLowerCase().includes('invalid key') ||
          error.message.toLowerCase().includes('invalid x-api-key'))
      ) {
        setErrorMessage({
          title: "API Key Error",
          description: "There was an issue with your API key. Please check your settings and try again."
        });
      } else {
        setErrorMessage({
          title: "Error",
          description: "Failed to improve point. Please try again."
        });
      }
      setShowErrorDialog(true);
    } finally {
      setLoadingPointAI(prev => ({
        ...prev,
        [expIndex]: { ...(prev[expIndex] || {}), [pointIndex]: false }
      }));
    }
  };

  const undoImprovement = (expIndex: number, pointIndex: number) => {
    const improvedPoint = improvedPoints[expIndex]?.[pointIndex];
    if (improvedPoint) {
      const updated = [...experiences];
      updated[expIndex].description[pointIndex] = improvedPoint.original;
      onChange(updated);
      
      // Remove the improvement from state
      setImprovedPoints(prev => {
        const newState = { ...prev };
        if (newState[expIndex]) {
          delete newState[expIndex][pointIndex];
          if (Object.keys(newState[expIndex]).length === 0) {
            delete newState[expIndex];
          }
        }
        return newState;
      });
    }
  };

  return (
    <>
      <div className="space-y-2 sm:space-y-3">
        <div className="@container">
          <div className={cn(
            "flex flex-col @[400px]:flex-row gap-2",
            "transition-all duration-300 ease-in-out"
          )}>
            <Button
              variant="outline"
              onClick={addExperience}
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
            >
              <Plus className="h-4 w-4 mr-2 shrink-0" />
              Add Work Experience
            </Button>

            <ImportFromProfileDialog<WorkExperience>
              profile={profile}
              onImport={handleImportFromProfile}
              type="work_experience"
              buttonClassName={cn(
                "flex-1 mb-0 h-9 min-w-[120px]",
                "whitespace-nowrap text-[11px] @[300px]:text-sm"
              )}
            />
          </div>
        </div>

        {experiences.map((exp, index) => (
          <Card 
            key={index} 
            className={cn(
              "relative group transition-all duration-300",
              "bg-muted/30",
              "backdrop-blur-md border border-dia-divider",
              "shadow-dia rounded-dia"
            )}
          >
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-muted rounded-dia-sm p-1.5 cursor-move shadow-dia">
                <GripVertical className="h-4 w-4 text-dia-tertiary" />
              </div>
            </div>
            
            <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
              {/* Header with Delete Button */}
              <div className="space-y-2 sm:space-y-3">
                {/* Position Title - Full Width */}
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="relative flex-1">
                    <Input
                      value={exp.position}
                      onChange={(e) => updateExperience(index, 'position', e.target.value)}
                      className={cn(
                        "text-sm font-medium tracking-tight h-9",
                        "bg-white/50 border-dia-divider rounded-dia-sm",
                        "focus:border-dia-tertiary focus:ring-2 focus:ring-dia-tertiary/20",
                        "hover:border-dia-tertiary hover:bg-white/60 transition-colors",
                        "placeholder:text-dia-tertiary"
                      )}
                      placeholder="Position Title"
                    />
                    <div className="absolute -top-2 left-2 px-1 bg-white/80 text-[7px] sm:text-[9px] font-medium text-dia-tertiary">
                      POSITION
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => removeExperience(index)}
                    className="text-dia-tertiary hover:text-foreground transition-colors duration-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Company and Location Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <div className="relative">
                    <Input
                      value={exp.company}
                      onChange={(e) => updateExperience(index, 'company', e.target.value)}
                      className={cn(
                        "text-sm font-medium bg-white/50 border-dia-divider rounded-dia-sm h-9",
                        "focus:border-dia-tertiary focus:ring-2 focus:ring-dia-tertiary/20",
                        "hover:border-dia-tertiary hover:bg-white/60 transition-colors",
                        "placeholder:text-dia-tertiary"
                      )}
                      placeholder="Company Name"
                    />
                    <div className="absolute -top-2 left-2 px-1 bg-white/80 text-[7px] sm:text-[9px] font-medium text-dia-tertiary">
                      COMPANY
                    </div>
                  </div>
                  <div className="relative">
                    <Input
                      value={exp.location}
                      onChange={(e) => updateExperience(index, 'location', e.target.value)}
                      className={cn(
                        "bg-white/50 border-dia-divider rounded-dia-sm h-9",
                        "focus:border-dia-tertiary focus:ring-2 focus:ring-dia-tertiary/20",
                        "hover:border-dia-tertiary hover:bg-white/60 transition-colors",
                        "placeholder:text-dia-tertiary"
                      )}
                      placeholder="Location"
                    />
                    <div className="absolute -top-2 left-2 px-1 bg-white/80 text-[7px] sm:text-[9px] font-medium text-dia-tertiary">
                      LOCATION
                    </div>
                  </div>
                </div>

                {/* Dates Row */}
                <div className="relative group">
                  <Input
                    type="text"
                    value={exp.date}
                    onChange={(e) => updateExperience(index, 'date', e.target.value)}
                    className={cn(
                      "w-full bg-white/50 border-dia-divider rounded-dia-sm h-9",
                      "focus:border-dia-tertiary focus:ring-2 focus:ring-dia-tertiary/20",
                      "hover:border-dia-tertiary hover:bg-white/60 transition-colors"
                    )}
                    placeholder="e.g., &apos;Jan 2023 - Present&apos; or &apos;2020 - 2022&apos;"
                  />
                  <div className="absolute -top-2 left-2 px-1 bg-white/80 text-[7px] sm:text-[9px] font-medium text-dia-tertiary">
                    DATE
                  </div>
                  <span className="ml-2 text-[8px] sm:text-[10px] text-dia-tertiary">Use &apos;Present&apos; in the date field for current positions</span>
                </div>

                {/* Description Section */}
                <div className="space-y-3">
                  <Label className="text-[11px] md:text-xs font-medium text-muted-foreground">
                    Key Responsibilities & Achievements
                  </Label>
                  <div className="space-y-2 pl-0">
                    {exp.description.map((desc, descIndex) => (
                      <div key={descIndex} className="flex gap-1 items-start group/item">
                        <div className="flex-1">
                          <Tiptap
                            content={desc} 
                            onChange={(newContent) => {
                              const updated = [...experiences];
                              updated[index].description[descIndex] = newContent;
                              onChange(updated);

                              if (improvedPoints[index]?.[descIndex]) {
                                setImprovedPoints(prev => {
                                  const newState = { ...prev };
                                  if (newState[index]) {
                                    delete newState[index][descIndex];
                                    if (Object.keys(newState[index]).length === 0) {
                                      delete newState[index];
                                    }
                                  }
                                  return newState;
                                });
                              }
                            }}
                            className={cn(
                              "min-h-[60px] text-xs md:text-sm bg-white/50 border-dia-divider rounded-dia-sm",
                              "focus:border-dia-tertiary focus:ring-2 focus:ring-dia-tertiary/20",
                              "hover:border-dia-tertiary hover:bg-white/60 transition-colors",
                              "placeholder:text-dia-tertiary",
                              improvedPoints[index]?.[descIndex] && [
                                "border-foreground/30",
                                "bg-muted/60",
                                "shadow-dia",
                                "hover:bg-muted/80"
                              ]
                            )}
                          />

                          {improvedPoints[index]?.[descIndex] && (
                            <div className="absolute -top-2.5 right-12 px-2 py-0.5 bg-muted rounded-full">
                              <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                                <Sparkles className="h-3 w-3" />
                                AI Suggestion
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          {improvedPoints[index]?.[descIndex] ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  // Remove the improvement state after accepting
                                  setImprovedPoints(prev => {
                                    const newState = { ...prev };
                                    if (newState[index]) {
                                      delete newState[index][descIndex];
                                      if (Object.keys(newState[index]).length === 0) {
                                        delete newState[index];
                                      }
                                    }
                                    return newState;
                                  });
                                }}
                                className={cn(
                                  "p-0 group-hover/item:opacity-100",
                                  "h-8 w-8 rounded-dia-sm",
                                  "bg-muted/80 hover:bg-muted",
                                  "text-foreground hover:text-foreground",
                                  "border border-dia-divider",
                                  "shadow-dia",
                                  "transition-all duration-300",
                                  "hover:scale-105 hover:shadow-md",
                                  "hover:-translate-y-0.5"
                                )}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => undoImprovement(index, descIndex)}
                                className={cn(
                                  "p-0 group-hover/item:opacity-100",
                                  "h-8 w-8 rounded-dia-sm",
                                  "bg-muted/80 hover:bg-muted",
                                  "text-muted-foreground hover:text-foreground",
                                  "border border-dia-divider",
                                  "shadow-dia",
                                  "transition-all duration-300",
                                  "hover:scale-105 hover:shadow-md",
                                  "hover:-translate-y-0.5"
                                )}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const updated = [...experiences];
                                  updated[index].description = updated[index].description.filter((_, i) => i !== descIndex);
                                  onChange(updated);
                                }}
                                className="p-0 group-hover/item:opacity-100 text-dia-tertiary hover:text-foreground transition-all duration-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>

                              {/* AI IMPROVEMENT */}
                              <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => rewritePoint(index, descIndex)}
                                      disabled={loadingPointAI[index]?.[descIndex]}
                                      className={cn(
                                        "p-0 group-hover/item:opacity-100",
                                        "h-8 w-8 rounded-dia-sm",
                                        "bg-muted/80 hover:bg-muted",
                                        "text-muted-foreground hover:text-foreground",
                                        "border border-dia-divider",
                                        "shadow-dia",
                                        "transition-all duration-300",
                                        "hover:scale-105 hover:shadow-md",
                                        "hover:-translate-y-0.5"
                                      )}
                                    >
                                      {loadingPointAI[index]?.[descIndex] ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Sparkles className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent 
                                    side="bottom" 
                                    align="start"
                                    sideOffset={2}
                                    className={cn(
                                      "w-72 p-3.5",
                                      "bg-muted",
                                      "border border-dia-divider",
                                      "shadow-dia",
                                      "rounded-dia-sm"
                                    )}
                                  >
                                    <AIImprovementPrompt
                                      value={improvementConfig[index]?.[descIndex] || ''}
                                      onChange={(value) => setImprovementConfig(prev => ({
                                        ...prev,
                                        [index]: {
                                          ...(prev[index] || {}),
                                          [descIndex]: value
                                        }
                                      }))}
                                      onSubmit={() => rewritePoint(index, descIndex)}
                                      isLoading={loadingPointAI[index]?.[descIndex]}
                                    />
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* AI Suggestions */}
                    <AISuggestions
                      suggestions={aiSuggestions[index] || []}
                      onApprove={(suggestion) => approveSuggestion(index, suggestion)}
                      onDelete={(suggestionId) => deleteSuggestion(index, suggestionId)}
                    />

                    {exp.description.length === 0 && !aiSuggestions[index]?.length && (
                      <div className="text-[11px] md:text-xs text-muted-foreground italic px-4 py-3 bg-muted/50 rounded-dia-sm">
                        Add points to describe your responsibilities and achievements
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const updated = [...experiences];
                        updated[index].description = [...updated[index].description, ""];
                        onChange(updated);
                      }}
                      className={cn(
                        "flex-1 text-muted-foreground hover:text-foreground transition-colors text-[10px] sm:text-xs",
                        "border-dia-divider hover:border-dia-tertiary hover:bg-muted/50"
                      )}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Point
                    </Button>


                    {/* AI GENERATION SETTINGS */}
                    <AIGenerationSettingsTooltip
                      index={index}
                      loadingAI={loadingAI[index]}
                      generateAIPoints={generateAIPoints}
                      aiConfig={aiConfig[index] || { numPoints: 3, customPrompt: '' }}
                      onNumPointsChange={(value) => setAiConfig(prev => ({
                        ...prev,
                        [index]: { ...prev[index], numPoints: value }
                      }))}
                      onCustomPromptChange={(value) => setAiConfig(prev => ({
                        ...prev,
                        [index]: { ...prev[index], customPrompt: value }
                      }))}
                      colorClass={{
                        button: "text-muted-foreground",
                        border: "border-dia-divider",
                        hoverBorder: "hover:border-dia-tertiary",
                        hoverBg: "hover:bg-muted/50",
                        tooltipBg: "bg-muted",
                        tooltipBorder: "border border-dia-divider",
                        tooltipShadow: "shadow-dia",
                        text: "text-muted-foreground",
                        hoverText: "hover:text-foreground"
                      }}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveExperience(index, -1)}
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
                      onClick={() => moveExperience(index, 1)}
                      disabled={index === experiences.length - 1}
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
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Add Error Alert Dialog at the end */}
      <ApiErrorDialog
        open={showErrorDialog}
        onOpenChange={setShowErrorDialog}
        errorMessage={errorMessage}
        onUpgrade={() => {
          setShowErrorDialog(false);
          window.location.href = withBasePath('/settings');
        }}
        onSettings={() => {
          setShowErrorDialog(false);
          window.location.href = withBasePath('/settings');
        }}
      />
    </>
  );
}, areWorkExperiencePropsEqual); 
