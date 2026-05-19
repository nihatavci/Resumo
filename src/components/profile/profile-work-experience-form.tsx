'use client';

import { WorkExperience } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import React from "react";

interface ProfileWorkExperienceFormProps {
  experiences: WorkExperience[];
  onChange: (experiences: WorkExperience[]) => void;
}

export function ProfileWorkExperienceForm({ experiences, onChange }: ProfileWorkExperienceFormProps) {
  const addExperience = () => {
    onChange([...experiences, {
      company: "",
      position: "",
      location: "",
      date: "",
      description: [],
      technologies: []
    }]);
  };

  const updateExperience = (index: number, field: keyof WorkExperience, value: string | string[]) => {
    const updated = [...experiences];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeExperience = (index: number) => {
    onChange(experiences.filter((_, i) => i !== index));
  };

  const [techInputs, setTechInputs] = React.useState<{ [key: number]: string }>(
    Object.fromEntries(experiences.map((exp, i) => [i, exp.technologies?.join(', ') || '']))
  );

  React.useEffect(() => {
    setTechInputs(Object.fromEntries(
      experiences.map((exp, i) => [i, exp.technologies?.join(', ') || ''])
    ));
  }, [experiences]);

  return (
    <div className="space-y-3">
      <Accordion
        type="multiple"
        className="space-y-3"
        defaultValue={experiences.map((_, index) => `experience-${index}`)}
      >
        {experiences.map((exp, index) => (
          <AccordionItem
            key={index}
            value={`experience-${index}`}
            className="bg-dia-canvas border border-dia-divider hover:border-border hover:shadow-dia transition-all duration-300 shadow-sm rounded-dia-sm overflow-hidden"
          >
            <AccordionTrigger className="px-4 py-2 hover:no-underline">
              <div className="flex items-center justify-between gap-3 flex-1">
                <div className="flex-1 text-left text-sm font-normal text-foreground">
                  {exp.position || "Untitled Position"} {exp.company && `at ${exp.company}`}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {exp.date && <span>{exp.date}</span>}
                  {exp.technologies && exp.technologies.length > 0 && (
                    <span className="max-w-[200px] truncate">
                      {exp.technologies.join(", ")}
                    </span>
                  )}
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="px-4 pb-4 pt-2 space-y-4">
                {/* Position and Delete Button Row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="relative group flex-1">
                    <Input
                      value={exp.position}
                      onChange={(e) => updateExperience(index, 'position', e.target.value)}
                      className="text-base bg-white border-dia-divider rounded-dia-btn h-8
                        focus:border-foreground/40 focus:ring-1 focus:ring-foreground/10
                        hover:border-border hover:bg-white transition-colors
                        placeholder:text-muted-foreground"
                      placeholder="Position Title"
                    />
                    <div className="absolute -top-2.5 left-2 px-1 bg-white text-[9px] font-normal text-muted-foreground">
                      POSITION
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExperience(index)}
                    className="text-muted-foreground hover:text-red-500 transition-colors duration-300 h-8 w-8"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Company */}
                <div className="relative group">
                  <Input
                    value={exp.company}
                    onChange={(e) => updateExperience(index, 'company', e.target.value)}
                    className="bg-white border-dia-divider rounded-dia-btn h-8
                      focus:border-foreground/40 focus:ring-1 focus:ring-foreground/10
                      hover:border-border hover:bg-white transition-colors
                      placeholder:text-muted-foreground text-sm"
                    placeholder="Company Name"
                  />
                  <div className="absolute -top-2.5 left-2 px-1 bg-white text-[9px] font-normal text-muted-foreground">
                    COMPANY
                  </div>
                </div>

                {/* Date and Location Row */}
                <div className="flex flex-col md:flex-row md:items-start gap-3 text-dia-body">
                  <div className="relative group md:w-1/3">
                    <Input
                      type="text"
                      value={exp.date}
                      onChange={(e) => updateExperience(index, 'date', e.target.value)}
                      className="bg-white border-dia-divider rounded-dia-btn h-8
                        focus:border-foreground/40 focus:ring-1 focus:ring-foreground/10
                        hover:border-border hover:bg-white transition-colors
                        placeholder:text-muted-foreground text-sm"
                      placeholder="e.g., Jan 2023 - Present"
                    />
                    <div className="absolute -top-2.5 left-2 px-1 bg-white text-[9px] font-normal text-muted-foreground">
                      DATE
                    </div>
                  </div>
                  <div className="relative group flex-1">
                    <Input
                      value={exp.location}
                      onChange={(e) => updateExperience(index, 'location', e.target.value)}
                      className="bg-white border-dia-divider rounded-dia-btn h-8
                        focus:border-foreground/40 focus:ring-1 focus:ring-foreground/10
                        hover:border-border hover:bg-white transition-colors
                        placeholder:text-muted-foreground text-sm"
                      placeholder="e.g., Vancouver, BC"
                    />
                    <div className="absolute -top-2.5 left-2 px-1 bg-white text-[9px] font-normal text-muted-foreground">
                      LOCATION
                    </div>
                  </div>
                </div>

                {/* Technologies */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <Label className="text-xs font-normal text-muted-foreground">Technologies & Skills Used</Label>
                    <span className="text-[9px] text-dia-tertiary">Separate with commas</span>
                  </div>
                  <Input
                    value={techInputs[index] || ''}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setTechInputs(prev => ({ ...prev, [index]: newValue }));

                      if (newValue.endsWith(',')) {
                        const technologies = newValue
                          .split(',')
                          .map(t => t.trim())
                          .filter(Boolean);
                        updateExperience(index, 'technologies', technologies);
                      } else {
                        const technologies = newValue
                          .split(',')
                          .map(t => t.trim())
                          .filter(Boolean);
                        updateExperience(index, 'technologies', technologies);
                      }
                    }}
                    onBlur={(e) => {
                      const technologies = e.target.value
                        .split(',')
                        .map(t => t.trim())
                        .filter(Boolean);
                      updateExperience(index, 'technologies', technologies);
                      setTechInputs(prev => ({
                        ...prev,
                        [index]: technologies.join(', ')
                      }));
                    }}
                    placeholder="React, TypeScript, Node.js, etc."
                    className="bg-white border-dia-divider rounded-dia-btn h-8
                      focus:border-foreground/40 focus:ring-1 focus:ring-foreground/10
                      hover:border-border hover:bg-white transition-colors
                      placeholder:text-muted-foreground text-sm"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <Label className="text-xs font-normal text-muted-foreground">Key Responsibilities & Achievements</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const updated = [...experiences];
                        updated[index].description = [...updated[index].description, ""];
                        onChange(updated);
                      }}
                      className="text-foreground hover:text-foreground/80 transition-colors h-7 text-xs"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add Point
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {exp.description.map((desc, descIndex) => (
                      <div key={descIndex} className="flex gap-2 items-start">
                        <div className="flex-1">
                          <Input
                            value={desc}
                            onChange={(e) => {
                              const updated = [...experiences];
                              updated[index].description[descIndex] = e.target.value;
                              onChange(updated);
                            }}
                            placeholder="Start with a strong action verb"
                            className="bg-white border-dia-divider rounded-dia-btn h-8
                              focus:border-foreground/40 focus:ring-1 focus:ring-foreground/10
                              hover:border-border hover:bg-white transition-colors
                              placeholder:text-muted-foreground text-sm"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const updated = [...experiences];
                            updated[index].description = updated[index].description.filter((_, i) => i !== descIndex);
                            onChange(updated);
                          }}
                          className="text-muted-foreground hover:text-red-500 transition-colors duration-300 h-8 w-8"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                    {exp.description.length === 0 && (
                      <div className="text-xs text-muted-foreground italic">
                        Add points to describe your responsibilities and achievements
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <Button
        variant="outline"
        onClick={addExperience}
        className="w-full bg-dia-canvas hover:bg-muted border-dashed border-dia-divider hover:border-border text-foreground hover:text-foreground transition-all duration-300 h-8 text-sm"
      >
        <Plus className="h-3.5 w-3.5 mr-1.5" />
        Add Work Experience
      </Button>
    </div>
  );
}