'use client';

import { Skill } from "@/lib/types";
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

interface ProfileSkillsFormProps {
  skills: Skill[];
  onChange: (skills: Skill[]) => void;
}

export function ProfileSkillsForm({ skills, onChange }: ProfileSkillsFormProps) {
  const addSkill = () => {
    onChange([...skills, {
      category: "",
      items: []
    }]);
  };

  const updateSkill = (index: number, field: keyof Skill, value: Skill[typeof field]) => {
    const updated = [...skills];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeSkill = (index: number) => {
    onChange(skills.filter((_, i) => i !== index));
  };

  const [skillInputs, setSkillInputs] = React.useState<{ [key: number]: string }>(
    Object.fromEntries(skills.map((s, i) => [i, s.items?.join(', ') || '']))
  );

  React.useEffect(() => {
    setSkillInputs(Object.fromEntries(
      skills.map((s, i) => [i, s.items?.join(', ') || ''])
    ));
  }, [skills]);

  return (
    <div className="space-y-3">
      <Accordion
        type="multiple"
        className="space-y-3"
        defaultValue={skills.map((_, index) => `skill-${index}`)}
      >
        {skills.map((skill, index) => (
          <AccordionItem
            key={index}
            value={`skill-${index}`}
            className="bg-dia-canvas border border-dia-divider hover:border-border hover:shadow-dia transition-all duration-300 shadow-sm rounded-dia-sm overflow-hidden"
          >
            <AccordionTrigger className="px-4 py-2 hover:no-underline">
              <div className="flex items-center justify-between gap-3 flex-1">
                <div className="flex-1 text-left text-sm font-normal text-foreground">
                  {skill.category || "New Skill Category"}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {skill.items && skill.items.length > 0 && (
                    <span className="max-w-[300px] truncate">
                      {skill.items.join(", ")}
                    </span>
                  )}
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="px-4 pb-4 pt-2 space-y-4">
                {/* Category and Delete Button Row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="relative group flex-1">
                    <Input
                      value={skill.category}
                      onChange={(e) => updateSkill(index, 'category', e.target.value)}
                      className="text-base bg-white border-dia-divider rounded-dia-btn h-8
                        focus:border-foreground/40 focus:ring-1 focus:ring-foreground/10
                        hover:border-border hover:bg-white transition-colors
                        placeholder:text-muted-foreground"
                      placeholder="e.g., Programming Languages, Frameworks, Tools"
                    />
                    <div className="absolute -top-2.5 left-2 px-1 bg-white text-[9px] font-normal text-muted-foreground">
                      CATEGORY
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSkill(index)}
                    className="text-muted-foreground hover:text-red-500 transition-colors duration-300 h-8 w-8"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Skills */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <Label className="text-xs font-normal text-muted-foreground">Skills</Label>
                    <span className="text-[9px] text-dia-tertiary">Separate with commas</span>
                  </div>
                  <Input
                    value={skillInputs[index] || ''}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setSkillInputs(prev => ({ ...prev, [index]: newValue }));

                      if (newValue.endsWith(',')) {
                        const items = newValue
                          .split(',')
                          .map(t => t.trim())
                          .filter(Boolean);
                        updateSkill(index, 'items', items);
                      } else {
                        const items = newValue
                          .split(',')
                          .map(t => t.trim())
                          .filter(Boolean);
                        updateSkill(index, 'items', items);
                      }
                    }}
                    onBlur={(e) => {
                      const items = e.target.value
                        .split(',')
                        .map(t => t.trim())
                        .filter(Boolean);
                      updateSkill(index, 'items', items);
                      setSkillInputs(prev => ({
                        ...prev,
                        [index]: items.join(', ')
                      }));
                    }}
                    placeholder="e.g., TypeScript, React, Node.js, AWS"
                    className="bg-white border-dia-divider rounded-dia-btn h-8
                      focus:border-foreground/40 focus:ring-1 focus:ring-foreground/10
                      hover:border-border hover:bg-white transition-colors
                      placeholder:text-muted-foreground text-sm"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <Button
        variant="outline"
        onClick={addSkill}
        className="w-full bg-dia-canvas hover:bg-muted border-dashed border-dia-divider hover:border-border text-foreground hover:text-foreground transition-all duration-300 h-8 text-sm"
      >
        <Plus className="h-3.5 w-3.5 mr-1.5" />
        Add Skill Category
      </Button>
    </div>
  );
}